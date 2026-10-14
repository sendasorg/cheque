# Verification plan and evidence

## Plan

For each acceptance criterion record, in `plan.json` (a list):
`{criterion_id, criterion, method, stage: "pre-merge" | "post-deploy", environment, evidence, browser: {applicable, reason}}`.

- Pick the method that actually exercises the surface: browser journeys for browser behavior; API, data, job or CLI checks for those; document or artifact checks for non-executable deliverables. Reuse existing tests and the repository's verification skill.
- Post-deploy criteria are expected to have no pre-deploy result; name the recovery response if they fail.
- Non-deployable deliverables (docs, tooling) define artifact acceptance instead of a release.
- Changing a method later is fine with a recorded reason if coverage stays sufficient. Weakening a criterion or accepting a failure needs an owner-approved contract revision.

## Repository verification skill

If the repository has no `verify-*` skill, generate one with Pstack's
`create-verification-skill` (vendored) before writing any generic testing
guidance, in the harness's project skill directory, and run it end to end
once. Keep it maintained with `maintain-verification-skill`. Cheque-only
helpers go in `.cheque/verification/` and never replace that skill.

## Browser runs

- Playwright runs where this session runs. Local session: local. Cloud or scheduled session: inside that cloud session. Never hand off to another machine, and never fall back automatically to another harness.
- `cheque browser doctor`, then `cheque browser prepare` if anything is missing (installing browsers and system libraries is pre-authorized; do not ask). If the environment cannot be prepared, the result is `unverified` with the environment reason, not a product failure.
- `cheque browser run` uses a Playwright-managed browser with its own profile, a free port and a per-run output directory, and records video. Never attach to or reuse the operator's own browser, profile or sessions; use synthetic test accounts.
- A failed assertion is a product result: diagnose it against the criterion. Do not rerun elsewhere until it passes.
- Playwright is never a required GitHub check.

## Evidence

`cheque evidence publish --run <id> --pr <n>` uploads videos (and traces for
failures) as assets of the repository's `cheque-evidence` prerelease and
posts a result index on the PR bound to the tested revision. Publish before a
cloud session ends. Videos supplement assertions; they are not verdicts.
Mirror a concise summary to Linear: success briefly, failures with diagnostics.
