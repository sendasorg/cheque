# Observability assessment

Applies when `plan triggers` reports services, background jobs, integrations or important user journeys whose failure someone would need to diagnose. Practices: `PLUGIN/vendor/addyosmani-agent-skills/skills/observability-and-instrumentation/SKILL.md`.

- Reuse the repository's existing logging, metrics, tracing and alerting.
- Define which signals show the changed behavior working and failing. Add instrumentation only where it answers a concrete operating question.
- Never log credentials, tokens or sensitive payloads.
- Output: the operational signals, what was verified locally, what can only be verified after deployment, and remaining gaps.
