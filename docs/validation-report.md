# Validation report: Stroppers 0.1 pilot

Pilot date: 2026-10-14. Implementation harness: Claude Code 2.1.287 (Opus 5.5).
Machine: macOS 27, Node 26. Pilot repository: a private, disposable fixture
(`stroppers-pilot`: a Node price calculator with unit tests, a Playwright
journey and GitHub Actions CI). Linear: the operator's personal workspace,
team `PRE`. Production use of Stroppers is a separate rollout step recorded at
the end.

Statuses follow the ledger: **verified** means the check ran and passed with
the evidence named; **blocked** and **unverified** name what is missing.

## Automated tests

`npm test` runs 81 tests (`node --test`), all passing at the release head. They
exercise behavior, not prompt text:

| Area | What is tested |
| --- | --- |
| Configuration | precedence of packaged, operator, repository, repo-local and task layers; authority rejected from committed files and task exceptions; a committed `config.local.yaml` rejected; unknown keys and unregistered harnesses rejected with paths; secrets shown by name only; per-repository isolation |
| Harness routing | different-harness selection in both directions; selection against the actual implementer; explicit override; same-harness only by opt-in; missing reviewer blocks; deterministic third-harness preference with implementer exclusion; fallback opt-in |
| Review runner | findings recorded with head and raw output; timeout, exhaustion and auth failure never recorded as clean; nested review refused; reviewer environment is an allowlist; review current only for its head |
| Approval and checkpoint | owner approval; agent, integration, on-behalf, non-owner, lookalike and edited approvals rejected; stale revision; approval before contract ignored; revoke and cancel; wrong workspace; idempotent application; scope enforcement; render/parse round trip; counters across harness switch; infra backoff budget; action journal reconcile and duplicate; changed head invalidates outcomes; lease conflict and release on stop; distinct task keys across workspaces; writable owner key blocks verification; agent app token minting, caching (0600) and person-credential refusal |
| Specialist routing | simple change, docs-only, webhook/auth, dependency, background job, UI component |
| Quality floor | assertion removed, test deleted, test skipped, threshold loosened, clean change, unusable base reported unverified |
| Install | idempotent second install; existing content preserved; operator edits never overwritten; conflicts reported; uninstall keeps shared documents and config; update and status |
| Coexistence | nothing written outside the repository; standalone upstream skills and team instructions untouched; two developers with different private settings; missing config blocks only Stroppers; Pstack global model file never written |
| Packaging | version identical across manifests; marketplaces resolve; no broken links outside known upstream ones; no skill name collisions |

`npm run vendor:check` confirms every vendored file matches its pinned commit.
`claude plugin validate` passes for the marketplace and the plugin.

## Live demonstrations

| # | Scenario | Result |
| --- | --- | --- |
| 1 | Claude Code implementer, Codex reviewer, through the helper | verified: Codex (gpt-6-astra, ChatGPT sign-in) found the seeded defect with scenario and evidence |
| 2 | Codex implementer, Claude reviewer, through the helper from inside a `codex exec` session | verified: Claude (claude-opus-5-5, claude.ai subscription) returned findings; required sandbox network access |
| 3 | Plugin load, Claude Code, project scope from GitHub at a pinned ref | verified: `stroppers:deliver` plus two user-invoked skills, no hooks, ~226 always-on tokens |
| 4 | Plugin load, Codex, fresh isolated `CODEX_HOME` | verified: same namespaced skills; helper runs from the plugin cache |
| 5 | Playwright on a fresh machine state | verified: `browser prepare` installed Chromium automatically; run passed with video |
| 6 | Everyday Chrome isolation | verified: same Chrome process, identical tab ids and URLs before and after a run, no leftover automation processes |
| 7 | PR evidence publication | verified: video and results uploaded as `stroppers-evidence` release assets with run-scoped names; index comment bound to the tested commit; anonymous access 404 on the private repo, authenticated download returns WebM |
| 8 | Linear binding to the wrong workspace | verified: rejected with the workspace names |
| 9 | Agent self-approval | verified: an approval line posted by the Stroppers agent app was rejected |
| 10 | Owner approval and scope | verified: owner comment accepted for the exact revision; `merge` authorized, `deploy production` refused as outside scope |
| 11 | Same grant from both harnesses | verified: Claude Code and Codex sessions both got `authorized: merge` |
| 12 | Native cloud start (Claude Code routine, run once and run now) | verified: run executed in an Anthropic VM with no local relay; posted results to the PR |
| 13 | Cloud bootstrap through the committed entry | verified with the Stroppers repository attached to the session; blocked without it (GitHub proxy scope) |
| 14 | Cloud Playwright | blocked: `cdn.playwright.dev` not on the Default environment allowlist; correctly classified as an environment limitation |
| 15 | Cloud cross-harness review | blocked: Codex CLI absent in Claude cloud; classified `unavailable` |
| 16 | Natural-language delivery in fresh sessions ("Use Stroppers to deliver PRE-5. Ship when verified.") | see below |

