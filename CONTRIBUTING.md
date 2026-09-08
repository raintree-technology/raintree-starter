# Contributing

Bug reports, documentation improvements, and focused pull requests are welcome.
Use [GitHub issues](https://github.com/raintree-technology/raintree-starter/issues)
for reproducible bugs. Describe the profile, tool versions, expected result, and
actual result. Report security issues through [SECURITY.md](SECURITY.md).

Use Bun 1.3.11 and Node 24. Preserve server authorization, tenant isolation, and
secret boundaries. Keep business-specific behavior in generated applications.

Before submitting a change:

1. Add focused tests for changed behavior.
2. Run `bun run validate:full`.
3. Run `bun run test:profiles` for generator or shared changes.
4. Describe provider checks that were not run and any migration requirements.

Contributions are provided under [MIT](LICENSE). Preserve third-party notices
and follow the [Code of Conduct](CODE_OF_CONDUCT.md).

Maintainers prioritize reproducible bugs and documentation. Free implementation
help, provider setup, and guaranteed response times are not included.
For project implementation, contact [Raintree Services](https://raintree.technology/services).
