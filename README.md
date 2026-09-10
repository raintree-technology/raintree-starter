# Next Starter

Next Starter is a free, MIT-licensed Next.js application starter for customer
portals and internal tools. It includes accounts, workspaces, projects, and
server-side tenant isolation. Billing, email, rate limiting, OAuth, passkeys,
and AI integrations are optional.

The included client portal uses synthetic data. It is a reusable foundation,
not completed client work. Customer-specific onboarding, approvals, provider
configuration, and deployment require adaptation.

See [verification and limits](docs/release-readiness.md), the
[design system](docs/design-system.md), and the optional
[agent workflows](docs/agent-workflows.md).

## Start locally

You need Bun 1.3.11, Node 24, and PostgreSQL. PostgreSQL 18 is the tested
version.

1. Clone the repository and enter it:

   ```sh
   git clone https://github.com/raintree-technology/raintree-starter.git
   cd raintree-starter
   ```

2. Install dependencies:

   ```sh
   bun install --frozen-lockfile
   ```

3. Create the local environment file:

   ```sh
   cp .env.example .env
   ```

4. Set these required values in `.env`:

   ```dotenv
   DATABASE_URL=postgresql://user:password@localhost:5432/database
   BETTER_AUTH_SECRET=replace-with-output-from-openssl
   NEXT_PUBLIC_APP_URL=http://localhost:3450
   ```

   Generate the authentication secret with `openssl rand -base64 32`.

5. Apply the database migrations:

   ```sh
   bun run db:migrate
   ```

6. Start the application:

   ```sh
   bun run dev
   ```

