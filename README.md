# Next Starter

Next Starter generates web applications with accounts, organizations, projects,
and optional billing and AI integrations. The client portal is the reference
profile; it includes accounts and workspaces without billing or AI.

This open-source foundation supports customer portals and internal tools. Use it
independently or adapt it with [Raintree Services](https://raintree.technology/services).
Generated applications use public packages and portable agent instructions.

See [verification and limits](docs/release-readiness.md), the
[design system](docs/design-system.md), and the optional
[agent workflows](docs/agent-workflows.md).

## Try the client portal locally

You need Bun 1.3.11, Node 24, and local PostgreSQL server tools. PostgreSQL 18 is
the tested version. Clone [the repository](https://github.com/raintree-technology/raintree-starter)
and enter it first:

```sh
git clone https://github.com/raintree-technology/raintree-starter.git
cd raintree-starter
```

Run these commands from the checkout:

1. Install the dependencies:

   ```sh
   bun install --frozen-lockfile
   ```

2. Create and test a disposable app, then leave it running:

   ```sh
   bun run test:local --keep
   ```

3. Open the URL printed in the terminal. Use the test credentials in the printed
   `fixtures.json` path to sign in.

The command generates a fresh client portal, creates a local PostgreSQL cluster
with separate roles, applies migrations, and runs the role, tenant-isolation,
and 50 authentication checks. It ignores existing database settings and provider
credentials. Verification, reset, and magic links use local development logs;
no external service accounts are needed.

Press Ctrl+C to stop the app and database. Omit `--keep` to stop them automatically
after the checks. Each run uses a new temporary directory and free ports.
Private files remain for diagnosis, including test credentials and email links;
do not commit or share them.

The command finds PostgreSQL tools through `pg_config`, `PATH`, and common
PostgreSQL 18 installation paths on macOS/Linux. It does not install system
software. See [local verification](docs/local-verification.md) for test coverage
and remaining limits.

## Scaffold a project

Use this workflow to create an application you will configure and maintain.
You need Bun 1.3.11 and Node 24. Use Bun for package, script, and lockfile operations.

1. Install this checkout's dependencies:

   ```sh
   bun install --frozen-lockfile
   ```

2. Generate a client portal in a new directory outside this checkout:

   ```sh
   bun run create -- \
     --dir ../acme-portal \
     --name "Acme Portal" \
     --profile client-portal
   ```

3. Enter the generated project:

   ```sh
   cd ../acme-portal
   ```

4. Follow its generated `README.md` to install dependencies, configure the
   database and environment, apply migrations, and start the app.

### Other generation options

Run these commands from the generator checkout to list available choices:

```sh
bun run create -- --list
bun run create -- --list-profiles
```

For a custom selection that includes billing and discovery routes:

```sh
bun run create -- \
  --dir ../acme \
  --name Acme \
  --addons better-auth,stripe,neon,seo,agent-readiness
```

The CLI copies the reusable template, excludes maintainer integrations and private
product files, resolves add-on dependencies, and writes:

- `starter.config.ts` with the selected add-ons and feature flags.
- `.env.example` with only the required and optional variables for that stack.
- `README.md`, portable `AGENTS.md`, and a generated checks workflow.
- A workspace home and navigation using shared components.
- `.scaffold-manifest.json` with selected/disabled add-ons, owned file patterns, env requirements, and Website Specification coverage.

All supported profiles include Better Auth and Postgres. Custom generation also requires
`better-auth` (which selects `neon`); authentication-free output is not supported.
Disabled integrations keep shared package dependencies but do not expose their server plugins.

## Features and implementation

Generated applications use Next.js 16, React 19, Tailwind CSS 4, and strict
TypeScript. Available features depend on the selected profile and configuration.

- **Scaffold CLI:** resolves add-on dependencies and generates configuration,
  documentation, and environment templates. It supports `--all`, `--no-defaults`,
  and `--tenancy single|multi`.
- **Accounts:** Better Auth provides email/password sign-in, verification, reset,
  TOTP two-factor authentication, passkeys, magic links, and optional Google/GitHub
  sign-in. Provider callbacks and hardware passkeys remain outside local test coverage.
- **Database:** Drizzle manages the PostgreSQL schema and migrations. Neon
  connections use the Neon serverless driver; other connections use `pg`.
- **Billing:** Stripe integration includes subscriptions and a customer portal.
  For configured per-seat plans, membership changes trigger seat updates.
  Failed updates require reconciliation; there is no durable retry queue.
- **Organizations:** owners, administrators, members, invitations, and projects.
  Single-tenant mode attaches billing to individual users when billing is enabled.
- **Email:** React Email templates cover verification, password reset, magic links,
  organization invitations, and welcome messages. Resend handles configured delivery.
- **AI:** Vercel AI SDK integration provides streaming chat, optional PostgreSQL
  history, and structured output. Generation requires access to the configured
  model through AI Gateway.
- **Administration:** user management, bans, role changes, and impersonation through
  the Better Auth admin plugin.
- **Security controls:** server-side authorization, tenant row-level security,
  Content Security Policy (CSP), security headers, and optional Upstash rate limiting.
  The proxy's session-cookie check is preliminary; protected server operations
  still check authorization.
- **Discovery and resilience:** metadata, Open Graph images, discovery endpoints,
  loading/error pages, and Website Specification checklist coverage. Coverage does
  not establish accessibility, security, or standards conformance.
- **Development tools:** shadcn/ui components, light/dark themes, typed environment
  validation, Vitest, agent-browser, Biome, Trellis, and Next.js ESLint checks.
  `bun run validate:full` runs the repository's combined validation gate.

## Configure what's built in

[`starter.config.ts`](./starter.config.ts) controls the selected integrations and
tenancy mode. Generation records add-ons in `scaffold.addons` and sets the initial
integration flags. These flags control feature navigation and behavior; disabled
feature routes return 404 where gated. SEO routes also use `scaffold.addons`.

The configuration is shared by server and client code. Keep credentials in the
server environment, not in this file. The example below enables optional
integrations; use the generated configuration as your starting point.

```ts
export const starterConfig = {
  appName: "Acme",
  tenancy: "multi", // or "single"
  scaffold: {
    source: "next-starter",
    websiteSpec: "https://specification.website/checklist",
    addons: ["seo", "accessibility", "security", "better-auth", "stripe", "neon"],
  },
  integrations: {
    oauth: { google: true, github: true },
    billing: true,
    email: true,
    rateLimit: true,
    twoFactor: true,
    passkeys: true,
    magicLink: true,
    ai: { enabled: true, chat: true, structuredOutput: true, persistHistory: true },
  },
} as const;
```

Feature flags and credentials serve different purposes. A flag enables an
integration; the matching environment variables let it connect to its provider.
Missing credentials do not always hide an enabled feature: billing can display a
configuration message, and AI requests can return 503. Disable integrations you
do not intend to configure.

Development email writes links to local logs. Configure email delivery before
using email-dependent account flows in production. Verify each external
integration you enable before relying on it.

AI requires working Upstash usage limits when enabled. Chat and structured generation
share 20 requests per user in a rolling 24-hour window. Both routes return 429 when
that allowance is exhausted and 503 when usage cannot be checked. Each response
allows at most 2,048 output tokens. Chat history is limited to 16,000 serialized
characters and accepts text, reasoning, and step markers; file inputs are rejected.
These limits do not require provider accounts when AI is disabled.

For rate limiting, set `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN`. The proxy uses a short timeout and allows requests
through if the limiter fails. Limiter keys include the app name and surface;
request metadata is trimmed and capped before transmission.

Optional settings are `UPSTASH_RATELIMIT_ANALYTICS=1` for analytics and
`UPSTASH_RATELIMIT_PROTECTION=1` for deny-list checks on request identifiers/IPs.

## Run the source template for maintenance

This workflow runs the reusable source template. Use the generated client portal
above for a disposable evaluation. Prepare a development database and install
Bun 1.3.11 and Node 24 before following these steps.

1. Install dependencies with `bun install --frozen-lockfile`.
2. Copy `.env.example` to `.env`.
3. Set `DATABASE_URL` to your development PostgreSQL connection string and
   `NEXT_PUBLIC_APP_URL` to `http://localhost:3450`.
4. Generate a secret with `openssl rand -base64 32` and save the output as
   `BETTER_AUTH_SECRET` in `.env`.
5. Configure the integrations you intend to use and disable the others in
   `starter.config.ts`.
6. Run `bun run db:migrate` to apply the source migrations to that development database.
7. Run `bun run dev`, then open [the local app](http://localhost:3450).

To create a development administrator, set `SEED_ADMIN_EMAIL` and
`SEED_ADMIN_PASSWORD`, then run `bun run db:seed`.

## Environment

See [`.env.example`](./.env.example) for variable names and requirements.
`lib/env.ts` validates declared settings when the application loads, including
during a build.

Hosted deployments also enforce environment isolation:

- `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` must use HTTPS and share an origin.
- Production must match `CANONICAL_APP_URL`.
- Preview deployments must not target the canonical production origin.
- `DATABASE_URL`, `AUTH_DATABASE_URL`, and `DIRECT_DATABASE_URL` must use
  different credentials for application runtime, Better Auth, and migrations.

Local development may omit the auth and migration URLs; both fall back to
`DATABASE_URL` until dedicated local roles are configured.

## Tenancy modes

`starter.config.ts` sets the `tenancy` mode:

- `multi` (default): users belong to organizations. When billing is enabled,
  subscriptions belong to the organization. Per-seat plans use its member count;
  flat plans do not scale with membership.
- `single`: organization creation is disabled server-side. When billing is enabled,
  subscriptions belong to the user.

Both modes share a schema. Changing the flag does not convert existing ownership
or subscriptions; assess existing data before switching a populated application.

## Regenerating the schema

After changing authentication plugins in `lib/auth.ts`, update the schema in your
working copy before applying it to a database:

1. Run `bun run db:generate-auth` to regenerate `db/schema/auth.ts`.
2. Review the schema changes, then run `bun run db:generate` to create a SQL migration.
3. Review the migration and run `bun run db:migrate` against your development database.

App-owned tables live in `db/schema/app.ts`.

## Project structure

```
app/
  (marketing)/        Public landing + pricing
  (auth)/             Sign in/up, verify, reset, 2FA
  (app)/              Authenticated shell: dashboard, settings, admin
  api/auth/[...all]/  Better Auth handler (+ Stripe webhook)
components/           UI: shadcn/ui (ui/), feature components
db/                   Drizzle client, schema, migrations, seed
emails/               React Email templates
lib/                  auth, env, config, ai, billing, data access, rate limiting
proxy.ts              Request proxy: rate limiting + preliminary session check
starter.config.ts     Integration flags and tenancy mode
```

## Scripts

| Script | Description |
| --- | --- |
| `bun run create` / `scaffold` | Generate a new project from selected add-ons |
| `bun run dev` | Dev server (Turbopack) |
| `bun run build` / `start` | Production build / serve |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | Biome/Trellis policy and Next.js ESLint checks |
| `bun run trellis:todo` | Write a deterministic finding report |
| `bun run test:local` | Create a disposable database and portal, run real local integration checks, then stop |
| `bun run test:profiles` | Generate, install, validate, and build all five profiles |
| `bun run hig:audit` | Explicit HIG Doctor source audit |
| `bun run test` | Vitest unit tests |
| `bun run test:e2e` | agent-browser end-to-end checks |
| `bun run architecture:check` | Enforce route and client/server dependency boundaries |
| `bun run db:role:check` | Reject unsafe runtime database role posture |
| `bun run db:rls:probe` | Run a live two-tenant isolation probe |
| `bun run website-spec:audit` | Print the item-level Website Specification checklist coverage report |
| `bun run db:push` | Push schema to the DB (dev) |
| `bun run db:migrate` | Run SQL migrations |
| `bun run db:studio` | Drizzle Studio |
| `bun run db:seed` | Seed an env-configured admin |

## Deploying to Vercel

Deploy a generated application after configuring and testing its enabled features.
Use that application's `.env.example`; optional variables apply only to the
integrations you enable.

1. Configure the application URLs and a new authentication secret in the Vercel
   project. Apply the hosted-environment requirements above.
2. Configure separate runtime, authentication, and migration database credentials.
   For Neon, use a pooled connection for `DATABASE_URL` and the migration
   connection for `DIRECT_DATABASE_URL`.
3. Configure the providers you enabled:

   - For Stripe billing, set its credentials and prices, then register
     `https://your-domain/api/auth/stripe/webhook` as the webhook endpoint.
   - For Google or GitHub sign-in, set the chosen provider's credentials and
     its callback URL: `https://your-domain/api/auth/callback/google` or
     `https://your-domain/api/auth/callback/github`.
   - Configure email delivery for email-dependent account flows. Add Upstash
     or AI Gateway settings only when using those integrations.
4. Apply reviewed migrations with the migration role before starting code that
   requires the new schema. Test migrations in a separate database first.
5. Build and deploy the generated application, then verify its health, readiness,
   and enabled account/provider flows.

Runtime liveness is exposed at `/api/health`. Dependency readiness is exposed
at `/api/ready` and checks both the application and Better Auth database roles
without returning connection errors or credentials.

## Repository policies

[Contributing](CONTRIBUTING.md) · [Code of Conduct](CODE_OF_CONDUCT.md) ·
[Security](SECURITY.md) · [Changelog](CHANGELOG.md) · [MIT license](LICENSE)

## License

[MIT](LICENSE) applies to Raintree's original material. Dependencies and copied
components retain their own licenses; see [third-party notices](THIRD-PARTY-NOTICES.md).
