# Optional discovery

Use only when the operator explicitly asks to stress-test an ambiguous feature
or a consequential design. Small, well-specified tasks go straight to the
contract. Never start discovery in an unattended session; record the open
decision as a blocker instead.

- Design questions about this codebase: the `cheque:grill-with-docs` skill (the upstream command is `grill-with-docs`, not `grill-me-with-docs`).
- General decisions where repository documents do not matter: `cheque:grill-me`.

Research observable facts yourself before asking. Follow the grilling skill's
rule that the session ends only when the operator confirms shared
understanding. Then put goals, non-goals, acceptance criteria and unresolved
decisions in the delivery's plan document, and accepted terms and decisions
in the repository's glossary and ADR directory (`documents.glossary`,
`documents.adr_dir`).