## The PRE-5 delivery, run by fresh sessions

Each run was a new `claude -p` session in the pilot with no local state; it
restored the checkpoint from Linear. The first four runs exposed defects that
were fixed before the next run:

1. Stopped: a doctor warning could not say whether the owner's verification key was read-only. Fixed with a side-effect-free scope probe.
2. Stopped: the session trusted the previous session's free-text blocked reason over the helper. Fixed in the skill.
3. Refused: the stopped session still held a two-hour lease. Fixed: stopping releases the lease.
4. Stopped: the verifier reported the first owner approval, which predated the key revocation, instead of the fresh one. Fixed: latest valid approval.
5. Ran the full flow: approval verified; one-line change; unit tests and Playwright journey passed with video on the PR; floor guard clean; GitHub CI green; Codex review clean; an independent verifier posted PASS+NOTES on the PR. Stopped at merge because Claude Code's auto-mode policy refuses merges without human review.
6. Continued with `gh pr merge` explicitly allowed for the session (the operator's harness permission, matching the Linear grant): authorized and journaled the merge, squash-merged PR #3 pinned to the verified head (`--match-head-commit`), moved the checkpoint head to the merge commit (which voided earlier pre-merge outcomes), re-ran both criteria against the merge commit (unit tests, isolated server check, Playwright with video), computed `ok: true`, posted the Linear evidence comment, released the lease, and moved PRE-5 to Done.

Also exercised: an unattended session on a deliberately vague issue (PRE-6) stopped at the contract stage, made no changes, started no interview and named what would unblock it. That run found that an empty contract could still be posted with an approval line; contracts now need an outcome and at least one criterion.

## Verification skill

Pstack's `create-verification-skill` (vendored, unmodified) generated the
pilot's `.claude/skills/verify-price-calculator/` skill with a feature map
(calculator form, price API, health endpoint), ran it end to end once, fixed a
wrong process id in its launch step and a wrong claim in its map, and opened
pilot PR #4. The session ran with the Stroppers plugin installed but not
invoked; it behaved as a session without Stroppers.

## Independent review

Two independent reviews ran after the pilot: an adversarial code review by
Codex (the other harness) and a requirement-coverage audit by a fresh Claude
agent. They reported 16 code findings (9 high) and 21 ledger findings. All
code findings were confirmed and fixed with tests (commit "Address
independent review findings"): completion now reconciles every approved
criterion against the current revision; authorization is default-deny and
bounded by the operator's private limits; reviewer independence is enforced
for explicit reviewers and repository config can no longer define reviewer
commands; restored checkpoints must hash to their approved contract and are
claimed only from the agent app's own comment; scope extensions work; evidence
uploads are limited to videos and a sanitized summary inside the run
directory; browser runs no longer pass on runner errors, all-skipped suites or
dirty trees; uninstall validates its manifest; the review diff write ignores
committed symlinks. Raw `results.json` assets uploaded during the pilot
contained local filesystem paths; they were deleted from the pilot's evidence
release, so some earlier PR comments link to removed files. The ledger was
corrected where the audit found verified rows resting on documentation or
partial runs.

## Remaining limitations

See the ledger and [capability-matrix.md](capability-matrix.md). In short: Codex
cloud is not demonstrated; cloud Playwright needs an allowlist change;
cross-harness review inside a vendor cloud needs the other vendor's
credential provisioned; the optional grilling flow is interactive and was not
exercised end to end; the review-usefulness evaluation covers only pilot
tasks.
