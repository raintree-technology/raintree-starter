# Changelog

This file records user-visible changes to the starter, scaffold profiles, add-ons, generated-project contract, migrations, environment requirements, and compatibility.

## 0.1.0 — 2026-09-08

- Add pinned Biome and Trellis development checks while retaining Next.js ESLint.
- Fix generated-profile test coupling and internal-tool default resolution.
- Exclude workstation agent settings, private tests, environment files, symlinks,
  and unusable generator commands from generated applications.
- Add portable agent instructions, optional research recipes, and profile builds.
- Add workspace entry screens, stronger contrast, and profile-aware discovery.
- Recheck active organization membership before app context reads; derive billing
  seats on the server and synchronize accepted invitations without scaling flat plans.
- Return maintenance 503 responses through a routable handler and prevent empty
  disabled-pricing responses from failing prerender cache writes.
- Remove subscription limits and billing navigation when billing is disabled.
- Check sessions against storage on every request so revocation takes effect immediately.
- Add the two-factor lockout fields required by the installed authentication package.
- Add built-server regressions and disposable local authentication tests.
- Add `bun run test:local` for repeatable local setup and integration checks;
  use `--keep` to inspect the app without provider accounts.
- Release the reusable starter under MIT with third-party notices.
- Keep prefetch requests within security checks and enforce bounded AI usage.

Regenerate into a new empty directory to adopt these template changes. Existing
applications are not rewritten. Apply migration `0009_auth_two_factor_lockout`
with the migration role before using the updated authentication code. It adds
`failed_verification_count` and `locked_until` to `two_factor`. The generated
migration metadata excludes private Command Center tables.
Review configured provider flags before upgrading authentication code.

See [release readiness](docs/release-readiness.md) for measured checks, rollback
considerations, and remaining decisions. Keep the previous generated application
available until the new copy passes its own provider checks.
