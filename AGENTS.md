# Project agent instructions

Use Bun 1.3.11, Node 24, TypeScript, and the installed Biome/Trellis policy.
Inspect the branch and working tree. Preserve existing work and the current branch.
Keep secrets server-only. Derive actor and tenant authority from verified server
sessions. Preserve authorization and database row-level security.
Add focused behavior tests and run `bun run validate:full` for broad changes.
Do not commit, push, deploy, or send messages without the user's authorization.

Read [agent workflows](docs/agent-workflows.md) for the public plugin distribution.
Route implementation through Raintree Standards PROFILE-SOFTWARE-CHANGE;
interface work through PROFILE-UI-FEATURE; public pages through
PROFILE-PUBLIC-WEB-PAGE. Read the installed catalog and conditional requirements.
Use requirement IDs and record evidence, missing checks, and manual review needs.
Use Trellis todos for bounded remediation and HIG Doctor for source review plus
browser checks. Use DocPull only for explicitly requested research.
Use provider guidance only for integrations enabled in starter.config.ts.
Private Raintree Operations tooling is not required by this project.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
