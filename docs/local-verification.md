# Local verification

## Reproduce and inspect

Run `bun run test:local` from this checkout after installing its dependencies.
It requires Bun 1.3.11, Node 24, and local PostgreSQL server tools (tested with 18).
The command tests this starter against a fresh database with independent roles,
applies migrations, runs the role/RLS checks and all 50 authentication assertions,
and stops both local servers. No existing database configuration is used.

Run `bun run test:local --keep` to leave the tested app running for inspection.
The terminal prints the URL and private `fixtures.json` path containing test
sign-in credentials. Ctrl+C stops the app and database. Each run retains its
private temporary directory for diagnosis, including database
files, credentials, and local email links. Do not copy these secrets into the
repository or reports. Temporary files may disappear after system cleanup.

Authentication results are written to `test-results/functionality/local-auth.json`.
The temporary `setup.log` records setup, migrations, role/RLS checks, and test
output; `app.log` contains development email links. The lower-level
`node scripts/test-local-auth.mjs <disposable-directory>` command remains available
for rerunning authentication tests while a kept environment is running.

The runner creates a separate environment for each invocation and uses only
operating-system settings from its parent. See [release readiness](release-readiness.md)
for checks performed against this candidate.

Repository-wide checks remain separate:

```sh
bun run validate:full
```

## Limits

These tests do not verify external provider delivery, OAuth, hardware passkeys,
all accessibility states, or production deployment behavior.
