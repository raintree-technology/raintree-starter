#!/usr/bin/env bun

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { cwd, env, exit } from "node:process";
import { setTimeout as sleep } from "node:timers/promises";

const root = cwd();
const port = Number(env.PORT ?? "3450");
const baseUrl = env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${port}`;
const session = `next-starter-smoke-${process.pid}`;

const testEnv = {
  ...env,
  BETTER_AUTH_SECRET:
    env.BETTER_AUTH_SECRET ?? "ci-build-only-not-a-real-secret-32-chars",
  DATABASE_URL:
    env.DATABASE_URL ?? "postgresql://user:password@localhost:55200/ci",
  NEXT_PUBLIC_APP_URL: baseUrl,
};

type RunOptions = {
  allowFailure?: boolean;
  inherit?: boolean;
};

function localBin(name: string) {
  const executable = process.platform === "win32" ? `${name}.cmd` : name;
  const path = join(root, "node_modules", ".bin", executable);
  return existsSync(path) ? path : name;
}

function run(
  command: string,
  args: string[],
  options: RunOptions = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: testEnv,
      stdio: options.inherit ? "inherit" : ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    if (!options.inherit) {
      child.stdout?.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      child.stderr?.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });
    }

    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0 && !options.allowFailure) {
        reject(
          new Error(
            `${command} ${args.join(" ")} failed with exit code ${code}\n${stdout}${stderr}`,
          ),
        );
        return;
      }

      resolve(stdout.trim());
    });
  });
}

async function waitForServer(url: string, timeoutMs = 60_000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        redirect: "manual",
      });
      if (response.status < 500) return;
    } catch {
      await sleep(500);
    }
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function browser(args: string[], options?: RunOptions) {
  return run(
    localBin("agent-browser"),
    ["--session", session, ...args],
    options,
  );
}

async function assertNoErrorOverlay() {
  const result = await browser([
    "eval",
    'document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay") ? "ERROR_OVERLAY" : "OK"',
  ]);

  if (!result.includes("OK")) {
    throw new Error(`Browser error overlay detected: ${result}`);
  }
}

async function assertBodyIncludes(pathname: string, expectedText: string[]) {
  await browser(["open", new URL(pathname, baseUrl).toString()]);
  await browser(["wait", "--text", expectedText[0]]);
  await assertNoErrorOverlay();

  const body = await browser(["get", "text", "body"]);
  for (const text of expectedText) {
    if (!body.includes(text)) {
      throw new Error(`${pathname} did not include expected text: ${text}`);
    }
  }
}

async function cleanup(server: ReturnType<typeof spawn>) {
  if (env.AGENT_BROWSER_KEEP_OPEN !== "1") {
    await browser(["close"], { allowFailure: true });
  }

  if (server.exitCode === null) {
    server.kill("SIGTERM");
    await sleep(1_000);
  }

  if (server.exitCode === null) {
    server.kill("SIGKILL");
  }
}

async function main() {
  const next = spawn(
    localBin("next"),
    ["dev", "--turbopack", "--port", String(port)],
    {
      cwd: root,
      env: testEnv,
      stdio: env.AGENT_BROWSER_VERBOSE === "1" ? "inherit" : "ignore",
    },
  );

  try {
    await waitForServer(baseUrl);

    await assertBodyIncludes("/login", ["Sign in"]);

    const title = await browser(["get", "title"]);
    if (!title.includes("Sign in")) {
      throw new Error(`Unexpected page title: ${title}`);
    }

    const hasPrivateOverlay = existsSync(join(root, "app/command-center"));
    if (hasPrivateOverlay) {
      for (const [path, destination] of [
        ["/", "/command-center"],
        ["/command-center", "/login"],
      ]) {
        const response = await fetch(new URL(path, baseUrl), {
          redirect: "manual",
        });
        if (
          response.status < 300 ||
          response.status >= 400 ||
          !response.headers.get("location")?.includes(destination)
        ) {
          throw new Error(`${path} did not redirect to ${destination}`);
        }
      }
    }
    if (!hasPrivateOverlay) {
      await assertBodyIncludes("/", ["Reference workspace"]);
      await browser(["set", "viewport", "390", "844"]);
      await browser(["press", "Tab"]);
      await assertNoErrorOverlay();
    }

    const dashboardResponse = await fetch(new URL("/dashboard", baseUrl), {
      cache: "no-store",
      redirect: "manual",
    });
    const location = dashboardResponse.headers.get("location") ?? "";
    if (
      dashboardResponse.status < 300 ||
      dashboardResponse.status >= 400 ||
      !location.includes("/login")
    ) {
      throw new Error(
        `/dashboard did not redirect to login: ${dashboardResponse.status} ${location}`,
      );
    }

    console.log("agent-browser smoke checks passed");
  } finally {
    await cleanup(next);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  exit(1);
});
