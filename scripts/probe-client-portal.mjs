import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2];
const baseUrl = process.argv[3] ?? "http://localhost:3452";
if (
  !root ||
  JSON.parse(readFileSync(join(root, ".scaffold-manifest.json"), "utf8"))
    .profile !== "client-portal"
) {
  throw new Error(
    "Supply the generated client-portal directory as the first argument.",
  );
}
if (!["localhost", "127.0.0.1"].includes(new URL(baseUrl).hostname)) {
  throw new Error("This probe only supports a local test server.");
}
mkdirSync("test-results/functionality", { recursive: true });
const output = "test-results/functionality/http.json";
const records = [];
const walk = (p) =>
  readdirSync(p, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(p, e.name)) : [join(p, e.name)],
  );
const routes = walk(join(root, "app"))
  .filter((p) => /\/(page|route)\.tsx?$/.test(p))
  .map(
    (p) =>
      p
        .slice((root + "/app").length)
        .replace(/\/\([^/]+\)/g, "")
        .replace(/\/(page|route)\.tsx?$/, "") || "/",
  );
for (let path of routes) {
  if (path.includes("[...all]")) path = path.replace("[...all]", "get-session");
  if (path.includes("[id]")) path = path.replace("[id]", "test-missing-id");
  let statuses = [200];
  if (/^\/(dashboard|settings|admin|onboarding)(\/|$)/.test(path))
    statuses = [307, 302, 303];
  if (["/pricing", "/pricing.md", "/schema/pricing.json"].includes(path))
    statuses = [404];
  if (["/api/ai/object", "/api/chat"].includes(path)) statuses = [405];
  if (path === "/api/ready") statuses = [503];
  if (path === "/api/rate-limited") statuses = [429];
  if (path === "/maintenance-response") statuses = [503];
  if (path === "/accept-invitation/test-missing-id") statuses = [200];
  if (["/.well-known/change-password"].includes(path))
    statuses = [307, 308, 302, 303];
  await check(path, "GET", statuses);
}
for (const path of [
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/opengraph-image",
  "/favicon.ico",
  "/icon.svg",
  "/offline.html",
  "/sw.js",
  "/sw-register.js",
  "/404.html",
  "/500.html",
])
  await check(path, "GET", [200]);
await check("/definitely-missing-functionality-test", "GET", [404]);
for (const path of ["/api/chat", "/api/ai/object"])
  await check(path, "POST", [404], {});
await check("/ask", "POST", [200], { query: "privacy" });
await check("/ask", "POST", [400], "{");
await check("/ask", "POST", [400], { query: 12 });
await check("/api/reports", "POST", [204], { type: "csp-violation", body: {} });
for (const path of routes.filter((p) => p.startsWith("/api/")))
  await check(
    path.replace("[...all]", "get-session"),
    "OPTIONS",
    path === "/api/rate-limited" ? [429] : [204, 200],
  );
writeFileSync(output, JSON.stringify(records, null, 2) + "\n");
process.exitCode = records.some((r) => !r.passed) ? 1 : 0;
console.log(
  JSON.stringify(
    { total: records.length, failed: records.filter((r) => !r.passed) },
    null,
    2,
  ),
);
async function check(path, method, statuses, body) {
  try {
    const response = await fetch(baseUrl + path, {
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(12000),
      headers: body ? { "content-type": "application/json" } : undefined,
      body:
        body === undefined
          ? undefined
          : typeof body === "string"
            ? body
            : JSON.stringify(body),
    });
    const text = await response.text();
    const location = response.headers.get("location");
    let passed = statuses.includes(response.status);
    if (/^\/(dashboard|settings|admin|onboarding)(\/|$)/.test(path))
      passed &&= !!location?.includes("/login?redirect=");
    if (path === "/api/health" && method === "GET")
      passed &&= JSON.parse(text).ok === true;
    if (path === "/api/ready")
      passed &&= !text.includes("password") && !text.includes("postgresql");
    if (path === "/accept-invitation/test-missing-id")
      passed &&= text.includes("/login?redirect=");
    if (path === "/sitemap.xml")
      passed &&= !text.includes("/pricing") && !text.includes("/dashboard");
    records.push({
      path,
      method,
      status: response.status,
      expected: statuses,
      location,
      type: response.headers.get("content-type"),
      passed,
    });
  } catch (e) {
    records.push({ path, method, passed: false, error: e.message });
  }
}
