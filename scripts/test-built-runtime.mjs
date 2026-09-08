import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { join, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const directory = resolve(process.argv[2] ?? ".");
async function freePort() {
  const socket = createServer();
  socket.listen(0, "127.0.0.1");
  await once(socket, "listening");
  const port = socket.address().port;
  await new Promise((done) => socket.close(done));
  return port;
}
for (const maintenance of [false, true]) {
  const port = await freePort();
  const base = "http://127.0.0.1:" + port;
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) =>
        !/^(STRIPE_|GOOGLE_|GITHUB_CLIENT_|RESEND_|UPSTASH_|AI_GATEWAY_)/.test(
          key,
        ),
    ),
  );
  Object.assign(env, {
    NODE_ENV: "production",
    DEPLOYMENT_ENV: "development",
    DATABASE_URL: "postgresql://user:password@localhost:55200/ci",
    AUTH_DATABASE_URL: "postgresql://auth:password@localhost:55200/ci",
    DIRECT_DATABASE_URL: "postgresql://migration:password@localhost:55200/ci",
    BETTER_AUTH_SECRET: "ci-build-only-not-a-real-secret-32-chars",
    NEXT_PUBLIC_APP_URL: base,
    BETTER_AUTH_URL: base,
    MAINTENANCE_MODE: maintenance ? "1" : "0",
  });
  const server = spawn(
    "node",
    [
      join(directory, "node_modules/next/dist/bin/next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    { cwd: directory, env, stdio: ["ignore", "pipe", "pipe"] },
  );
  let output = "";
  server.stdout.on("data", (chunk) => {
    output += chunk;
  });
  server.stderr.on("data", (chunk) => {
    output += chunk;
  });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        await fetch(base + "/icon.svg");
        ready = true;
        break;
      } catch {
        await sleep(100);
      }
    }
    assert(ready, "Built server did not start");
    if (maintenance) {
      for (const path of ["/", "/login", "/api/health"]) {
        const response = await fetch(base + path, { redirect: "manual" });
        assert.equal(response.status, 503, path);
        assert.equal(response.headers.get("retry-after"), "600", path);
        assert.equal(response.headers.get("cache-control"), "no-store", path);
        if (path.startsWith("/api")) {
          assert.equal((await response.json()).error, "Service unavailable");
        } else assert.match(await response.text(), /Maintenance in progress/);
      }
      assert.equal((await fetch(base + "/icon.svg")).status, 200);
    } else {
      for (const path of ["/pricing.md", "/schema/pricing.json"]) {
        const response = await fetch(base + path);
        assert.equal(response.status, 404, path);
        assert(
          (await response.text()).length > 0,
          "404 response must not be empty",
        );
        assert.equal(response.headers.get("cache-control"), "no-store", path);
      }
    }
    await sleep(100);
    assert.doesNotMatch(
      output,
      /Failed to update prerender cache|calculateSize returned 0/,
    );
    console.log(
      maintenance
        ? "Built maintenance routing passed."
        : "Built disabled-pricing responses passed.",
    );
  } finally {
    server.kill("SIGTERM");
    await once(server, "exit");
  }
}
