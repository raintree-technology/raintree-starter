import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import {
  chmodSync,
  closeSync,
  existsSync,
  mkdtempSync,
  openSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const keep = process.argv.slice(2).includes("--keep");
if (process.argv.slice(2).some((arg) => arg !== "--keep")) {
  throw new Error("Usage: bun run test:local [--keep]");
}
if (process.versions.node.split(".")[0] !== "24") {
  throw new Error("Local tests require Node 24.");
}
if (
  spawnSync("bun", ["--version"], { encoding: "utf8" }).stdout?.trim() !==
  "1.3.11"
) {
  throw new Error("Local tests require Bun 1.3.11.");
}
const configured = spawnSync("pg_config", ["--bindir"], { encoding: "utf8" });
const pgBin = [
  configured.stdout?.trim(),
  ...(process.env.PATH ?? "").split(":"),
  "/opt/homebrew/opt/postgresql@18/bin",
  "/usr/local/opt/postgresql@18/bin",
  "/usr/lib/postgresql/18/bin",
].find(
  (path) =>
    path && ["initdb", "pg_ctl"].every((name) => existsSync(join(path, name))),
);
if (!pgBin)
  throw new Error(
    "Install PostgreSQL 18 locally or put its bin directory on PATH.",
  );

const directory = mkdtempSync(join(tmpdir(), "next-starter-local-"));
chmodSync(directory, 0o700);
const data = join(directory, "data");
const log = openSync(join(directory, "setup.log"), "a", 0o600);
const appLog = openSync(join(directory, "app.log"), "a", 0o600);
// Only operating-system settings cross into the disposable environment.
const env = Object.fromEntries(
  ["PATH", "HOME", "USER", "LOGNAME", "TMPDIR", "LANG", "LC_ALL", "SystemRoot"]
    .filter((key) => process.env[key] !== undefined)
    .map((key) => [key, process.env[key]]),
);
const abort = new AbortController();
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => abort.abort());
}
async function run(command, args, cwd = root, cancellable = true) {
  const child = spawn(command, args, {
    cwd,
    env,
    stdio: ["ignore", log, log],
    ...(cancellable ? { signal: abort.signal } : {}),
  });
  const code = await new Promise((resolve, reject) => {
    let failure;
    child.once("error", (error) => {
      failure = error;
    });
    child.once("close", (status) =>
      failure ? reject(failure) : resolve(status),
    );
  });
  if (code !== 0)
    throw new Error(
      `${command} ${args[0]} failed; inspect ${directory}/setup.log`,
    );
}
async function freePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
async function sql(connectionString, statements) {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    for (const statement of statements) await client.query(statement);
  } finally {
    await client.end();
  }
}

