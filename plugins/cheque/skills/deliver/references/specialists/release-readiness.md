# Release readiness and live acceptance

Applies to deployable application or configuration changes. Practices: `PLUGIN/vendor/addyosmani-agent-skills/skills/shipping-and-launch/SKILL.md`. Pstack's Shipping playbook still owns landing the PR; this covers what happens around deployment.

Before deploying, record in the checkpoint and plan:

- The exact artifact and revision to deploy, and how to confirm which revision is live.
- Migration and data compatibility (forward and backward during rollout).
- The release mechanism the repository already uses.
- Health checks that would actually catch this change failing.
- Rollback or forward-recovery steps, and whether they are verified.
- Staging, flags or gradual rollout only where the change warrants it.

After an authorized deployment:

- Confirm the deployed revision.
- Run each post-deploy criterion; check errors, latency and side effects relevant to the change. Browser journeys use `cheque browser run`; APIs, data and jobs get direct checks.
- Record each outcome against the deployed revision. Skipped applicable checks are `unverified`; out-of-scope checks are `not-applicable` with a reason.
- Post concise success evidence, or richer failure diagnostics, to Linear with the deployed version. Leave observation windows and human judgment open as outstanding acceptance.
- A failure runs the verified recovery procedure inside the approval, otherwise halt and escalate (`../recovery.md`).

For non-deployable deliverables, skip deployment and record the artifact acceptance defined in the contract.
