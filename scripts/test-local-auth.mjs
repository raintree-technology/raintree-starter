import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { Client } = require("pg");
const meta = { directory: process.argv[2] };
if (!meta.directory) throw Error("Supply the disposable database directory.");
const env = JSON.parse(readFileSync(meta.directory + "/env.json"));
const base = env.NEXT_PUBLIC_APP_URL;
if (
  !["localhost", "127.0.0.1"].includes(new URL(base).hostname) ||
  [env.DATABASE_URL, env.RLS_OWNER_DATABASE_URL].some((value) => {
    const url = new URL(value);
    return (
      !["localhost", "127.0.0.1"].includes(url.hostname) ||
      url.pathname !== "/next_starter_test"
    );
  })
)
  throw Error("Only the disposable local test database is supported.");
mkdirSync("test-results/functionality", { recursive: true });
const results = [];
const suffix = Date.now();
const identities = {};
function check(name, ok) {
  results.push({ name, passed: !!ok });
  console.log(name, ok ? "PASS" : "FAIL");
  if (!ok) throw Error(name);
}
function actor() {
  return { cookies: {} };
}
async function call(who, path, body, method) {
  const response = await fetch(base + "/api/auth" + path, {
    method: method ?? (body ? "POST" : "GET"),
    headers: {
      "content-type": "application/json",
      origin: base,
      cookie: Object.entries(who.cookies)
        .map(([k, v]) => k + "=" + v)
        .join("; "),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  for (const header of response.headers.getSetCookie()) {
    const pair = header.split(";")[0];
    const i = pair.indexOf("=");
    who.cookies[pair.slice(0, i)] = pair.slice(i + 1);
  }
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = {};
  }
  return {
    status: response.status,
    data,
    location: response.headers.get("location"),
  };
}
async function emailLink(email, template) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const logs = readFileSync(meta.directory + "/app.log", "utf8")
      .split("\n")
      .flatMap((line) => {
        try {
          return [JSON.parse(line)];
        } catch {
          return [];
        }
      });
    const row = logs.findLast(
      (row) => row.to === email && row.template === template && row.actionUrl,
    );
    if (row) return row.actionUrl;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error("Local email link unavailable: " + template);
}
async function make(name) {
  const user = actor();
  user.email = name.toLowerCase() + "-" + suffix + "@example.test";
  user.password = randomBytes(18).toString("hex");
  let result = await call(user, "/sign-up/email", {
    name,
    email: user.email,
    password: user.password,
  });
  check(name + " signup", result.status === 200);
  user.id = result.data.user.id;
  result = await call(user, "/sign-in/email", {
    email: user.email,
    password: user.password,
  });
  check(name + " unverified login refused", result.status === 403);
  const link = await emailLink(user.email, "verify-email");
  const response = await fetch(link, { redirect: "manual" });
  check(
    name + " local verification link",
    response.status === 200 || response.status === 302,
  );
  result = await call(user, "/sign-in/email", {
    email: user.email,
    password: user.password,
  });
  check(name + " verified login", result.status === 200);
  identities[name] = user;
  return user;
}
try {
  const owner = await make("Owner"),
    member = await make("Member"),
    outsider = await make("Outsider");
  let r = await call(owner, "/organization/create", {
    name: "Local Workspace A",
    slug: "local-a-" + suffix,
  });
  check("Create organization A", r.status === 200);
  const org = r.data.id;
  r = await call(outsider, "/organization/create", {
    name: "Local Workspace B",
    slug: "local-b-" + suffix,
  });
  check("Create organization B", r.status === 200);
  const otherOrg = r.data.id;
  r = await call(owner, "/organization/set-active", { organizationId: org });
  check("Set active organization", r.status === 200);
  r = await call(outsider, "/organization/set-active", { organizationId: org });
  check("Outsider cannot select organization A", r.status >= 400);
  r = await call(owner, "/organization/invite-member", {
    email: member.email,
    role: "member",
    organizationId: org,
  });
  check("Owner invitation", r.status === 200);
  const invitationId = r.data.id;
  r = await call(outsider, "/organization/accept-invitation", { invitationId });
  check("Wrong user cannot accept invitation", r.status >= 400);
  r = await call(member, "/organization/accept-invitation", { invitationId });
  check("Invited user accepts", r.status === 200);
  r = await call(member, "/organization/set-active", { organizationId: org });
  check("Member selects organization", r.status === 200);
  r = await call(member, "/organization/invite-member", {
    email: "another@example.test",
    role: "admin",
    organizationId: org,
  });
  check("Ordinary member cannot invite admin", r.status >= 400);
  r = await call(member, "/admin/list-users");
  check("Nonadmin cannot list users", r.status === 403);
  const db = new Client({ connectionString: env.RLS_OWNER_DATABASE_URL });
  await db.connect();
  await db.query('update "user" set role=$1 where id=$2', ["admin", owner.id]);
  await db.end();
  const admin = actor();
  r = await call(admin, "/sign-in/email", {
    email: owner.email,
    password: owner.password,
  });
  check("Admin login after fixture promotion", r.status === 200);
  r = await call(admin, "/admin/list-users");
  check("Admin can list users", r.status === 200 && r.data.users.length >= 3);
  r = await call(member, "/list-sessions");
  check("Session listing", r.status === 200 && Array.isArray(r.data));
  const second = actor();
  await call(second, "/sign-in/email", {
    email: member.email,
    password: member.password,
  });
  const session = await call(second, "/get-session");
  r = await call(member, "/revoke-session", {
    token: session.data.session.token,
  });
  check("Revoke another session", r.status === 200);
  r = await call(second, "/get-session");
  check("Revoked session rejected", r.data === null);
  r = await call(owner, "/organization/remove-member", {
    memberIdOrEmail: member.email,
    organizationId: org,
  });
  check("Owner removes member", r.status === 200);
  r = await call(
    member,
    "/organization/get-full-organization?organizationId=" + org,
  );
  check("Removed member cannot read organization", r.status >= 400);
  r = await call(member, "/sign-out", {});
  check("Sign out", r.status === 200);
  r = await call(member, "/get-session");
  check("Signed-out session rejected", r.data === null);
  writeFileSync(
    meta.directory + "/fixtures.json",
    JSON.stringify({ identities, org, otherOrg, admin }, null, 2),
    { mode: 0o600 },
  );
} finally {
  writeFileSync(
    "test-results/functionality/local-auth.json",
    JSON.stringify(results, null, 2),
  );
}

const fixture = JSON.parse(readFileSync(meta.directory + "/fixtures.json"));
const owner = fixture.identities.Owner,
  member = fixture.identities.Member,
  outsider = fixture.identities.Outsider;
try {
  let r = await call(fixture.admin, "/admin/impersonate-user", {
    userId: outsider.id,
  });
  check(
    "Admin impersonation",
    r.status === 200 && r.data.user.id === outsider.id,
  );
  r = await call(fixture.admin, "/admin/stop-impersonating", {});
  check("Stop impersonation", r.status === 200);
  r = await call(fixture.admin, "/get-session");
  check("Admin identity restored", r.data.user.id === owner.id);
  r = await call(fixture.admin, "/admin/ban-user", {
    userId: member.id,
    banReason: "Disposable test",
  });
  check("Admin ban", r.status === 200);
  const anonymous = actor();
  r = await call(anonymous, "/sign-in/email", {
    email: member.email,
    password: member.password,
  });
  check("Banned account denied login", r.status === 403);
  r = await call(fixture.admin, "/admin/unban-user", { userId: member.id });
  check("Admin unban", r.status === 200);
  r = await call(anonymous, "/sign-in/email", {
    email: member.email,
    password: member.password,
  });
  check("Unbanned account can sign in", r.status === 200);
  r = await call(anonymous, "/two-factor/enable", {
    password: member.password,
  });
  check("Two-factor setup", r.status === 200 && !!r.data.totpURI);
  const { createOTP } = require("@better-auth/utils/otp");
  const { base32 } = require("@better-auth/utils/base32");
  const secret = new TextDecoder().decode(
    base32.decode(new URL(r.data.totpURI).searchParams.get("secret")),
  );
  const code = await createOTP(secret).totp();
  r = await call(anonymous, "/two-factor/verify-totp", { code });
  check("Two-factor enrollment confirmed", r.status === 200);
  const challenge = actor();
  r = await call(challenge, "/sign-in/email", {
    email: member.email,
    password: member.password,
  });
  check(
    "Enabled two-factor challenges login",
    r.status === 200 && r.data.twoFactorRedirect === true,
  );
  r = await call(challenge, "/two-factor/verify-totp", {
    code: await createOTP(secret).totp(),
  });
  check("Valid TOTP completes login", r.status === 200);
  r = await call(challenge, "/two-factor/disable", {
    password: member.password,
  });
  check("Two-factor disabled locally", r.status === 200);
  r = await call(actor(), "/sign-in/magic-link", {
    email: outsider.email,
    callbackURL: "/dashboard",
  });
  check("Local magic-link request", r.status === 200);
  const magicUrl = await emailLink(outsider.email, "magic-link");
  const magic = actor();
  r = await call(
    magic,
    magicUrl.slice((base + "/api/auth").length),
    undefined,
    "GET",
  );
  check("Local magic-link consumption", r.status === 302 || r.status === 200);
  r = await call(magic, "/get-session");
  check(
    "Magic link establishes correct identity",
    r.data?.user?.id === outsider.id,
  );
  r = await call(actor(), "/request-password-reset", {
    email: member.email,
    redirectTo: base + "/reset-password",
  });
  check("Local reset request", r.status === 200);
  const resetUrl = await emailLink(member.email, "reset-password");
  const redirect = await fetch(resetUrl, { redirect: "manual" });
  const token = new URL(
    redirect.headers.get("location"),
    base,
  ).searchParams.get("token");
  const newPassword = randomBytes(18).toString("hex");
  r = await call(actor(), "/reset-password", { token, newPassword });
  check("Local reset token consumed", r.status === 200);
  r = await call(actor(), "/sign-in/email", {
    email: member.email,
    password: member.password,
  });
  check("Old password rejected", r.status === 401);
  r = await call(actor(), "/sign-in/email", {
    email: member.email,
    password: newPassword,
  });
  check("New password accepted", r.status === 200);
  member.password = newPassword;
  writeFileSync(
    meta.directory + "/fixtures.json",
    JSON.stringify(fixture, null, 2),
    { mode: 0o600 },
  );
} finally {
  writeFileSync(
    "test-results/functionality/local-auth.json",
    JSON.stringify(results, null, 2),
  );
}
