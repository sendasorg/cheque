# Stroppers implementation requirement ledger

Working ledger for implementing Stroppers. It expands the handoff package's
coverage register (142 source blocks) into child obligations. Source references
are package-relative (`spec/<file>.md#r-NNN`) and resolve against the handoff
package, which stays outside this repository.

Status values: `todo`, `in-progress`, `verified`, `blocked`, `unverified`,
`not-applicable`, `reference`. A planned check is not evidence. `verified`
requires a cited command/result or inspectable file. Unsupported required
capabilities stay `blocked` or `unverified`.

Evidence column conventions: `file:` implementation path, `test:` automated
test, `run:` command and observed result, `doc:` documentation section,
`why:` reason for a non-verified status.

## spec/01-scope-and-experience.md

| ID | Obligation | Status | Implementation / evidence / reason |
| --- | --- | --- | --- |
| R-001.1 | Reusable, low-maintenance open-source SDLC plugin centered on backnotprop/pstack | todo | |
| R-001.2 | Pstack owns planning, execution, verification, PR feedback, merging | todo | |
| R-001.3 | Add narrowly scoped quality/production capabilities, no second lifecycle orchestrator | todo | |
| R-002.1 | Complete repo inspection, implementation, validation, reviewable change set | todo | |
| R-002.2 | Pilot in one repository before rollout | todo | |
| R-002.3 | Ask which target repo to use if not supplied, before installing/changing config | todo | |
| R-003.1 | Agent takes approved task through Pstack, specialists, independent verification, PR feedback, CI, authorized delivery | todo | |
| R-003.2 | Delivery complete only when deliverable meets approved acceptance, evidence in Linear | todo | |
| R-003.3 | Deployable changes need target-environment application and live acceptance | todo | |
| R-003.4 | Non-deployable artifacts use explicitly defined artifact acceptance | todo | |
| R-003.5 | Observation windows / human judgment stay visible as outstanding acceptance | todo | |
| R-003.6 | Setup reproducible on another machine | todo | |
| R-003.7 | Use harness-native local/cloud execution and native scheduling/triggers | todo | |
| R-003.8 | No custom controller, Eve, database, persistent worker or laptop daemon | todo | |
| R-004.1 | Natural language primary; namespaced commands optional shortcuts; no per-task ceremony | todo | |
| R-004.2 | Self-contained plugin with path-aware adapters; `.stroppers/` for settings/notes; shared docs in conventional locations; no required symlinks/duplicates/sync | todo | |
| R-004.3 | Playwright follows session execution location; no availability routing or local-to-cloud failover | todo | |
| R-004.4 | Plugin does not run without a session; native schedules provide unattended starts; gaps reported | todo | |
| R-004.5 | Use backnotprop/pstack (mirror of Lauren Tan's Pstack), not phthomas/pstack | todo | |
| R-004.6 | Support Claude Code and Codex from day one via existing subscriptions | todo | |
| R-004.7 | Global default harness plus per-step overrides (implementation, review, feedback fixes, live verification) | todo | |
| R-004.8 | No model-provider accounts, API billing or Grok dependency | todo | |
| R-004.9 | Both harnesses run the same delivery contract/verification commands; small adapters; shared checkpoints | todo | |
| R-004.10 | Subscription exhaustion checkpoints and waits; fallback only when explicitly enabled; never API billing | todo | |
| R-004.11 | Configure workflow/review/execution/routing/fallback/owners once with inherited defaults; no repeated questions | todo | |
| R-004.12 | Distribute as plugin with shared skills/assets and small harness compatibility layers; no hosted infra | todo | |
| R-004.13 | Upstream files unchanged where possible; separate package with distinct skill names; adaptations as small inspectable patches | todo | |
| R-004.14 | Reuse repo's existing toolchain, CI, deploy platform, instruction files, conventions | todo | |
| R-004.15 | Pstack owns dev/PR shipping; CI/GitHub enforce merge; release extension owns deploy readiness/verification | todo | |
| R-004.16 | Preserve required checks/reviews; any aggregator includes failures/cancellations/unexpected skips | todo | |
| R-004.17 | Initial implementation: reviewable change set; shared contract demonstrated through both harnesses on disposable pilot | todo | |
| R-004.18 | Prove native execution, cloud loading, scheduling/trigger and checkpoint continuation before promising unattended support | todo | |
| R-004.19 | Remote actions (PRs, protections, merge, deploy, access) follow session authorization | todo | |
| R-004.20 | Exclude full BMAD, Sharpen gate orchestration, another TDD/review router, always-on Ponytail mode | todo | |
| R-004.21 | State/rules in git/GitHub, never tied to hostname, home directory or local credential export | todo | |
| R-005.1 | Ordinary-language outcome request applies configured policy | todo | |
| R-005.2 | Intent to ship does not fabricate a missing grant; request only missing authority | todo | |
| R-005.3 | No repeated routing/stages/verification/recovery questions after approval | todo | |
| R-006.1 | One documented natural-language invocation pattern | todo | |
| R-006.2 | One public namespaced entry point | todo | |
| R-006.3 | Discover repo settings and Linear binding; use settled defaults; ask only for missing intent/authority | todo | |
| R-006.4 | Users need not learn schema, checkpoint formats or skill graph | todo | |
| R-006.5 | Concise actionable status/blockers/decisions | todo | |
| R-006.6 | README quickstart + first-task walkthrough focused on operator experience; advanced config linked | todo | |
| R-007.1 | Thin CLI adapters: invocation, scoped review input, result capture, explicit failure handling | todo | |
| R-007.2 | Implement concrete Claude Code/Codex differences first; no speculative abstraction or generic platform | todo | |
| R-008.1 | Pstack owns playbooks and repair/review/shipping loop | todo | |
| R-008.2 | Stroppers adds config, specialist pointers, integration helpers only | todo | |
| R-008.3 | No duplicated lifecycle, second review hierarchy, or every-specialist-every-task | todo | |
| R-008.4 | Standards/checks applied per approved verification plan and actual triggers | todo | |
| R-009.1 | Evidence-backed implementer/reviewer exchanges (reproduce, context, challenge, fix, re-review) | todo | |
| R-009.2 | Clear disposition recorded for substantive findings | todo | |
| R-009.3 | No unanimity requirement, debate for its own sake or indefinite loops; bounded recovery preserved | todo | |
| R-009.4 | Reviewer findings do not change authority or weaken checks | todo | |
| R-010.1 | Shared repo standards separated from personal harness/model/reasoning preferences | todo | |
| R-010.2 | Explicit per-repo/operator overrides preserved without teammates adopting Stroppers | todo | |
| R-010.3 | Harness identity not equated with model/provider; record actual participants where observable | todo | |
| R-011.1 | Small set of representative real tasks assessing harness defaults and review usefulness | todo | |
| R-011.2 | Record outcomes, defects caught, noisy findings, elapsed time, observable usage | todo | |
| R-011.3 | No benchmark platform; keep accepted defaults; results inform documented recommendation | todo | |
| R-012.1 | Acceptance: concise request enters workflow without policy interview/mandatory command sequence | todo | |
| R-012.2 | Acceptance: reviewer selectable explicitly | todo | |
| R-012.3 | Acceptance: specialists only when applicable | todo | |
| R-012.4 | Acceptance: routine approved task completes without redundant prompts | todo | |
| R-012.5 | Acceptance: missing intent/authority/unsupported capability yield specific blockers | todo | |
| R-012.6 | Acceptance: README first-task example exercises this interface | todo | |

## spec/02-sources-and-specialists.md

| ID | Obligation | Status | Implementation / evidence / reason |
| --- | --- | --- | --- |
| R-013.1 | Read current files at chosen revisions before implementing | todo | |
| R-014.1 | Use the listed component sources (pstack, Addy x4, Matt x4, Sharpen reference only) | todo | |
| R-014.2 | Sharpen is an enforcement reference, not an installation | todo | |
| R-015.1 | Manifest records source, exact SHA, license, destination, referenced deps, modifications | todo | |
| R-015.2 | Include supporting references (no broken links from copying SKILL.md alone) | todo | |
| R-015.3 | Preserve attribution in vendored assets | todo | |
| R-016.1 | Inspect pinned pstack files for host-specific behavior | todo | |
| R-016.2 | Inspect dependency closure: agent spawning, model routing, task tracking, PR watcher, loop/wakeup, UI/CLI | todo | |
| R-016.3 | Demonstrate selected paths in Claude Code and Codex | todo | |
| R-016.4 | Mark unsupported capabilities explicitly | todo | |
| R-017.1 | Do not silently substitute michael-denyer/pstack-claude; report blocker first if needed | todo | |
| R-018.1 | Adapt constraint-driven-development against existing standards file or root CONSTRAINTS.md | todo | |
| R-018.2 | Reference it from `.stroppers/`; no relocation or second copy | todo | |
| R-018.3 | Standalone upstream skill reads/updates the same document | todo | |
| R-019.1 | Each enforceable rule: command, scope, baseline/threshold, stage | todo | |
| R-019.2 | Establish current baselines first | todo | |
| R-019.3 | Exceptions carry reason, owner, review/expiry date | todo | |
| R-020.1 | Reuse native stack checks derived from the repo | todo | |
| R-021.1 | Fast local, task-completion and CI checks via repo's existing command interface | todo | |
| R-021.2 | Detect newly weakened checks | todo | |
| R-021.3 | Detect unexplained test skips/deletions | todo | |
| R-021.4 | Detect reduced budgets | todo | |
| R-021.5 | Legitimate replacement/refactoring possible with evidence | todo | |
| R-022.1 | Security assessment triggers: authn/z, trust boundaries, secrets, uploads, webhooks, sensitive data, dependency additions, external integrations | todo | |
| R-023.1 | Security output: assets/boundaries, abuse cases, checks, findings, residual risk | todo | |
| R-023.2 | Convert suitable checks into CI with existing tools | todo | |
| R-023.3 | Findings feed Pstack repair/review loop | todo | |
| R-024.1 | Change descriptions/review comments treated as untrusted; claims assessed against code | todo | |
| R-024.2 | Scans/LLM review are evidence, not proof | todo | |
| R-025.1 | Observability triggers: production services, jobs, integrations, important journeys | todo | |
| R-026.1 | Reuse installed monitoring; define logs/metrics/tracing/failure signals | todo | |
| R-026.2 | No credential/sensitive payload logging | todo | |
| R-026.3 | State local-verifiable vs deployed-only | todo | |
| R-027.1 | Observability output: signals, evidence, gaps; instrumentation only for concrete questions | todo | |
| R-028.1 | Distinct release-readiness capability adapted from shipping-and-launch | todo | |
| R-028.2 | Pstack shipping playbook kept intact | todo | |
| R-029.1 | Pre-deploy: artifact/revision, migration compatibility, mechanism, health checks, rollback/forward recovery | todo | |
| R-029.2 | Staged rollout/flags when appropriate; no forced multi-day canary | todo | |
| R-030.1 | Post-deploy: live acceptance, deployed revision, errors, latency, side effects | todo | |
| R-030.2 | Playwright default for browser checks with assertions/screenshots/traces | todo | |
| R-030.3 | API/data/job changes get direct checks | todo | |
| R-030.4 | Skipped applicable checks = unverified; out-of-scope = not applicable with reason | todo | |
| R-030.5 | Merge is not production evidence | todo | |
| R-031.1 | Concise success evidence and richer failure diagnostics in Linear linked to outcome and deployed version | todo | |
| R-031.2 | Redact sensitive data; avoid unnecessary recordings | todo | |
| R-031.3 | Outstanding observation/human acceptance kept open | todo | |
| R-031.4 | Discover actual Linear workflow states before writing | todo | |
| R-032.1 | Install grill-with-docs with closure (grilling, domain-modeling, required refs) | todo | |
| R-032.2 | Expose grill-me optionally | todo | |
| R-033.1 | Document `grill-with-docs` spelling; no alias unless requested | todo | |
| R-034.1 | grill-with-docs only on explicit stress-test request; grill-me for general decisions | todo | |
| R-035.1 | No automatic grilling in unattended sessions | todo | |
| R-035.2 | Offer discovery when ambiguity matters; research facts first; small tasks go straight to Pstack | todo | |
| R-036.1 | Persist terminology/decisions in authoritative glossary/ADR (default GLOSSARY.md, docs/adr/) | todo | |
| R-036.2 | Summarize goals/non-goals/criteria/unresolved in Pstack's planning artifact; one plan | todo | |
| R-036.3 | Honor grilling skill's completion/confirmation requirement | todo | |
| R-037.1 | Unattended unanswered product decision: record blocker, route to operator, no interview, no invented approval | todo | |
| R-038.1 | Thin project entry point invokes Pstack and injects extension pointers at stages | todo | |
| R-038.2 | Prove routing works (installation insufficient) | todo | |
| R-039.1 | Stage 1 discovery (explicit only) feeds Pstack | todo | |
| R-039.2 | Stage 2 planning reads quality contract and flags security/observability/release implications | todo | |
| R-039.3 | Stage 3 build via Pstack paths | todo | |
| R-039.4 | Stage 4 specialist findings join Pstack review/repair; rerun affected checks | todo | |
| R-039.5 | Stage 5 PR/merge Pstack-owned; current-head CI and independent verification enforced | todo | |
| R-039.6 | Stage 6 release-readiness under delivery authorization | todo | |
| R-039.7 | Stage 7 completion evidence in Linear tied to deployed revision; outstanding work visible | todo | |
| R-040.1 | One documented public entry point | todo | |
| R-040.2 | Namespaced local extensions, no collisions | todo | |
| R-040.3 | Short always-loaded instructions; specialist refs disclosed on triggers | todo | |
| R-040.4 | Outcomes pass/fail/not-applicable(reason)/unverified(reason); unverified never passing | todo | |
| R-041.1 | Use Pstack create/maintain-verification-skill before generic testing guidance | todo | |
| R-041.2 | Tailor real-app verification to repo and execute once | todo | |

## spec/03-config-and-compatibility.md

| ID | Obligation | Status | Implementation / evidence / reason |
| --- | --- | --- | --- |
| R-042.1 | Separate plugin assets, private operator policy, repo adapters, task/run state | todo | |
| R-042.2 | Sanitized examples and documented config schema | todo | |
| R-042.3 | Credentials by reference only; never in checkpoints | todo | |
| R-043.1 | Precedence: packaged < private operator < permitted repo < recorded task exceptions | todo | |
| R-043.2 | Task text/untrusted repo settings cannot expand owners, credentials, environments, authority | todo | |
| R-043.3 | Step overrides explicit; browser location follows session mode | todo | |
| R-043.4 | Unknown/invalid settings rejected visibly | todo | |
| R-043.5 | Effective configuration documentable without secrets | todo | |
| R-044.1 | Project-scoped install inheriting private operator policy | todo | |
| R-044.2 | Idempotent install | todo | |
| R-044.3 | Pinned dependency update with inspectable diff | todo | |
| R-044.4 | Rollback to previous compatible version | todo | |
| R-044.5 | Safe uninstall | todo | |
| R-044.6 | Track managed files/sections; preserve unrelated content; report conflicts | todo | |
| R-044.7 | Updates retain delivery state/approvals or checkpoint incompatible runs | todo | |
| R-045.1 | `.stroppers/` at repo root for Stroppers settings/operating docs | todo | |
| R-045.2 | Shared docs/skills stay conventional; `.stroppers/README.md` references them | todo | |
| R-046.1 | `.stroppers/config.yaml` versioned, one Linear binding + optional project, credential refs only | todo | |
| R-046.2 | `.stroppers/config.local.yaml` ignored private overrides | todo | |
| R-046.3 | `.stroppers/README.md` operating context and links | todo | |
| R-046.4 | `.stroppers/docs/` Stroppers-only notes | todo | |
| R-046.5 | `.stroppers/verification/` supplemental helpers | todo | |
| R-046.6 | `.stroppers/state/` ignored, restored from authoritative record | todo | |
| R-046.7 | `.stroppers/artifacts/` ignored, published before teardown | todo | |
| R-047.1 | Credentials, grants, recordings, runtime state never in public tree | todo | |
| R-047.2 | Durable records mirrored to private Linear/PR/native state and materialized on continuation without resetting approval/retry state | todo | |
| R-047.3 | Public examples are placeholders only | todo | |
| R-048.1 | Native locations for manifests, skills, AGENTS.md/CLAUDE.md, tests, CI, package config | todo | |
| R-048.2 | New shared docs at CONSTRAINTS.md, GLOSSARY.md, docs/adr/; repo conventions win | todo | |
| R-048.3 | No pointer-only replacement of shared docs; symlinks not sole mechanism | todo | |
| R-049.1 | Settings affect Stroppers-invoked work only | todo | |
| R-049.2 | Upstream skills keep names, discovery paths, user config, behavior | todo | |
| R-049.3 | No shadowing, global skill changes, rewriting others' config or global routing | todo | |
| R-049.4 | Root instruction addition (if any) small, identified, scoped, non-mandatory | todo | |
| R-050.1 | Read Pstack model settings and apply session config at entry point without rewriting global files | todo | |
| R-050.2 | Standalone invocation does not inherit Stroppers policy | todo | |
| R-050.3 | Inspect actual consumption; report incompatibility if scoped overrides impossible | todo | |
| R-051.1 | Generated verification skill in harness skill dir with feature map intact | todo | |
| R-051.2 | `.stroppers/verification/` does not displace it | todo | |
| R-051.3 | One canonical source for shared documents | todo | |
| R-051.4 | Adapters only in namespaced Stroppers assets; pinned and recorded | todo | |
| R-052.1 | Install/update/uninstall track owned files/sections; preserve others | todo | |
| R-052.2 | Uninstall never deletes shared constraints/glossary/ADRs/verification | todo | |
| R-052.3 | Legacy relocated docs marked for reviewable migration | todo | |
| R-052.4 | Runtime hooks no-op outside Stroppers work, tested; footprint reported | todo | |
| R-053.1 | Works without teammates installing it or adopting settings | todo | |
| R-053.2 | Works without separately installed upstream plugins (bundled/pinned closure) | todo | |
| R-053.3 | Package-owned adaptations isolated from independent upstream installs | todo | |
| R-054.1 | Config resolves shared doc paths; defaults to standard locations | todo | |
| R-054.2 | Configured path changes Stroppers lookup only | todo | |
| R-054.3 | Never two editable copies or sync service | todo | |
| R-055.1 | Symlinks optional/explicit; relative in-repo; never overwrite conventional files | todo | |
| R-055.2 | Link-free path supported; no silent copy fallback | todo | |
| R-056.1 | Thin harness entries may refer to package instructions/shared docs | todo | |
| R-056.2 | Uninstall leaves no broken managed links | todo | |
| R-056.3 | README distinguishes packaging, configurable paths, shared standards, symlink limits | todo | |
| R-057.1 | Coexistence mode 1: enabled/invoked | todo | |
| R-057.2 | Coexistence mode 2: installed not invoked | todo | |
| R-057.3 | Coexistence mode 3: disabled/uninstalled | todo | |
| R-057.4 | Coexistence mode 4: standalone upstream only, same authoritative files | todo | |
| R-057.5 | Two developers with different user settings/credentials unaffected | todo | |
| R-058.1 | Discovery/entry checks repeated in local/cloud for both harnesses | todo | |
| R-058.2 | No duplicate skill names, doc drift, account leakage, overwritten instructions, cleanup of shared assets | todo | |
| R-058.3 | Second repo settings cannot affect first | todo | |
| R-058.4 | Missing config blocks only Stroppers operations | todo | |
| R-058.5 | Compatibility evidence/limits in README | todo | |

## spec/04-harnesses-and-native-automation.md

| ID | Obligation | Status | Implementation / evidence / reason |
| --- | --- | --- | --- |
| R-059.1 | Global default harness = Claude Code; steps inherit unless overridden | todo | |
| R-059.2 | Default reviewer policy `different-harness` | todo | |
| R-059.3 | Resolve against actual implementing harness incl. step overrides | todo | |
| R-059.4 | Cross-harness review is a workflow step, not fallback | todo | |
| R-060.1 | Explicit reviewer override wins and survives default changes | todo | |
| R-060.2 | Explicit same-harness fresh-context policy allowed; never automatic downgrade | todo | |
| R-060.3 | Separate implementer/reviewer sessions | todo | |
| R-060.4 | Changing defaults is configuration-only | todo | |
| R-061.1 | Small adapter registry with ordered reviewer preferences | todo | |
| R-061.2 | Deterministic: first enabled compatible reviewer differing from implementer | todo | |
| R-061.3 | Preference order explicit in effective config | todo | |
| R-061.4 | Record harness and model when observable; no unproven diversity claims | todo | |
| R-062.1 | Adapter declares local/cloud, review-only, auth/cost mode, results, checkpoint input, version reqs, limits | todo | |
| R-062.2 | Exclude unconfigured/unsupported/unauthorized candidates | todo | |
| R-062.3 | No reviewer: checkpoint blocked with continuation; no implementer self-review, paid API or hosting | todo | |
| R-062.4 | Started reviewer identity/findings preserved; outages don't switch or reset budgets | todo | |
| R-063.1 | Claude to Codex and Codex to Claude both supported | todo | |
| R-063.2 | Reuse/adapt pinned codex-plugin-cc after inspecting contracts | todo | |
| R-063.3 | Reverse via supported Claude Code programmatic invocation | todo | |
| R-063.4 | Demonstrate subscription auth; avoid API-key modes | todo | |
| R-063.5 | Cloud cross-harness invocation separately proven | todo | |
| R-064.1 | Future adapters without lifecycle/contract edits; none speculative in v1 | todo | |
| R-064.2 | Review/checkpoint contracts independent of vendor transcripts | todo | |
| R-065.1 | Reviewer gets criteria, constraints, exact base/head, scope, diff, repo access | todo | |
| R-065.2 | Not reliant on implementer summary | todo | |
| R-065.3 | Findings: severity, location, scenario, evidence, recommendation; no manufactured disagreement | todo | |
| R-066.1 | Reviewer read-only; implementer owns fixes | todo | |
| R-066.2 | Restricted sandbox or isolated checkout for review | todo | |
| R-066.3 | Raw output + structured findings captured; timeout/auth failure never clean | todo | |
| R-066.4 | Dispositions with evidence; affected fixes re-checked under bounded policy | todo | |
| R-066.5 | Model agreement not a substitute for acceptance verification | todo | |
| R-067.1 | Reviewer role marked; nested cross-harness delegation disabled | todo | |
| R-067.2 | Review result carries no authority; doesn't bypass GitHub reviews/checks | todo | |
| R-068.1 | Test: Claude impl + Codex review | todo | |
| R-068.2 | Test: Codex impl + Claude review | todo | |
| R-068.3 | Test: explicit reviewer override | todo | |
| R-068.4 | Test: actual-implementer step override | todo | |
| R-068.5 | Test: missing reviewer | todo | |
| R-068.6 | Test: invalid configuration | todo | |
| R-068.7 | Test: subscription exhaustion | todo | |
| R-068.8 | Test: reviewer timeout | todo | |
| R-068.9 | Test: changed head | todo | |
| R-068.10 | Test: fake third-harness fixture, deterministic preference, implementer exclusion | todo | |
| R-068.11 | Findings/counters preserved on continuation | todo | |
| R-069.1 | Deliverable is a harness plugin; no hosted controller/worker/DB/daemon | todo | |
| R-069.2 | Reuse existing authenticated connectors | todo | |
| R-070.1 | Unattended schedules are native cloud runs, not desktop schedules | todo | |
| R-070.2 | Both harnesses via their actual packaging/loading mechanisms; one workflow source of truth | todo | |
| R-070.3 | Demonstrate each path; document limitations | todo | |
| R-071.1 | Approved cloud work continues with laptop asleep | todo | |
| R-071.2 | Document triggers, cadence/limits, settings, credential renewal, env setup, dropped/repeated events, recovery | todo | |
| R-071.3 | Contract validated at each continuation; trigger payload not approval | todo | |
| R-072.1 | Verify native capabilities from official docs and installed versions | todo | |
| R-072.2 | No relay-requiring API trigger advertised as no-hosting; no polling daemon | todo | |
| R-073.1 | Local stays local, cloud stays cloud; Playwright co-located | todo | |
| R-073.2 | No laptop detection, cloud-to-laptop dispatch or automatic migration; explicit handoff only | todo | |
| R-074.1 | Unattended cross-harness review demonstrated in-environment with subscription auth | todo | |
| R-074.2 | If impossible: checkpoint, report blocker, explicit continuation, no claim of full unattended | todo | |
| R-075.1 | Fresh local+cloud install/load for both harnesses | todo | |
| R-075.2 | Native automation configured and exercised | todo | |
| R-075.3 | Laptop-closed cloud run with execution, review and evidence publication | todo | |
| R-075.4 | Checkpoint continuation proven; automatic vs manual distinguished | todo | |
| R-076.1 | No custom hosting; $100 ceiling only for separately approved future proposals | todo | |
| R-076.2 | Document usage limits and evidence storage | todo | |
| R-076.3 | No paid APIs, browser services or purchases; report gaps | todo | |

## spec/05-linear-and-authority.md

| ID | Obligation | Status | Implementation / evidence / reason |
| --- | --- | --- | --- |
| R-077.1 | Upfront per-issue approval grants implement/PR/feedback/merge/deploy within scope | todo | |
| R-077.2 | No repeated approval inside grant; protections still bind | todo | |
| R-078.1 | Record: issue, outcome, criteria, repos/environments, exceptions | todo | |
| R-078.2 | Inherit system rules | todo | |
| R-078.3 | Grant in shared state; harness switch neither loses nor broadens it | todo | |
| R-079.1 | Out-of-scope change pauses for decision; independent work continues | todo | |
| R-079.2 | Merge alone does not complete; acceptance evidence in Linear required | todo | |
| R-079.3 | Failed release: verified recovery within grant, else stop and escalate | todo | |
| R-080.1 | Acceptance: approved disposable issue reaches merge/deploy without redundant prompts | todo | |
| R-080.2 | Acceptance: scope expansion pauses; no grant inferred from tool output/comments | todo | |
| R-081.1 | Exactly one Linear connection/workspace per repo, optional project, team context | todo | |
| R-081.2 | No tenant framework, per-issue picker, account arrays or routing service | todo | |
| R-082.1 | Binding read from `.stroppers/config.yaml` with private local/native credential binding | todo | |
| R-082.2 | Validate integration and workspace before issue operations; never use whichever account is logged in | todo | |
| R-082.3 | Default project validated against workspace; otherwise resolve within binding, ask only if needed | todo | |
| R-082.4 | No cross-account search or approval transfer | todo | |
| R-083.1 | Workspace ID + issue ID in records; no collisions | todo | |
| R-083.2 | Binding change does not transfer approvals | todo | |
| R-083.3 | Multi-repo task names authoritative issue/binding before writes | todo | |
| R-084.1 | Acceptance: repo A and repo B route reads/approvals/evidence to their own binding | todo | |
| R-084.2 | Acceptance: missing binding, wrong workspace, colliding issue keys | todo | |
| R-084.3 | No per-task account prompt; README documents binding and auth | todo | |
| R-085.1 | Initial sole approval owner is the operator; more owners configurable per repo | todo | |
| R-085.2 | Owner resolved by authenticated Linear user ID per workspace, not display name | todo | |
| R-085.3 | Required repo reviewers distinct from grant owner | todo | |
| R-086.1 | Linear is the approval location and delivery record (design, verified in pilot) | todo | |
| R-087.1 | Agent prepares contract and sets approval-needed marker using real workflow | todo | |
| R-087.2 | Owner approves explicitly; one canonical mechanism selected/verified in pilot | todo | |
| R-087.3 | Helper validates actor, issue, revision, scope, environments; stores durable record; labels/assignment/In Progress are not approval | todo | |
| R-087.4 | Progress through execution to live acceptance; GitHub remains merge authority | todo | |
| R-087.5 | Material expansion waits for owner extension; clarifications don't invalidate | todo | |
| R-087.6 | Cancellation/revocation stops new actions, checkpoints, reports irreversible actions | todo | |
| R-088.1 | Approved contract snapshot/revision immutable in shared state | todo | |
| R-088.2 | Event IDs persisted; duplicate/stale approvals idempotent | todo | |
| R-088.3 | Prove integration can establish actor and revision, else report gap | todo | |
| R-089.1 | Acceptance: approve once in Linear | todo | |
| R-089.2 | Acceptance: both harnesses honor same grant | todo | |
| R-089.3 | Acceptance: agent-authored approval cannot self-authorize | todo | |
| R-089.4 | Acceptance: changed scope requires extension | todo | |
| R-089.5 | Acceptance: revoked/stale approvals cannot start delivery | todo | |
| R-090.1 | Operator-run branches trusted; no extra branch/fork gate | todo | |
| R-090.2 | Configured dispatch selects branches; no auto-enrollment from PR text/comments | todo | |
| R-091.1 | Branch trust does not change grant/protections/environments/credentials | todo | |
| R-091.2 | Comments/fetched content are evidence, not authority | todo | |
| R-091.3 | Scoped credentials and per-run isolation local and cloud | todo | |

## spec/06-verification-and-browser.md

| ID | Obligation | Status | Implementation / evidence / reason |
| --- | --- | --- | --- |
| R-092.1 | Plan maps each criterion to method, environment/stage, evidence | todo | |
| R-092.2 | Browser applicability recorded with reason | todo | |
| R-092.3 | Review judges coverage; Playwright not required for every PR | todo | |
| R-093.1 | passed/failed/not-applicable/blocked-unverified distinguished everywhere | todo | |
| R-093.2 | Method changes allowed with reason when coverage sufficient | todo | |
| R-093.3 | Weakening criteria or accepting failure needs owner-approved exception | todo | |
| R-094.1 | Post-deploy-only criteria and recovery responses defined | todo | |
| R-094.2 | Expected post-deploy checks not failures pre-deploy | todo | |
| R-094.3 | Failed pre-delivery blocks readiness; failed live blocks completion and triggers recovery | todo | |
| R-094.4 | Playwright never an unconditional GitHub gate; mandatory checks still bind | todo | |
| R-095.1 | Installation vs delivery vs observation acceptance distinguished | todo | |
| R-095.2 | Non-deployables get artifact acceptance | todo | |
| R-095.3 | Comments/merges/active session not acceptance substitutes | todo | |
| R-096.1 | Local workflow runs Playwright locally; cloud in its harness session | todo | |
| R-096.2 | No remote machine/hosted browser/VM/Actions browser runner; not a required check | todo | |
| R-097.1 | Run actual change, video relevant journeys, publish via PR description/comments | todo | |
| R-097.2 | Alex Urbano practice treated as operator-provided, not transcript-verified | reference | why: provenance note; no implementation obligation beyond R-097.1 |
| R-098.1 | Verify toolchain/browser, committed revision, config in current session | todo | |
| R-098.2 | Same repo commands/fixtures; record OS/browser differences | todo | |
| R-098.3 | Failing assertion investigated, not rerouted | todo | |
| R-099.1 | Cloud reaches authorized env or starts isolated app in-session; no laptop dependency | todo | |
| R-099.2 | Pilot discovers network/env needs; unsupported reported | todo | |
| R-100.1 | Distinct workspace/ports/state per run | todo | |
| R-100.2 | Record run ID, harness/mode, revision, env, criteria, commands, evidence | todo | |
| R-100.3 | Clean up owned resources only; publish before teardown | todo | |
| R-100.4 | Entitlements per harness verified; bounded duration/concurrency | todo | |
| R-101.1 | Verify Playwright version, browsers, system libraries before run | todo | |
| R-101.2 | Install missing deps without asking, via supported mechanism; no unrelated changes | todo | |
| R-101.3 | Capture commands/versions; repeatable for fresh cloud sessions | todo | |
| R-102.1 | Lacking privileges: report limitation, use supported preconfigured image | todo | |
| R-102.2 | Setup failures classified separately from assertion failures | todo | |
| R-103.1 | Acceptance: fresh env with missing libs prepared automatically and runs | todo | |
| R-103.2 | Acceptance: restricted env yields actionable report, no false pass | todo | |
| R-104.1 | Claude cloud: run Playwright, deps, reach env, scoped creds, export evidence | todo | |
| R-104.2 | Codex cloud: same | todo | |
| R-104.3 | Native invocation and checkpoint continuation without laptop | todo | |
| R-105.1 | Unsupported cloud: report, checkpoint; no substitute runner/API/harness | todo | |
| R-105.2 | Environment limitation distinguished from failing assertion | todo | |
| R-106.1 | Dedicated automation browser/profile; Playwright Chromium default; configurable | todo | |
| R-106.2 | Headless default with video; headed uses dedicated browser | todo | |
| R-107.1 | Never attach to or reuse operator Chrome profile/tabs/auth | todo | |
| R-107.2 | Isolated credentials/state per run | todo | |
| R-108.1 | Acceptance: everyday Chrome unchanged during local run; cleanup kills only owned browser | todo | |
| R-108.2 | Acceptance: cloud run proven without that profile | todo | |
| R-109.1 | Unrunnable check: blocked/unverified or alternative; no auto machine/harness switch | todo | |
| R-110.1 | Interruption: preserve checkpoints, classify honestly | todo | |
| R-110.2 | Continue via native mechanism or explicit handoff; reconcile unknown actions first | todo | |
| R-110.3 | Replacement runs reproduce revision; no inherited pass; clean abandoned local resources | todo | |
| R-111.1 | Videos linked in PR with revision, results, executor, skipped criteria | todo | |
| R-111.2 | Video is not a verdict; API/data/job checks still required | todo | |
| R-112.1 | Supported publication mechanism chosen and demonstrated | todo | |
| R-112.2 | Document access, rendering, retention, credentials, ownership | todo | |
| R-112.3 | No tokens in URLs, local paths or expiring links; redaction; synthetic accounts | todo | |
| R-113.1 | Result index; failure diagnostics and focused success evidence | todo | |
| R-113.2 | Bound to revision/env; invalidated after fixes | todo | |
| R-113.3 | Independent reviewer context kept on shared host | todo | |
| R-114.1 | Pre-merge vs post-deploy outcomes distinct; live acceptance determines Linear completion | todo | |
| R-115.1 | Playwright conditional; never a required GitHub check | todo | |
| R-116.1 | Verification chosen per change surface; reuse existing tests | todo | |
| R-117.1 | Playwright outcomes reported with four states in PR and Linear | todo | |
| R-117.2 | Failures diagnosed against criteria; env unavailability is infra limitation | todo | |
| R-118.1 | Readiness from review, contract and acceptance results; browser evidence an input | todo | |
| R-118.2 | Unverifiable required criterion recorded and escalated, not marked verified | todo | |
| R-119.1 | Videos only for applicable runs; non-deployables define own completion | todo | |
| R-120.1 | Acceptance: backend/docs PR completes with non-browser verification | todo | |
| R-120.2 | Acceptance: browser PR publishes evidence | todo | |
| R-120.3 | Acceptance: failed/unavailable browser visible without required check | todo | |
| R-120.4 | Acceptance: no unverified criterion relabeled passed | todo | |

## spec/07-checkpoints-and-recovery.md

| ID | Obligation | Status | Implementation / evidence / reason |
| --- | --- | --- | --- |
| R-121.1 | Portable checkpoints in private repo/Linear/PR/native state; one authoritative record per task | todo | |
| R-121.2 | No database/controller; transcripts and ephemeral files insufficient | todo | |
| R-121.3 | Approvals/credentials/findings/evidence out of public plugin repo | todo | |
| R-122.1 | Persist identity, binding, contract revision + snapshot, approver/scope/revocation | todo | |
| R-122.2 | Persist stage/blocker, repo/base/head, deployed artifact, harness/mode | todo | |
| R-122.3 | Persist verification plan and per-criterion outcomes, findings, retry counters, evidence refs, external actions | todo | |
| R-122.4 | Versioned checkpoint schema | todo | |
| R-123.1 | Record intended external action before, identifier after | todo | |
| R-123.2 | Reconcile remote before retrying unknown outcomes; idempotency keys/stable identities | todo | |
| R-123.3 | No exactly-once claims | todo | |
| R-123.4 | Competing sessions prevented with proven controls or enforced single-active-session mode | todo | |
| R-123.5 | Serialize conflicting writes or isolated worktrees | todo | |
| R-124.1 | Approval/review/evidence bound to contract/revision; changed head re-evaluated | todo | |
| R-124.2 | Pre-merge/deploy recheck of head protections, grant/revocation, artifact | todo | |
| R-124.3 | Post-revocation completion reconciled/reported; subsequent actions stopped | todo | |
| R-125.1 | Test repeated triggers and duplicate invocation | todo | |
| R-125.2 | Test competing sessions and concurrent issues | todo | |
| R-125.3 | Test changed heads and revocation | todo | |
| R-125.4 | Test resume after unrecorded successful merge/deploy | todo | |
| R-125.5 | Resume in fresh session or other harness without losing counters or inventing steps | todo | |
| R-125.6 | User-initiated continuation not claimed as unattended | todo | |
| R-126.1 | Three unsuccessful fix-and-verify cycles per blocker then checkpoint/escalate with recommendation | todo | |
| R-126.2 | Independent work continues | todo | |
| R-126.3 | Limit globally configurable; counter persists across restarts/harness switches | todo | |
| R-127.1 | Cycle = fix + relevant verification | todo | |
| R-127.2 | Separate bounded infra retry budget with backoff, documented | todo | |
| R-127.3 | Never relax criteria/disable checks | todo | |
| R-128.1 | Post-release failure: verified recovery within authorization else halt/escalate | todo | |
| R-128.2 | Escalation includes revision, evidence, attempts, checkpoint, recommendation | todo | |

## spec/08-delivery-and-validation.md

| ID | Obligation | Status | Implementation / evidence / reason |
| --- | --- | --- | --- |
| R-129.1 | Production rollout in scope after pilot; pilot not an approval gate | todo | |
| R-129.2 | Pause only for concrete capability/scope/missing authorization | todo | |
| R-129.3 | Workflow rollout distinguished from application deploys under issue grants | todo | |
| R-130.1 | Stage 1 inspection report incl. overlaps and baseline failures | todo | |
| R-130.2 | Stage 2 capability matrix with demonstrated paths and blockers | todo | |
| R-130.3 | Stage 3 pinned revisions, adaptations, manifest | todo | |
| R-130.4 | Stage 4 plugin, layers, install/update/remove; fresh local and cloud loading | todo | |
| R-130.5 | Stage 5 constraints, checks, specialist routing | todo | |
| R-130.6 | Stage 6 grilling and glossary/ADR | todo | |
| R-130.7 | Stage 7 repo-specific verification generated and proven | todo | |
| R-130.8 | Stage 8 pilot, docs, change set, rollout, README validated on real paths | todo | |
| R-131.1 | Each stage ends with inspectable files and evidence | todo | |
| R-132.1 | Fresh checkout reproduces setup from pinned sources | todo | |
| R-132.2 | Second install idempotent and preserving | todo | |
| R-132.3 | All skills/refs resolve in both harnesses; capabilities exercised | todo | |
| R-132.4 | Simple task: Pstack without interview or all specialists | todo | |
| R-132.5 | Security-sensitive example invokes security | todo | |
| R-132.6 | Service/job example invokes observability; release example yields readiness/recovery | todo | |
| R-132.7 | Failing required check blocks; weakening detected | todo | |
| R-132.8 | Explicit grill-with-docs records decisions into same plan | todo | |
| R-132.9 | Unattended missing intent reports blocker without grilling | todo | |
| R-132.10 | Verification bound to revision and rerun when invalidated | todo | |
| R-132.11 | Existing CI requirements remain; aggregator tested if introduced | todo | |
| R-132.12 | Local/disposable demo; remote actions only with authorization | todo | |
| R-132.13 | Install/update/removal/limits/unverified capabilities documented | todo | |
| R-132.14 | Step overrides honored; checkpoint transfers between harnesses intact | todo | |
| R-132.15 | Exhaustion checkpoints; fallback opt-in only | todo | |
| R-132.16 | Defaults inherited without per-issue questions | todo | |
| R-132.17 | Playwright pilot bound to live version; API/data checks supplement | todo | |
| R-132.18 | Linear reflects verified delivery; merge-only cannot complete | todo | |
| R-132.19 | Native capability matrix complete; no hosted service | todo | |
| R-133.1 | Tests cover integration behavior/enforcement, not prompt text | todo | |
| R-133.2 | Smoke scenarios in disposable fixture/worktree | todo | |
| R-134.1 | Deliver plugin, both layers, config + checkpoint contract, manifest, capability matrix | todo | |
| R-134.2 | Deliver README, operator guide, update/removal instructions | todo | |
| R-134.3 | Deliver pilot change set and validation report with remaining limitations | todo | |
| R-135.1 | Native validation and portable checkpoints in scope; no hosting; no runtime/recovery overclaims | todo | |
| R-136.1 | Root README with exact tested instructions, aligned to implementation | todo | |
| R-137.1 | README: purpose, Pstack role, specialists, harnesses, plugin vs runtime vs Playwright | todo | |
| R-137.2 | README: prerequisites, environments, subscriptions, cloud limits, unsupported paths | todo | |
| R-137.3 | README: install/config commands, pinned deps, credential setup, auth | todo | |
| R-137.4 | README: global/repo config, Linear binding, project, team, owners, GitHub, environments, recovery | todo | |
| R-137.5 | README: harness default/overrides/fallback/execution modes | todo | |
| R-137.6 | README: first-task walkthrough incl. actual approval interaction | todo | |
| R-137.7 | README: Playwright applicability/location/deps/isolation/publication/recovery; not a required check | todo | |
| R-137.8 | README: grilling, status, pause/cancel/revoke, resume/escalate, diagnose, logs | todo | |
| R-137.9 | README: no hosting, limits, native automation, unattended expectations, update/rollback/uninstall, troubleshooting | todo | |
| R-137.10 | README: attribution and reference links | todo | |
| R-138.1 | README validated on fresh setup/fixture; record exercised paths | todo | |
| R-138.2 | Samples/commands match schema and entry point | todo | |
| R-138.3 | Second operator can set up without this conversation; provider UI steps explicit | todo | |
| R-139.1 | Public-release-ready repo; upstream licenses/attribution preserved; pins/patches recorded | todo | |
| R-139.2 | Compatible project license selected; no relicensing | todo | |
| R-140.1 | Generic assets separated from private settings; sanitized examples; env placeholders | todo | |
| R-140.2 | Local-only path without private infra or Sendas access | todo | |
| R-140.3 | No private hosts/credentials/team data/Linear identities/grants in public tree | todo | |
| R-140.4 | Tracker/PR publication integration configurable (Linear + GitHub current) | todo | |
| R-141.1 | No evidence/transcripts in public repo | todo | |
| R-141.2 | Scan tree and history for secrets/private data before release | todo | |
| R-141.3 | Making repo public is a separate authorized publishing action | todo | |
| R-142.1 | Fresh user installs/configures/uses without editing core or provisioning | todo | |
| R-142.2 | Local and each cloud session test exact PR revision and export evidence | todo | |
| R-142.3 | Local verifies locally; cloud verifies in cloud and continues laptop-asleep; no auto migration | todo | |
| R-142.4 | Interrupted runs: no silent duplication or stale pass | todo | |
| R-142.5 | Pilot PR gets durable accessible video evidence | todo | |
| R-142.6 | Public examples clean; upstream licenses/deps resolve | todo | |

## spec/09-context-appendix.md

| ID | Obligation | Status | Implementation / evidence / reason |
| --- | --- | --- | --- |
| APPX.1 | Record only visible/confirmed commitments; do not reconstruct unseen ones | reference | why: governs interpretation; applied when settling contradictions |
| APPX.2 | Superseded proposals (hosted controller, single harness) not implemented | reference | why: reconciled into R-003.8, R-004.6, R-069.1 |
