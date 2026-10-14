# Stroppers in this repository

This repository can be delivered with [Stroppers](https://github.com/sogamoso/stroppers)
{{version}}. Nothing here is required for people who don't use it: Pstack,
the shared standards below and the repository's own tooling work without it.

Ask your agent, for example: "Use Stroppers to deliver ENG-123. Ship when verified."

## Where things live

| What | Where |
| --- | --- |
| Stroppers settings (shared) | `.stroppers/config.yaml` |
| Private overrides (ignored) | `.stroppers/config.local.yaml` |
| Stroppers plans and operating notes | `.stroppers/docs/` |
| Stroppers-only verification helpers | `.stroppers/verification/` |
| Run state and artifacts (ignored) | `.stroppers/state/`, `.stroppers/artifacts/` |
| Shared quality contract | path in `documents.constraints` (default `CONSTRAINTS.md`) |
| Glossary and decisions | `documents.glossary` and `documents.adr_dir` |
| Repository verification skill | the harness skill directory, e.g. `.claude/skills/verify-*/` |

The shared documents are the canonical copies. Stroppers reads and updates
them in place; it never keeps a second copy here.

## Status and records

The authoritative record for each delivery is the checkpoint comment on its
Linear issue. Ask the agent for "Stroppers status" or run
`stroppers status` from the plugin's `bin/` directory.