7. Open [http://localhost:3450](http://localhost:3450).

To create a development administrator, set `SEED_ADMIN_EMAIL` and
`SEED_ADMIN_PASSWORD`, then run `bun run db:seed`.

## What is included

- **Accounts:** Email and password sign-in, verification, password reset,
  two-factor authentication, passkeys, magic links, sessions, and optional
  Google and GitHub sign-in through Better Auth.
- **Workspaces:** Organizations, owners, administrators, members, invitations,
  and projects.
- **Database:** PostgreSQL, Drizzle migrations, separate runtime and
  authentication roles, and row-level security for tenant data.
- **Billing:** Optional Stripe subscriptions, customer portal access, and
  per-seat updates.
- **Email:** React Email templates with optional Resend delivery. Development
  writes email links to local logs.
- **AI:** Optional streaming chat, structured output, and PostgreSQL history
  through the Vercel AI SDK and AI Gateway.
- **Security:** Server-side authorization, Content Security Policy, security
  headers, audit events, and optional Upstash rate limiting.
- **Interface:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui components,
  responsive layouts, and light and dark themes.

## Configure the starter

Edit [`starter.config.ts`](starter.config.ts) to set the application name,
tenancy mode, search indexing, and optional integrations. The file contains no
secrets.

```ts
export const starterConfig = {
  appName: "Acme Portal",
  seo: true,
  tenancy: "multi", // or "single"
  integrations: {
    oauth: { google: false, github: false },
    billing: false,
    email: false,
    rateLimit: false,
    twoFactor: true,
    passkeys: true,
    magicLink: true,
    ai: {
      enabled: false,
      chat: false,
      structuredOutput: false,
      persistHistory: false,
    },
  },
  capabilities: { audit: true },
} as const;
```

Feature flags and credentials serve different purposes. A flag enables an
integration. The matching environment variables let it connect to its provider.
Disable integrations you do not intend to configure.

The default configuration uses multi-tenant workspaces, email, rate limiting,
Google and GitHub OAuth, two-factor authentication, passkeys, and magic links.
Billing and AI are disabled.

## Environment

See [`.env.example`](.env.example) for all variables. `lib/env.ts` validates
declared settings when the application loads, including during a build.

Hosted environments enforce these additional boundaries:

- `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` must use HTTPS and share an origin.
- Production must match `CANONICAL_APP_URL`.
- Preview deployments must not target the canonical production origin.
- `DATABASE_URL`, `AUTH_DATABASE_URL`, and `DIRECT_DATABASE_URL` must use
  different credentials for application runtime, Better Auth, and migrations.

Local development may omit the authentication and migration URLs. Both fall
back to `DATABASE_URL` until dedicated local roles are configured.

## Tenancy

`starter.config.ts` supports two tenancy modes:

- `multi` lets users belong to organizations. Billing belongs to the
  organization when enabled.
- `single` disables organization creation. Billing belongs to the user when
  enabled.

Both modes use the same schema. Changing the flag does not convert existing
ownership or subscriptions. Assess existing data before changing a populated
application.

## Authentication schema changes

After changing authentication plugins in `lib/auth.ts`:

1. Run `bun run db:generate-auth` to update `db/schema/auth.ts`.
2. Review the schema changes.
3. Run `bun run db:generate` to create a SQL migration.
4. Review the migration.
5. Run `bun run db:migrate` against a development database.

Application-owned tables live in `db/schema/app.ts`.

## Project structure

```text
app/
  (marketing)/        Public landing and pricing pages
  (auth)/             Sign in, sign up, verification, reset, and 2FA
  (app)/              Dashboard, settings, and administration
  api/auth/[...all]/  Better Auth handler and optional Stripe webhook
components/           Shared and feature interface components
db/                   Drizzle client, schema, migrations, and seed
emails/               Transactional email templates
lib/                  Auth, configuration, AI, billing, and data access
proxy.ts              Rate limiting and preliminary session check
starter.config.ts     Public feature flags and tenancy mode
```

## Checks

| Command | Purpose |
| --- | --- |
| `bun run lint` | Run Biome and Next.js ESLint checks |
| `bun run typecheck` | Check TypeScript types |
| `bun run test` | Run unit and behavior tests |
| `bun run architecture:check` | Check route and client/server boundaries |
| `bun run build:ci` | Build with safe placeholder environment values |
| `bun run test:e2e` | Run browser smoke checks |
| `bun run validate:full` | Run the complete local release gate |
| `bun run test:local` | Test migrations, database roles, tenant isolation, and authentication against disposable local PostgreSQL |

Run `bun run test:local --keep` to leave the tested application and database
running. The terminal prints the URL and private test-credential path. Press
Ctrl+C to stop them. See [local verification](docs/local-verification.md) for
the exact coverage and limits.

## Deployment

Next Starter does not require Vercel. Deploy it on any platform that supports
Next.js and PostgreSQL. Configure the application URLs, a new authentication
secret, and separate runtime, authentication, and migration database roles.

Before production use:

1. Apply reviewed migrations with the migration role.
2. Configure each enabled provider and its callback or webhook URL.
3. Run `bun run validate:full`.
4. Verify `/api/health` and `/api/ready` in the deployed environment.
5. Test each enabled authentication, billing, email, rate-limit, and AI flow.

The readiness endpoint checks connectivity. It does not prove tenant isolation
or provider behavior.

## Independent use and paid implementation

Next Starter is free under [MIT](LICENSE). You can use and adapt it independently
of Raintree Services.

[Raintree Services](https://raintree.technology/services#services-contact) offers
paid workflow adaptation, integrations, and deployment. Each engagement has an
agreed scope, price, and handover. Maintenance is optional and separately scoped.

Public support covers reproducible bugs and documentation. Implementation help
requires a separate engagement, and no support response time is guaranteed.

## Repository policies

[Contributing](CONTRIBUTING.md) · [Code of Conduct](CODE_OF_CONDUCT.md) ·
[Security](SECURITY.md) · [Changelog](CHANGELOG.md) · [MIT license](LICENSE)

Dependencies and copied components retain their own licenses. See
[third-party notices](THIRD-PARTY-NOTICES.md).
