# Verification and limits

Next Starter provides a tested local client-portal foundation. Production provider
configuration remains the responsibility of each adopter.

## Release checks

The release procedure runs `bun run validate:full`, all five generated profiles,
and `bun run test:local`. These cover unit tests, lint, types, architecture,
dependency audit, production builds, browser smoke checks, local authentication,
migrations, database roles, and tenant isolation.

The client portal uses local PostgreSQL and development email logs for the trial.
No external service accounts are needed for that path. See
[local verification](local-verification.md) for coverage.

## Security boundaries

Server sessions establish identity. Organization membership is resolved again
before application context reads. Database row-level security protects tenant data.
Prefetch hints do not skip proxy checks. Both optional AI routes share a daily
allowance per verified user and deny requests when usage enforcement is unavailable.

## Deployment limits

External billing, OAuth, email delivery, Redis, and AI provider calls are not
verified by the local trial. Mocked tests do not prove live integration behavior.
Hosted environment checks require DEPLOYMENT_ENV or VERCEL_ENV to select preview
or production. Different database URL strings do not prove role isolation.
Run `bun run db:role:check` against your runtime connection. Readiness checks
connectivity, not row-level security.

Generated applications do not update automatically. Review template changes and
migrations before adopting them. Public source and passing checks do not provide
security certification or a support service-level agreement.
