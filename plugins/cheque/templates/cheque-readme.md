# `cheque` in this repository

This repository can be delivered with [`cheque`](https://github.com/sendasorg/cheque)
{{version}}. Nothing here is required for people who don't use it: Pstack,
the shared standards below and the repository's own tooling work without it.

Ask your agent, for example: "Use `cheque` to deliver ENG-123. Ship when verified."

## Where things live

| What | Where |
| --- | --- |
| `cheque` settings (shared) | `.cheque/config.yaml` |
| Private overrides (ignored) | `.cheque/config.local.yaml` |
| `cheque` plans and operating notes | `.cheque/docs/` |
| `cheque`-only verification helpers | `.cheque/verification/` |
| Run state and artifacts (ignored) | `.cheque/state/`, `.cheque/artifacts/` |
| Shared quality contract | path in `documents.constraints` (default `CONSTRAINTS.md`) |
| Glossary and decisions | `documents.glossary` and `documents.adr_dir` |
| Repository verification skill | the harness skill directory, e.g. `.claude/skills/verify-*/` |

The shared documents are the canonical copies. `cheque` reads and updates
them in place; it never keeps a second copy here.

## Status and records

The authoritative record for each delivery is the checkpoint comment on its
Linear issue. Ask the agent for "`cheque` status" or run
`cheque status` from the plugin's `bin/` directory.
