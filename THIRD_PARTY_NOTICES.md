# Third-party notices

Stroppers bundles the following components unmodified under
`plugins/stroppers/vendor/`. Each directory keeps its upstream license file.
Exact revisions are pinned in `dependencies.json`.

| Component | Source | License | Copyright |
| --- | --- | --- | --- |
| pstack (standalone mirror of Lauren Tan's Pstack) | https://github.com/backnotprop/pstack | MIT | Copyright (c) 2026 Lauren Tan |
| agent-skills (four skills and their referenced checklists) | https://github.com/addyosmani/agent-skills | MIT | Copyright (c) 2025 Addy Osmani |
| skills (grill-with-docs, grill-me, grilling, domain-modeling) | https://github.com/mattpocock/skills | MIT | Copyright (c) 2026 Matt Pocock |
| codex-plugin-cc (review output schema) | https://github.com/openai/codex-plugin-cc | Apache-2.0 | Copyright 2026 OpenAI (see `vendor/codex-plugin-cc/NOTICE`) |

`plugins/stroppers/schemas/findings.schema.json` is derived from
codex-plugin-cc's `review-output.schema.json` (Apache-2.0): it adds the
`scenario` and `evidence` finding fields.

Buritica's Sharpen (`plugins/sdlc/README.md`) was consulted as an enforcement
reference and is not included.