let app;
let appClosed;
try {
  console.log(`Preparing disposable local tests: ${directory}`);
  const port = await freePort();
  const roles = Object.fromEntries(
    ["local_admin", "app_migration", "app_auth", "app_runtime"].map((role) => [
      role,
      randomBytes(24).toString("hex"),
    ]),
  );
  const url = (role, database = "next_starter_test") =>
    `postgresql://${role}:${roles[role]}@127.0.0.1:${port}/${database}`;
  const passwordFile = join(directory, "bootstrap-password");
  writeFileSync(passwordFile, roles.local_admin, { mode: 0o600 });
  await run(join(pgBin, "initdb"), [
    "-D",
    data,
    "-U",
    "local_admin",
    "--auth-local=reject",
    "--auth-host=scram-sha-256",
    `--pwfile=${passwordFile}`,
  ]);
  await run(join(pgBin, "pg_ctl"), [
    "-D",
    data,
    "-l",
    join(directory, "postgres.log"),
    "-o",
    `-h 127.0.0.1 -p ${port} -k ''`,
    "-w",
    "start",
  ]);
  await sql(url("local_admin", "postgres"), [
    ...["app_migration", "app_auth", "app_runtime"].map(
      (role) =>
        `CREATE ROLE ${role} LOGIN PASSWORD '${roles[role]}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS`,
    ),
    "CREATE DATABASE next_starter_test OWNER app_migration",
  ]);
  const appPort = await freePort();
  const base = `http://localhost:${appPort}`;
  Object.assign(env, {
    NODE_ENV: "development",
    DEPLOYMENT_ENV: "development",
    NEXT_TELEMETRY_DISABLED: "1",
    DATABASE_URL: url("app_runtime"),
    AUTH_DATABASE_URL: url("app_auth"),
    DIRECT_DATABASE_URL: url("app_migration"),
    RLS_OWNER_DATABASE_URL: url("local_admin"),
    RLS_TEST_DATABASE_URL: url("app_runtime"),
    BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
    NEXT_PUBLIC_APP_URL: base,
    BETTER_AUTH_URL: base,
  });
  writeFileSync(join(directory, "env.json"), JSON.stringify(env), {
    mode: 0o600,
  });
  console.log("Testing the starter application.");
  console.log("Applying migrations and checking database isolation.");
  await run("bun", ["run", "db:migrate"]);
  await sql(url("local_admin"), [
    "REVOKE CREATE ON SCHEMA public FROM PUBLIC",
    "GRANT USAGE ON SCHEMA public TO app_auth, app_runtime",
    "GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_runtime",
    "GRANT INSERT, UPDATE, DELETE ON project, chat, message TO app_runtime",
    "GRANT INSERT ON audit_event TO app_runtime",
    'GRANT SELECT, INSERT, UPDATE, DELETE ON "user", session, account, verification, two_factor, passkey, organization, member, invitation, subscription TO app_auth',
  ]);
  await run("bun", ["run", "db:role:check"]);
  await run("bun", ["run", "db:rls:probe"]);
  console.log("Starting the local app and testing authentication.");
  app = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(appPort),
    ],
    { cwd: root, env, stdio: ["ignore", appLog, appLog] },
  );
  appClosed = new Promise((resolve) => {
    app.once("close", resolve);
    app.once("error", resolve);
  });
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    abort.signal.throwIfAborted();
    if (app.exitCode !== null)
      throw new Error(`Local app exited; inspect ${directory}/app.log`);
    try {
      const response = await fetch(base + "/api/health", {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* The development server may still be compiling. */
    }
    await sleep(500, undefined, { signal: abort.signal });
  }
  if (!ready)
    throw new Error(`Local app did not start; inspect ${directory}/app.log`);
  await run(process.execPath, ["scripts/test-local-auth.mjs", directory]);
  const results = JSON.parse(
    readFileSync(
      join(root, "test-results/functionality/local-auth.json"),
      "utf8",
    ),
  );
  if (!results.length || results.some((result) => !result.passed))
    throw new Error("Local authentication checks failed.");
  console.log(
    `Passed ${results.length} authentication checks, migrations, role checks, and tenant isolation.`,
  );
  if (keep) {
    abort.signal.throwIfAborted();
    console.log(
      `App ready at ${base}. Test credentials: ${directory}/fixtures.json. Press Ctrl+C to stop.`,
    );
    await Promise.race([
      appClosed,
      new Promise((resolve) =>
        abort.signal.addEventListener("abort", resolve, { once: true }),
      ),
    ]);
    if (!abort.signal.aborted)
      throw new Error(`Local app exited; inspect ${directory}/app.log`);
  }
} catch (error) {
  if (!abort.signal.aborted)
    console.error(
      error instanceof Error ? error.message : "Local tests failed.",
    );
  process.exitCode = abort.signal.aborted ? 130 : 1;
} finally {
  if (app && app.exitCode === null) app.kill("SIGTERM");
  if (appClosed) await appClosed;
  if (existsSync(join(data, "postmaster.pid"))) {
    try {
      await run(
        join(pgBin, "pg_ctl"),
        ["-D", data, "-w", "stop", "-m", "fast"],
        root,
        false,
      );
    } catch {
      console.error(
        `Could not stop the disposable database. Inspect ${directory}/setup.log`,
      );
      process.exitCode = 1;
    }
  }
  closeSync(log);
  closeSync(appLog);
  console.log(`Private test files retained at ${directory}.`);
}
