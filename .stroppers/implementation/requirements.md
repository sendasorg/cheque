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
| R-001.1 | Reusable, low-maintenance open-source SDLC plugin centered on backnotprop/pstack | verified | file: plugins/stroppers/ (plugin), dependencies.json (pstack core pinned); run: VR#3,#4 load |
| R-001.2 | Pstack owns planning, execution, verification, PR feedback, merging | verified | file: skills/deliver/SKILL.md steps 4-7; run: PRE-5 used Pstack independent verifier and Opening a PR (VR run 5) |
| R-001.3 | Add narrowly scoped quality/production capabilities, no second lifecycle orchestrator | verified | file: references/specialists/*, lib/triggers.mjs; no lifecycle code (docs/architecture.md) |
| R-002.1 | Complete repo inspection, implementation, validation, reviewable change set | in-progress | why: change set on stroppers/release-0.1; review fixes applied, re-review pending |
| R-002.2 | Pilot in one repository before rollout | verified | run: pilot repo sogamoso/stroppers-pilot (docs/validation-report.md) |
| R-002.3 | Ask which target repo to use if not supplied, before installing/changing config | verified | why: pilot is a disposable fixture created by this session; operator settled repo questions (decisions.md D-001) |
| R-003.1 | Agent takes approved task through Pstack, specialists, independent verification, PR feedback, CI, authorized delivery | verified | run: PRE-5 approved, built, reviewed (Codex), verified, PR, CI, merged, recorded in Linear (VR runs 5-6) |
| R-003.2 | Delivery complete only when deliverable meets approved acceptance, evidence in Linear | verified | run: PRE-5 Done only after acceptanceSummary ok at merge commit; Linear evidence comment |
| R-003.3 | Deployable changes need target-environment application and live acceptance | unverified | why: no deployable delivery with live acceptance exercised |
| R-003.4 | Non-deployable artifacts use explicitly defined artifact acceptance | verified | file: references/verification.md (artifact acceptance); test: specialists docs-only -> release not applicable |
| R-003.5 | Observation windows / human judgment stay visible as outstanding acceptance | verified | file: SKILL.md step 9, release-readiness.md (observation windows stay open) |
| R-003.6 | Setup reproducible on another machine | in-progress | why: install from pinned tag pending release tag v0.1.7; fresh-machine replay pending |
| R-003.7 | Use harness-native local/cloud execution and native scheduling/triggers | verified | run: VR#12 Claude routine; docs/capability-matrix.md |
| R-003.8 | No custom controller, Eve, database, persistent worker or laptop daemon | verified | file: no server code in repo; docs/architecture.md |
| R-004.1 | Natural language primary; namespaced commands optional shortcuts; no per-task ceremony | verified | run: VR PRE-5 one-line request; file: skills/deliver description |
| R-004.2 | Self-contained plugin with path-aware adapters; `.stroppers/` for settings/notes; shared docs in conventional locations; no required symlinks/duplicates/sync | verified | file: lib/install.mjs, templates/; test: coexistence.test |
| R-004.3 | Playwright follows session execution location; no availability routing or local-to-cloud failover | verified | file: references/verification.md, lib/playwright.mjs (runs in-session only) |
| R-004.4 | Plugin does not run without a session; native schedules provide unattended starts; gaps reported | verified | file: README "Unattended runs"; docs/capability-matrix.md |
| R-004.5 | Use backnotprop/pstack (mirror of Lauren Tan's Pstack), not phthomas/pstack | verified | file: dependencies.json pstack=backnotprop/pstack@1f0f9c3 |
| R-004.6 | Support Claude Code and Codex from day one via existing subscriptions | verified | run: VR#1-#4 |
| R-004.7 | Global default harness plus per-step overrides (implementation, review, feedback fixes, live verification) | verified | file: lib/harness.mjs, defaults.yaml; test: review.test step overrides |
| R-004.8 | No model-provider accounts, API billing or Grok dependency | verified | file: lib/models.mjs (inherit-parent), lib/adapters.mjs reviewerEnv; test: reviewer env allowlist |
| R-004.9 | Both harnesses run the same delivery contract/verification commands; small adapters; shared checkpoints | verified | file: single SKILL.md + helper for both harnesses; run: VR#11 same grant both harnesses |
| R-004.10 | Subscription exhaustion checkpoints and waits; fallback only when explicitly enabled; never API billing | verified | file: bin/stroppers review (exhausted -> blocked unless fallback); test: fallbackAllowed, exhaustion classification |
| R-004.11 | Configure workflow/review/execution/routing/fallback/owners once with inherited defaults; no repeated questions | verified | file: lib/config.mjs layers; run: PRE-5 sessions asked no policy questions |
| R-004.12 | Distribute as plugin with shared skills/assets and small harness compatibility layers; no hosted infra | verified | file: .claude-plugin, .codex-plugin manifests; no hosted infra |
| R-004.13 | Upstream files unchanged where possible; separate package with distinct skill names; adaptations as small inspectable patches | verified | run: npm run vendor:check (byte-identical); dependencies.json modifications: none |
| R-004.14 | Reuse repo's existing toolchain, CI, deploy platform, instruction files, conventions | verified | file: lib/triggers.mjs reads repo; skill uses repo commands; run: pilot used npm test and existing CI |
| R-004.15 | Pstack owns dev/PR shipping; CI/GitHub enforce merge; release extension owns deploy readiness/verification | verified | file: SKILL.md steps 6-8; release-readiness.md |
| R-004.16 | Preserve required checks/reviews; any aggregator includes failures/cancellations/unexpected skips | not-applicable | why: Stroppers adds no aggregator check; existing required checks untouched (no CI changes in target repos) |
| R-004.17 | Initial implementation: reviewable change set; shared contract demonstrated through both harnesses on disposable pilot | verified | run: VR#1,#2,#4,#11 and PRE-5 on disposable pilot |
| R-004.18 | Prove native execution, cloud loading, scheduling/trigger and checkpoint continuation before promising unattended support | verified | docs/capability-matrix.md marks unattended support only where demonstrated |
| R-004.19 | Remote actions (PRs, protections, merge, deploy, access) follow session authorization | verified | why: remote actions limited to pilot repo/issues; stroppers main protection bypass disclosed (decisions D-009) |
| R-004.20 | Exclude full BMAD, Sharpen gate orchestration, another TDD/review router, always-on Ponytail mode | verified | file: dependencies.json (no BMAD/Sharpen/Ponytail installed) |
| R-004.21 | State/rules in git/GitHub, never tied to hostname, home directory or local credential export | verified | test: evidence.test refuses local paths; checkpoint holds no hostnames |
| R-004.22 | Planning a delivery path is distinct from executing a production release | verified | file: contract deployment field + authorizeAction deploy needs environment approval; release-readiness.md |
| R-005.1 | Ordinary-language outcome request applies configured policy | verified | run: PRE-5 "Use Stroppers to deliver PRE-5. Ship when verified." |
| R-005.2 | Intent to ship does not fabricate a missing grant; request only missing authority | verified | run: PRE-5 runs 1-4 waited for approval despite "ship" intent |
| R-005.3 | No repeated routing/stages/verification/recovery questions after approval | verified | run: PRE-5 run 5 asked no routing/stage questions |
| R-006.1 | One documented natural-language invocation pattern | verified | file: README "Your first delivery" |
| R-006.2 | One public namespaced entry point | verified | file: skills/deliver (stroppers:deliver) |
| R-006.3 | Discover repo settings and Linear binding; use settled defaults; ask only for missing intent/authority | verified | file: bin/stroppers doctor; run: PRE-5 sessions discovered binding from config |
| R-006.4 | Users need not learn schema, checkpoint formats or skill graph | verified | file: README hides schema; helper wraps checkpoint formats |
| R-006.5 | Concise actionable status/blockers/decisions | verified | run: PRE-5/PRE-6 final messages; file: SKILL.md Reporting |
| R-006.6 | README quickstart + first-task walkthrough focused on operator experience; advanced config linked | verified | file: README (quickstart + walkthrough; docs/configuration.md linked) |
| R-007.1 | Thin CLI adapters: invocation, scoped review input, result capture, explicit failure handling | verified | file: lib/adapters.mjs (invocation, prompt, parse, failure classes) |
| R-007.2 | Implement concrete Claude Code/Codex differences first; no speculative abstraction or generic platform | verified | file: two built-in adapters + command adapter only |
| R-008.1 | Pstack owns playbooks and repair/review/shipping loop | verified | file: references/pstack.md |
| R-008.2 | Stroppers adds config, specialist pointers, integration helpers only | verified | file: plugin contents (skills, references, helper) |
| R-008.3 | No duplicated lifecycle, second review hierarchy, or every-specialist-every-task | verified | test: specialists.test (only applicable specialists) |
| R-008.4 | Standards/checks applied per approved verification plan and actual triggers | verified | file: SKILL.md step 3 plan triggers |
| R-009.1 | Evidence-backed implementer/reviewer exchanges (reproduce, context, challenge, fix, re-review) | verified | file: SKILL.md step 5 (validate, fix, re-review) |
| R-009.2 | Clear disposition recorded for substantive findings | verified | file: bin/stroppers checkpoint finding --disposition --reason |
| R-009.3 | No unanimity requirement, debate for its own sake or indefinite loops; bounded recovery preserved | verified | file: recovery.md bounded cycles |
| R-009.4 | Reviewer findings do not change authority or weaken checks | verified | file: lib/review.mjs (findings only); approval.md |
| R-010.1 | Shared repo standards separated from personal harness/model/reasoning preferences | verified | file: operator.yaml vs .stroppers/config.yaml layers; test: config precedence |
| R-010.2 | Explicit per-repo/operator overrides preserved without teammates adopting Stroppers | verified | test: coexistence two developers |
| R-010.3 | Harness identity not equated with model/provider; record actual participants where observable | verified | file: review records reviewer.model; run: VR#1 gpt-6-astra, VR#2 claude-opus-5-5 |
| R-011.1 | Small set of representative real tasks assessing harness defaults and review usefulness | unverified | why: only pilot fixture tasks (seeded defect, PRE-5); no representative real-repository tasks evaluated yet |
| R-011.2 | Record outcomes, defects caught, noisy findings, elapsed time, observable usage | unverified | why: partial data only (review durations ~40s Codex, findings caught on seeded defect); no usage accounting |
| R-011.3 | No benchmark platform; keep accepted defaults; results inform documented recommendation | verified | why: defaults kept (Claude implements, different-harness review); no benchmark platform built |
| R-012.1 | Acceptance: concise request enters workflow without policy interview/mandatory command sequence | verified | run: PRE-5 run 5 |
| R-012.2 | Acceptance: reviewer selectable explicitly | verified | file: harness.review.reviewer; test: explicit override |
| R-012.3 | Acceptance: specialists only when applicable | verified | test: specialists.test; run: PRE-5 ran no security/observability |
| R-012.4 | Acceptance: routine approved task completes without redundant prompts | verified | run: PRE-5 run 6 completed without approval prompts once the harness merge permission was granted (documented in README) |
| R-012.5 | Acceptance: missing intent/authority/unsupported capability yield specific blockers | verified | run: PRE-6 unattended blocker; doctor blockers |
| R-012.6 | Acceptance: README first-task example exercises this interface | verified | file: README first-task example uses the one-line request |

## spec/02-sources-and-specialists.md

| ID | Obligation | Status | Implementation / evidence / reason |
| --- | --- | --- | --- |
| R-013.1 | Read current files at chosen revisions before implementing | verified | run: agents read pinned files (scratchpad upstream clones at pinned SHAs) |
| R-014.1 | Use the listed component sources (pstack, Addy x4, Matt x4, Sharpen reference only) | verified | file: dependencies.json sources |
| R-014.2 | Sharpen is an enforcement reference, not an installation | verified | file: dependencies.json references.sharpen (not installed) |
| R-015.1 | Manifest records source, exact SHA, license, destination, referenced deps, modifications | verified | file: dependencies.json (repo, sha, license, destination, include, modifications) |
| R-015.2 | Include supporting references (no broken links from copying SKILL.md alone) | verified | test: link resolution; known upstream pstack links (8 poteto-help guide links + 1 placeholder) listed in references/pstack.md |
| R-015.3 | Preserve attribution in vendored assets | verified | file: vendor/*/LICENSE, NOTICE; THIRD_PARTY_NOTICES.md |
| R-016.1 | Inspect pinned pstack files for host-specific behavior | verified | file: references/pstack.md (host-specific behaviors) |
| R-016.2 | Inspect dependency closure: agent spawning, model routing, task tracking, PR watcher, loop/wakeup, UI/CLI | verified | file: references/pstack.md known limits (subagents, models, /loop, watch-pr bun, Cursor-only) |
| R-016.3 | Demonstrate selected paths in Claude Code and Codex | unverified | why: Claude Code drove the full Pstack flow (PRE-5); Codex demonstrated for review and approval only, not a full Pstack playbook |
| R-016.4 | Mark unsupported capabilities explicitly | verified | file: references/pstack.md, docs/capability-matrix.md |
| R-017.1 | Do not silently substitute michael-denyer/pstack-claude; report blocker first if needed | verified | file: dependencies.json notes; no pstack-claude used |
| R-018.1 | Adapt constraint-driven-development against existing standards file or root CONSTRAINTS.md | verified | file: references/specialists/quality-contract.md (documents.constraints default CONSTRAINTS.md) |
| R-018.2 | Reference it from `.stroppers/`; no relocation or second copy | verified | file: .stroppers/README.md template links; no copy |
| R-018.3 | Standalone upstream skill reads/updates the same document | verified | test: coexistence standalone docs unchanged |
| R-019.1 | Each enforceable rule: command, scope, baseline/threshold, stage | verified | file: quality-contract.md (upstream format: command, scope, threshold, stage) |
| R-019.2 | Establish current baselines first | unverified | why: no target repo baseline established yet (pilot has no CONSTRAINTS.md); process documented |
| R-019.3 | Exceptions carry reason, owner, review/expiry date | verified | file: quality-contract.md exceptions (reason, owner, expiry) per upstream format |
| R-020.1 | Reuse native stack checks derived from the repo | verified | file: quality-contract.md (derive from repo); run: pilot used npm test |
| R-021.1 | Fast local, task-completion and CI checks via repo's existing command interface | verified | file: quality-contract.md (fast/task/CI via repo interface) |
| R-021.2 | Detect newly weakened checks | verified | test: specialists.test threshold loosened |
| R-021.3 | Detect unexplained test skips/deletions | verified | test: specialists.test assertion removed, test deleted, test skipped |
| R-021.4 | Detect reduced budgets | verified | test: specialists.test loosening a CONSTRAINTS.md threshold |
| R-021.5 | Legitimate replacement/refactoring possible with evidence | verified | file: quality-contract.md (evidence + owner exception) |
| R-022.1 | Security assessment triggers: authn/z, trust boundaries, secrets, uploads, webhooks, sensitive data, dependency additions, external integrations | verified | file: lib/triggers.mjs; test: specialists webhook/auth, dependency |
| R-023.1 | Security output: assets/boundaries, abuse cases, checks, findings, residual risk | verified | file: references/specialists/security.md output list |
| R-023.2 | Convert suitable checks into CI with existing tools | verified | file: security.md (propose CI with existing tools) |
| R-023.3 | Findings feed Pstack repair/review loop | verified | file: SKILL.md step 5 (specialist findings join loop) |
| R-024.1 | Change descriptions/review comments treated as untrusted; claims assessed against code | verified | file: security.md; lib/review.mjs prompt treats PR text as untrusted |
| R-024.2 | Scans/LLM review are evidence, not proof | verified | file: security.md |
| R-025.1 | Observability triggers: production services, jobs, integrations, important journeys | verified | file: lib/triggers.mjs; test: background job |
| R-026.1 | Reuse installed monitoring; define logs/metrics/tracing/failure signals | verified | file: references/specialists/observability.md |
| R-026.2 | No credential/sensitive payload logging | verified | file: observability.md |
| R-026.3 | State local-verifiable vs deployed-only | verified | file: observability.md |
| R-027.1 | Observability output: signals, evidence, gaps; instrumentation only for concrete questions | verified | file: observability.md |
| R-028.1 | Distinct release-readiness capability adapted from shipping-and-launch | verified | file: references/specialists/release-readiness.md |
| R-028.2 | Pstack shipping playbook kept intact | verified | file: vendored pstack shipping.md unmodified (vendor:check) |
| R-029.1 | Pre-deploy: artifact/revision, migration compatibility, mechanism, health checks, rollback/forward recovery | verified | file: release-readiness.md pre-deploy list |
| R-029.2 | Staged rollout/flags when appropriate; no forced multi-day canary | verified | file: release-readiness.md |
| R-030.1 | Post-deploy: live acceptance, deployed revision, errors, latency, side effects | unverified | why: process implemented; no deployed target in pilot (contract had no deployment) |
| R-030.2 | Playwright default for browser checks with assertions/screenshots/traces | verified | file: lib/playwright.mjs (assertions, video, traces on failure) |
| R-030.3 | API/data/job changes get direct checks | verified | file: release-readiness.md, verification.md |
| R-030.4 | Skipped applicable checks = unverified; out-of-scope = not applicable with reason | verified | file: checkpoint outcomes require reasons; test: recordOutcome |
| R-030.5 | Merge is not production evidence | verified | run: PRE-5 re-verified after merge before Done |
| R-031.1 | Concise success evidence and richer failure diagnostics in Linear linked to outcome and deployed version | verified | run: PRE-5 Linear evidence comment linked to merged revision |
| R-031.2 | Redact sensitive data; avoid unnecessary recordings | verified | file: lib/evidence.mjs checkPublishable; videos only for browser runs |
| R-031.3 | Outstanding observation/human acceptance kept open | verified | file: SKILL.md step 9 |
| R-031.4 | Discover actual Linear workflow states before writing | verified | file: lib/linear.mjs setIssueState rejects unknown statuses; run: PRE-5 moved to Done |
| R-032.1 | Install grill-with-docs with closure (grilling, domain-modeling, required refs) | verified | file: vendor/mattpocock-skills (grill-with-docs, grilling, domain-modeling + format files); skills/grill-with-docs |
| R-032.2 | Expose grill-me optionally | verified | file: skills/grill-me |
| R-033.1 | Document `grill-with-docs` spelling; no alias unless requested | verified | file: README, discovery.md |
| R-034.1 | grill-with-docs only on explicit stress-test request; grill-me for general decisions | verified | file: discovery.md; skill wrappers disable-model-invocation |
| R-035.1 | No automatic grilling in unattended sessions | verified | run: PRE-6 unattended did not start discovery |
| R-035.2 | Offer discovery when ambiguity matters; research facts first; small tasks go straight to Pstack | verified | file: discovery.md |
| R-036.1 | Persist terminology/decisions in authoritative glossary/ADR (default GLOSSARY.md, docs/adr/) | unverified | why: wiring documented (grill-with-docs wrapper -> documents.glossary/adr_dir); interactive session not exercised |
| R-036.2 | Summarize goals/non-goals/criteria/unresolved in Pstack's planning artifact; one plan | unverified | why: decision D-007 implemented in wrapper text; not exercised end to end |
| R-036.3 | Honor grilling skill's completion/confirmation requirement | verified | file: wrapper defers to upstream grilling (confirmation rule) unmodified |
| R-037.1 | Unattended unanswered product decision: record blocker, route to operator, no interview, no invented approval | verified | run: PRE-6 blocker recorded, no interview, no invented approval |
| R-038.1 | Thin project entry point invokes Pstack and injects extension pointers at stages | verified | file: skills/deliver |
| R-038.2 | Prove routing works (installation insufficient) | verified | run: PRE-5 routed through stages |
| R-039.1 | Stage 1 discovery (explicit only) feeds Pstack | verified | file: SKILL.md step 1 + discovery.md |
| R-039.2 | Stage 2 planning reads quality contract and flags security/observability/release implications | verified | file: SKILL.md step 3 |
| R-039.3 | Stage 3 build via Pstack paths | verified | file: SKILL.md step 4 |
| R-039.4 | Stage 4 specialist findings join Pstack review/repair; rerun affected checks | verified | file: SKILL.md step 5 |
| R-039.5 | Stage 5 PR/merge Pstack-owned; current-head CI and independent verification enforced | verified | run: PRE-5 merge pinned to verified head with CI green |
| R-039.6 | Stage 6 release-readiness under delivery authorization | verified | file: SKILL.md step 8 + release-readiness.md |
| R-039.7 | Stage 7 completion evidence in Linear tied to deployed revision; outstanding work visible | verified | run: PRE-5 Linear evidence + Done |
| R-040.1 | One documented public entry point | verified | file: README |
| R-040.2 | Namespaced local extensions, no collisions | verified | test: package.test no collisions; namespaced plugin skills |
| R-040.3 | Short always-loaded instructions; specialist refs disclosed on triggers | verified | run: claude plugin details ~226 always-on tokens; references loaded on triggers |
| R-040.4 | Outcomes pass/fail/not-applicable(reason)/unverified(reason); unverified never passing | verified | test: runStatus (all skipped -> unverified); recordOutcome reasons |
| R-041.1 | Use Pstack create/maintain-verification-skill before generic testing guidance | verified | run: Pstack create-verification-skill generated pilot verify-price-calculator (pilot PR #4) |
| R-041.2 | Tailor real-app verification to repo and execute once | verified | run: generated skill executed end to end once; fixed two issues it found |

## spec/03-config-and-compatibility.md

| ID | Obligation | Status | Implementation / evidence / reason |
| --- | --- | --- | --- |
| R-042.1 | Separate plugin assets, private operator policy, repo adapters, task/run state | verified | file: plugins/ (generic), ~/.config operator (private), .stroppers/config.yaml (repo), .stroppers/state (run); docs/configuration.md |
| R-042.2 | Sanitized examples and documented config schema | verified | file: docs/configuration.md schema; templates/config.yaml placeholders |
| R-042.3 | Credentials by reference only; never in checkpoints | verified | test: explain names credentials without values; checkpoint holds no secrets |
| R-043.1 | Precedence: packaged < private operator < permitted repo < recorded task exceptions | verified | test: config precedence order |
| R-043.2 | Task text/untrusted repo settings cannot expand owners, credentials, environments, authority | verified | test: repo authority, reviewer commands and task exceptions rejected; authorizeAction intersects operator authority |
| R-043.3 | Step overrides explicit; browser location follows session mode | verified | file: no config key for browser location; harness.steps explicit |
| R-043.4 | Unknown/invalid settings rejected visibly | verified | test: unknown/invalid settings rejected |
| R-043.5 | Effective configuration documentable without secrets | verified | file: stroppers config explain |
| R-044.1 | Project-scoped install inheriting private operator policy | verified | run: claude plugin install --scope project; operator layer separate |
| R-044.2 | Idempotent install | verified | test: install idempotent |
| R-044.3 | Pinned dependency update with inspectable diff | verified | file: scripts/vendor.mjs update (diff then repin); README update steps |
| R-044.4 | Rollback to previous compatible version | verified | run: marketplace pinned by #ref observed (pilot pinned to branch, version-keyed updates 0.1.0->0.1.6); README rollback steps; rollback to a tag not exercised |
| R-044.5 | Safe uninstall | verified | test: uninstall tests |
| R-044.6 | Track managed files/sections; preserve unrelated content; report conflicts | verified | test: conflicts reported, unrelated content preserved |
| R-044.7 | Updates retain delivery state/approvals or checkpoint incompatible runs | verified | file: checkpoint lives in Linear; schema version refusal in checkpoint.parse |
| R-045.1 | `.stroppers/` at repo root for Stroppers settings/operating docs | verified | file: templates; lib/install.mjs |
| R-045.2 | Shared docs/skills stay conventional; `.stroppers/README.md` references them | verified | file: templates/stroppers-readme.md |
| R-046.1 | `.stroppers/config.yaml` versioned, one Linear binding + optional project, credential refs only | verified | file: templates/config.yaml |
| R-046.2 | `.stroppers/config.local.yaml` ignored private overrides | verified | file: gitignore block; test: tracked config.local rejected |
| R-046.3 | `.stroppers/README.md` operating context and links | verified | file: templates/stroppers-readme.md |
| R-046.4 | `.stroppers/docs/` Stroppers-only notes | verified | file: documents.planning_dir default .stroppers/docs/plans |
| R-046.5 | `.stroppers/verification/` supplemental helpers | verified | file: verification.md (.stroppers/verification for helpers) |
| R-046.6 | `.stroppers/state/` ignored, restored from authoritative record | verified | file: gitignore block; checkpoint restore from Linear |
| R-046.7 | `.stroppers/artifacts/` ignored, published before teardown | verified | file: gitignore block; evidence publish before teardown |
| R-047.1 | Credentials, grants, recordings, runtime state never in public tree | verified | file: gitignore block; checkPublishable; public tree scan (R-141.2) |
| R-047.2 | Durable records mirrored to private Linear/PR/native state and materialized on continuation without resetting approval/retry state | verified | run: PRE-5 fresh sessions restored from Linear without resetting approval/counters |
| R-047.3 | Public examples are placeholders only | verified | file: templates, docs use placeholders |
| R-048.1 | Native locations for manifests, skills, AGENTS.md/CLAUDE.md, tests, CI, package config | verified | file: manifests and skills in native locations |
| R-048.2 | New shared docs at CONSTRAINTS.md, GLOSSARY.md, docs/adr/; repo conventions win | verified | file: defaults.yaml documents.* |
| R-048.3 | No pointer-only replacement of shared docs; symlinks not sole mechanism | verified | file: no pointer replacement; symlinks unused |
| R-049.1 | Settings affect Stroppers-invoked work only | verified | test: coexistence (no global writes) |
| R-049.2 | Upstream skills keep names, discovery paths, user config, behavior | verified | test: coexistence standalone skills unchanged |
| R-049.3 | No shadowing, global skill changes, rewriting others' config or global routing | verified | test: coexistence + package.test |
| R-049.4 | Root instruction addition (if any) small, identified, scoped, non-mandatory | not-applicable | why: Stroppers adds no root instruction section |
| R-050.1 | Read Pstack model settings and apply session config at entry point without rewriting global files | verified | file: lib/models.mjs, references/pstack.md; test: model map in ignored state |
| R-050.2 | Standalone invocation does not inherit Stroppers policy | verified | test: global pstack-models.md never written |
| R-050.3 | Inspect actual consumption; report incompatibility if scoped overrides impossible | unverified | why: override is instruction-level; Pstack has no scoped path. Not observed which model a Pstack subagent used in the pilot |
| R-051.1 | Generated verification skill in harness skill dir with feature map intact | verified | run: .claude/skills/verify-price-calculator with feature map (pilot PR #4) |
| R-051.2 | `.stroppers/verification/` does not displace it | verified | file: verification.md |
| R-051.3 | One canonical source for shared documents | verified | file: documents.* point at canonical files |
| R-051.4 | Adapters only in namespaced Stroppers assets; pinned and recorded | verified | file: adaptations only in skills/ references (namespaced); dependencies.json modifications none |
| R-052.1 | Install/update/uninstall track owned files/sections; preserve others | verified | test: install tests |
| R-052.2 | Uninstall never deletes shared constraints/glossary/ADRs/verification | verified | test: uninstall keeps shared documents |
| R-052.3 | Legacy relocated docs marked for reviewable migration | not-applicable | why: no legacy relocated documents exist in pilot or rollout targets |
| R-052.4 | Runtime hooks no-op outside Stroppers work, tested; footprint reported | verified | run: claude plugin details: Hooks (0); always-on ~226 tokens |
| R-053.1 | Works without teammates installing it or adopting settings | verified | test: coexistence two developers |
| R-053.2 | Works without separately installed upstream plugins (bundled/pinned closure) | verified | file: vendored closure; run: fresh Codex home load |
| R-053.3 | Package-owned adaptations isolated from independent upstream installs | verified | file: vendored copies never registered |
| R-054.1 | Config resolves shared doc paths; defaults to standard locations | verified | file: defaults.yaml documents |
| R-054.2 | Configured path changes Stroppers lookup only | verified | file: configuration.md |
| R-054.3 | Never two editable copies or sync service | verified | file: no sync code |
| R-055.1 | Symlinks optional/explicit; relative in-repo; never overwrite conventional files | not-applicable | why: symlinks not selected |
| R-055.2 | Link-free path supported; no silent copy fallback | verified | file: link-free layout is the only one |
| R-056.1 | Thin harness entries may refer to package instructions/shared docs | verified | file: templates/cloud-entry-SKILL.md |
| R-056.2 | Uninstall leaves no broken managed links | verified | test: uninstall removes cloud entry dirs |
| R-056.3 | README distinguishes packaging, configurable paths, shared standards, symlink limits | verified | file: README Coexistence |
| R-057.1 | Coexistence mode 1: enabled/invoked | verified | run: PRE-5 |
| R-057.2 | Coexistence mode 2: installed not invoked | verified | run: pilot-b had the plugin installed while a non-Stroppers session generated the verification skill (validation report); no hooks, namespaced skills |
| R-057.3 | Coexistence mode 3: disabled/uninstalled | verified | test: uninstall leaves standalone/shared files |
| R-057.4 | Coexistence mode 4: standalone upstream only, same authoritative files | verified | test: standalone files unchanged by install/uninstall (byte level); behavior of standalone skills see R-057.6 |
| R-057.5 | Two developers with different user settings/credentials unaffected | verified | test: two developers |
| R-057.6 | Standalone Pstack routing, grilling and verification generation keep working on the same files | unverified | why: verification generation ran from the vendored Pstack skill on shared paths (pilot PR #4); a separately installed standalone Pstack and grilling were not exercised |
| R-058.1 | Discovery/entry checks repeated in local/cloud for both harnesses | unverified | why: Claude local and cloud, Codex local demonstrated; Codex cloud blocked (no cloud environment) |
| R-058.2 | No duplicate skill names, doc drift, account leakage, overwritten instructions, cleanup of shared assets | verified | test: coexistence + package tests |
| R-058.3 | Second repo settings cannot affect first | verified | test: second repository settings do not leak |
| R-058.4 | Missing config blocks only Stroppers operations | verified | test: missing config blocks only Stroppers |
| R-058.5 | Compatibility evidence/limits in README | verified | file: README Coexistence, validation report |

## spec/04-harnesses-and-native-automation.md

| ID | Obligation | Status | Implementation / evidence / reason |
| --- | --- | --- | --- |
| R-059.1 | Global default harness = Claude Code; steps inherit unless overridden | verified | file: defaults.yaml harness.default claude-code; test: harnessForStep |
| R-059.2 | Default reviewer policy `different-harness` | verified | file: defaults.yaml policy different-harness |
| R-059.3 | Resolve against actual implementing harness incl. step overrides | verified | test: selection follows implementer; file: detectSession |
| R-059.4 | Cross-harness review is a workflow step, not fallback | verified | file: lib/harness.mjs fallbackAllowed separate |
| R-060.1 | Explicit reviewer override wins and survives default changes | verified | test: explicit override survives default change |
| R-060.2 | Explicit same-harness fresh-context policy allowed; never automatic downgrade | verified | test: same-harness only by policy; CLI --reviewer routed through selectReviewer; runReview refuses implementer self-review |
| R-060.3 | Separate implementer/reviewer sessions | verified | file: review runs in a separate CLI session |
| R-060.4 | Changing defaults is configuration-only | verified | file: config-only change (docs/configuration.md) |
| R-061.1 | Small adapter registry with ordered reviewer preferences | verified | file: adapters registry |
| R-061.2 | Deterministic: first enabled compatible reviewer differing from implementer | verified | test: third harness deterministic |
| R-061.3 | Preference order explicit in effective config | verified | file: config explain shows preferences |
| R-061.4 | Record harness and model when observable; no unproven diversity claims | verified | file: review record reviewer.model |
| R-062.1 | Adapter declares local/cloud, review-only, auth/cost mode, results, checkpoint input, version reqs, limits | verified | file: adapters.mjs declares |
| R-062.2 | Exclude unconfigured/unsupported/unauthorized candidates | verified | file: bin review computes available via authCheck |
| R-062.3 | No reviewer: checkpoint blocked with continuation; no implementer self-review, paid API or hosting | verified | test: missing reviewer blocks; runReview refuses implementer; run: cloud review recorded unavailable |
| R-062.4 | Started reviewer identity/findings preserved; outages don't switch or reset budgets | verified | file: checkpoint reviews persisted; counters untouched |
| R-063.1 | Claude to Codex and Codex to Claude both supported | verified | run: VR#1, VR#2 |
| R-063.2 | Reuse/adapt pinned codex-plugin-cc after inspecting contracts | verified | file: decisions D-006 (schema reused, companion not compatible: no head/contract input) |
| R-063.3 | Reverse via supported Claude Code programmatic invocation | verified | file: claude adapter claude -p |
| R-063.4 | Demonstrate subscription auth; avoid API-key modes | verified | run: auth checks claude.ai / ChatGPT |
| R-063.5 | Cloud cross-harness invocation separately proven | blocked | why: Claude cloud lacks Codex CLI and ChatGPT credential; Codex cloud env missing (capability matrix) |
| R-064.1 | Future adapters without lifecycle/contract edits; none speculative in v1 | verified | file: command adapter extension point; test: third harness |
| R-064.2 | Review/checkpoint contracts independent of vendor transcripts | verified | file: findings schema independent of transcripts |
| R-065.1 | Reviewer gets criteria, constraints, exact base/head, scope, diff, repo access | verified | file: lib/review.mjs prompt (contract, constraints path, base/head, scope, diff file) |
| R-065.2 | Not reliant on implementer summary | verified | file: prompt excludes implementer summary |
| R-065.3 | Findings: severity, location, scenario, evidence, recommendation; no manufactured disagreement | verified | file: schemas/findings.schema.json (severity, location, scenario, evidence, recommendation) |
| R-066.1 | Reviewer read-only; implementer owns fixes | verified | file: read-only tools/sandbox |
| R-066.2 | Restricted sandbox or isolated checkout for review | verified | file: shared clone of head in temp dir |
| R-066.3 | Raw output + structured findings captured; timeout/auth failure never clean | verified | test: raw output kept; timeout/auth never clean |
| R-066.4 | Dispositions with evidence; affected fixes re-checked under bounded policy | verified | file: checkpoint finding disposition with reason |
| R-066.5 | Model agreement not a substitute for acceptance verification | verified | file: SKILL.md (review then acceptance verification) |
| R-067.1 | Reviewer role marked; nested cross-harness delegation disabled | verified | test: nested review refused (STROPPERS_ROLE=reviewer) |
| R-067.2 | Review result carries no authority; doesn't bypass GitHub reviews/checks | verified | file: approval.md; review records carry no authority |
| R-068.1 | Test: Claude impl + Codex review | verified | run: VR#1 |
| R-068.2 | Test: Codex impl + Claude review | verified | run: VR#2 |
| R-068.3 | Test: explicit reviewer override | verified | test: explicit override |
| R-068.4 | Test: actual-implementer step override | verified | test: step override implementer |
| R-068.5 | Test: missing reviewer | verified | test: missing reviewer blocks |
| R-068.6 | Test: invalid configuration | verified | test: invalid configuration |
| R-068.7 | Test: subscription exhaustion | verified | test: exhaustion classification (fake CLI) |
| R-068.8 | Test: reviewer timeout | verified | test: reviewer timeout |
| R-068.9 | Test: changed head | verified | test: review current only for head |
| R-068.10 | Test: fake third-harness fixture, deterministic preference, implementer exclusion | verified | test: fake third harness |
| R-068.11 | Findings/counters preserved on continuation | verified | test: counters across render/parse and harness switch |
| R-069.1 | Deliverable is a harness plugin; no hosted controller/worker/DB/daemon | verified | file: no hosted components |
| R-069.2 | Reuse existing authenticated connectors | verified | file: gh CLI and harness auth reused |
| R-070.1 | Unattended schedules are native cloud runs, not desktop schedules | verified | run: Claude routine (cloud) used, not desktop schedule |
| R-070.2 | Both harnesses via their actual packaging/loading mechanisms; one workflow source of truth | verified | run: Claude plugin + Codex plugin load (VR#3,#4) |
| R-070.3 | Demonstrate each path; document limitations | verified | file: capability matrix documents each path and limitation |
| R-071.1 | Approved cloud work continues with laptop asleep | unverified | why: cloud run executed in vendor VM, but no approved delivery ran unattended and the laptop was not closed |
| R-071.2 | Document triggers, cadence/limits, settings, credential renewal, env setup, dropped/repeated events, recovery | verified | file: capability matrix + README Unattended runs |
| R-071.3 | Contract validated at each continuation; trigger payload not approval | verified | file: SKILL.md continue re-verifies approval; routine fire text is untrusted (docs) |
| R-072.1 | Verify native capabilities from official docs and installed versions | verified | file: capability matrix cites docs and local versions |
| R-072.2 | No relay-requiring API trigger advertised as no-hosting; no polling daemon | verified | file: capability matrix (API trigger is native; no relay) |
| R-073.1 | Local stays local, cloud stays cloud; Playwright co-located | verified | file: playwright.mjs in-session only |
| R-073.2 | No laptop detection, cloud-to-laptop dispatch or automatic migration; explicit handoff only | verified | file: no migration code; README explicit continuation |
| R-074.1 | Unattended cross-harness review demonstrated in-environment with subscription auth | blocked | why: unattended cross-harness review in cloud not available (capability matrix) |
| R-074.2 | If impossible: checkpoint, report blocker, explicit continuation, no claim of full unattended | verified | run: cloud review recorded unavailable; continuation path documented |
| R-075.1 | Fresh local+cloud install/load for both harnesses | unverified | why: Claude local+cloud and Codex local demonstrated; Codex cloud blocked (no cloud environment: provider UI) |
| R-075.2 | Native automation configured and exercised | verified | run: Claude routine run_once and run now |
| R-075.3 | Laptop-closed cloud run with execution, review and evidence publication | unverified | why: cloud run executed and posted to PR, but Playwright blocked by allowlist and review unavailable; full laptop-closed delivery not demonstrated |
| R-075.4 | Checkpoint continuation proven; automatic vs manual distinguished | verified | run: PRE-5 continuation across fresh sessions (manual continuation); automatic native recovery not claimed |
| R-076.1 | No custom hosting; $100 ceiling only for separately approved future proposals | verified | file: no hosting |
| R-076.2 | Document usage limits and evidence storage | verified | file: capability matrix limits (routine caps, evidence storage in GitHub releases) |
| R-076.3 | No paid APIs, browser services or purchases; report gaps | verified | why: no paid services added |

## spec/05-linear-and-authority.md

| ID | Obligation | Status | Implementation / evidence / reason |
| --- | --- | --- | --- |
| R-077.1 | Upfront per-issue approval grants implement/PR/feedback/merge/deploy within scope | verified | run: PRE-5 implemented, PR, merged after one approval |
| R-077.2 | No repeated approval inside grant; protections still bind | verified | run: PRE-5 run 5/6 no repeated approval; branch protection respected (pilot none) |
| R-078.1 | Record: issue, outcome, criteria, repos/environments, exceptions | verified | file: contract fields; test: validateContract |
| R-078.2 | Inherit system rules | verified | file: config layers inherited |
| R-078.3 | Grant in shared state; harness switch neither loses nor broadens it | verified | run: VR#11 both harnesses honor grant; grant stored in Linear checkpoint |
| R-079.1 | Out-of-scope change pauses for decision; independent work continues | verified | test: authorizeAction default-deny, extension required |
| R-079.2 | Merge alone does not complete; acceptance evidence in Linear required | verified | run: PRE-5 Done only after acceptance ok |
| R-079.3 | Failed release: verified recovery within grant, else stop and escalate | verified | file: release-readiness.md, recovery.md |
| R-080.1 | Acceptance: approved disposable issue reaches merge/deploy without redundant prompts | verified | run: PRE-5 approved in-scope issue merged without redundant prompts (no deploy in contract; deploy path unverified, see R-030.1) |
| R-080.2 | Acceptance: scope expansion pauses; no grant inferred from tool output/comments | verified | run: VR#10 production deploy refused; test: scope extension |
| R-081.1 | Exactly one Linear connection/workspace per repo, optional project, team context | verified | file: linear.workspace/team/project single binding |
| R-081.2 | No tenant framework, per-issue picker, account arrays or routing service | verified | file: no account arrays or pickers |
| R-082.1 | Binding read from `.stroppers/config.yaml` with private local/native credential binding | verified | file: config.yaml binding + env credential refs |
| R-082.2 | Validate integration and workspace before issue operations; never use whichever account is logged in | verified | run: VR#8 wrong workspace rejected; checkBinding before issue ops |
| R-082.3 | Default project validated against workspace; otherwise resolve within binding, ask only if needed | verified | file: project optional; team validated |
| R-082.4 | No cross-account search or approval transfer | verified | file: no cross-account search |
| R-083.1 | Workspace ID + issue ID in records; no collisions | verified | test: distinct task keys |
| R-083.2 | Binding change does not transfer approvals | verified | file: approval verified per bound workspace |
| R-083.3 | Multi-repo task names authoritative issue/binding before writes | verified | file: checkpoint task identity includes repository |
| R-084.1 | Acceptance: repo A and repo B route reads/approvals/evidence to their own binding | verified | test: two repos different bindings; run: same key rejected for a repository bound to another workspace, accepted for its own binding |
| R-084.2 | Acceptance: missing binding, wrong workspace, colliding issue keys | verified | test+run: missing binding blockers, wrong workspace, colliding keys |
| R-084.3 | No per-task account prompt; README documents binding and auth | verified | file: README binding and auth |
| R-085.1 | Initial sole approval owner is the operator; more owners configurable per repo | verified | file: operator.yaml owners (private); configurable |
| R-085.2 | Owner resolved by authenticated Linear user ID per workspace, not display name | verified | test: lookalike display name rejected; ids only |
| R-085.3 | Required repo reviewers distinct from grant owner | verified | file: approval.md |
| R-086.1 | Linear is the approval location and delivery record (design, verified in pilot) | verified | run: PRE-5 approval in Linear |
| R-087.1 | Agent prepares contract and sets approval-needed marker using real workflow | verified | run: contract posted by agent app; optional approval_state marker |
| R-087.2 | Owner approves explicitly; one canonical mechanism selected/verified in pilot | verified | file: decisions D-008 canonical comment mechanism; run: owner comment |
| R-087.3 | Helper validates actor, issue, revision, scope, environments; stores durable record; labels/assignment/In Progress are not approval | verified | run: VR#9/#10; test: authorizeAction unknown action/missing target refused |
| R-087.4 | Progress through execution to live acceptance; GitHub remains merge authority | verified | run: PRE-5 |
| R-087.5 | Material expansion waits for owner extension; clarifications don't invalidate | verified | test: owner extension approves widened revision; forged extension rejected |
| R-087.6 | Cancellation/revocation stops new actions, checkpoints, reports irreversible actions | verified | test: revoke and cancel; SKILL.md revoke handling |
| R-088.1 | Approved contract snapshot/revision immutable in shared state | verified | test: stale revision; contract edit after approval |
| R-088.2 | Event IDs persisted; duplicate/stale approvals idempotent | verified | test: idempotent approval application |
| R-088.3 | Prove integration can establish actor and revision, else report gap | unverified | why: actor/revision proven for app writes and owner UI comments; connector (MCP) attribution not demonstrated |
| R-089.1 | Acceptance: approve once in Linear | verified | run: PRE-5 approved in Linear; caveat: a second approval was requested because the pilot history contained a probe written with an owner write key |
| R-089.2 | Acceptance: both harnesses honor same grant | verified | run: VR#11 |
| R-089.3 | Acceptance: agent-authored approval cannot self-authorize | verified | run: VR#9 Stroppers app approval rejected. Limitation: approvals written through a harness Linear connector signed in as an owner were not tested; README tells operators to keep such connectors out of delivery sessions |
| R-089.4 | Acceptance: changed scope requires extension | verified | test: stale revision; extension |
| R-089.5 | Acceptance: revoked/stale approvals cannot start delivery | verified | test: revoked/stale cannot authorize |
| R-090.1 | Operator-run branches trusted; no extra branch/fork gate | verified | file: no branch trust gate |
| R-090.2 | Configured dispatch selects branches; no auto-enrollment from PR text/comments | verified | file: no PR-text enrollment; routines/sessions start explicitly |
| R-091.1 | Branch trust does not change grant/protections/environments/credentials | verified | file: authorization independent of branch |
| R-091.2 | Comments/fetched content are evidence, not authority | verified | file: review prompt + approval.md treat comments as evidence |
| R-091.3 | Scoped credentials and per-run isolation local and cloud | verified | file: reviewer env allowlist, per-run dirs/ports |

## spec/06-verification-and-browser.md

| ID | Obligation | Status | Implementation / evidence / reason |
| --- | --- | --- | --- |
| R-092.1 | Plan maps each criterion to method, environment/stage, evidence | verified | file: verification.md; test: unplanned criteria block completion |
| R-092.2 | Browser applicability recorded with reason | verified | file: plan browser applicability with reason |
| R-092.3 | Review judges coverage; Playwright not required for every PR | verified | file: verification.md |
| R-093.1 | passed/failed/not-applicable/blocked-unverified distinguished everywhere | verified | file: OUTCOMES everywhere |
| R-093.2 | Method changes allowed with reason when coverage sufficient | verified | file: verification.md |
| R-093.3 | Weakening criteria or accepting failure needs owner-approved exception | verified | test: not-applicable without owner exception blocks completion |
| R-093.4 | Only an owner can weaken a criterion or accept a failure | verified | test: completion requires owner exception for not-applicable; contract changes need a new approved revision |
| R-094.1 | Post-deploy-only criteria and recovery responses defined | verified | file: plan stage post-deploy; release-readiness.md |
| R-094.2 | Expected post-deploy checks not failures pre-deploy | verified | file: acceptanceSummary pre-merge phase excludes post-deploy |
| R-094.3 | Failed pre-delivery blocks readiness; failed live blocks completion and triggers recovery | verified | file: acceptanceSummary; SKILL.md step 9 |
| R-094.4 | Playwright never an unconditional GitHub gate; mandatory checks still bind | verified | file: no required check added |
| R-095.1 | Installation vs delivery vs observation acceptance distinguished | verified | file: verification.md, validation-report sections |
| R-095.2 | Non-deployables get artifact acceptance | verified | test: docs-only artifact acceptance routing |
| R-095.3 | Comments/merges/active session not acceptance substitutes | verified | run: PRE-5 not completed at merge alone |
| R-096.1 | Local workflow runs Playwright locally; cloud in its harness session | verified | run: local runs local; cloud attempt in cloud session (blocked by allowlist, reported) |
| R-096.2 | No remote machine/hosted browser/VM/Actions browser runner; not a required check | verified | file: no runner services |
| R-097.1 | Run actual change, video relevant journeys, publish via PR description/comments | verified | run: VR#7 video on PR |
| R-097.2 | Alex Urbano practice treated as operator-provided, not transcript-verified | reference | why: provenance note |
| R-098.1 | Verify toolchain/browser, committed revision, config in current session | verified | test: runStatus dirty tree -> unverified; record binds revision |
| R-098.2 | Same repo commands/fixtures; record OS/browser differences | verified | file: record executor OS/browser versions |
| R-098.3 | Failing assertion investigated, not rerouted | verified | file: verification.md |
| R-099.1 | Cloud reaches authorized env or starts isolated app in-session; no laptop dependency | verified | file: isolated webServer in session; run: PRE-5 isolated server |
| R-099.2 | Pilot discovers network/env needs; unsupported reported | verified | run: cloud allowlist limitation found and reported |
| R-100.1 | Distinct workspace/ports/state per run | verified | file: free port, per-run dir |
| R-100.2 | Record run ID, harness/mode, revision, env, criteria, commands, evidence | verified | file: record.json fields |
| R-100.3 | Clean up owned resources only; publish before teardown | verified | file: process group cleanup; evidence publish |
| R-100.4 | Entitlements per harness verified; bounded duration/concurrency | unverified | why: entitlements documented; cloud concurrency/duration not exercised |
| R-101.1 | Verify Playwright version, browsers, system libraries before run | verified | run: doctor detected missing browsers |
| R-101.2 | Install missing deps without asking, via supported mechanism; no unrelated changes | verified | run: prepare installed without prompts |
| R-101.3 | Capture commands/versions; repeatable for fresh cloud sessions | verified | file: prepare records commands; README |
| R-102.1 | Lacking privileges: report limitation, use supported preconfigured image | verified | file: prepare classifies privilege failures; run: cloud 403 classified environment |
| R-102.2 | Setup failures classified separately from assertion failures | verified | run: cloud reported unverified (environment), not failed |
| R-103.1 | Acceptance: fresh env with missing libs prepared automatically and runs | unverified | run: local fresh state prepared automatically (VR#5); not repeated on a fresh cloud VM with system libraries missing |
| R-103.2 | Acceptance: restricted env yields actionable report, no false pass | verified | run: cloud restricted network -> actionable report |
| R-104.1 | Claude cloud: run Playwright, deps, reach env, scoped creds, export evidence | blocked | why: Claude cloud Playwright blocked by Default environment allowlist (cdn.playwright.dev); needs Custom network domains |
| R-104.2 | Codex cloud: same | blocked | why: no Codex cloud environment in the workspace (provider UI step) |
| R-104.3 | Native invocation and checkpoint continuation without laptop | verified | run: routine invocation and checkpoint continuation from Linear in fresh sessions |
| R-105.1 | Unsupported cloud: report, checkpoint; no substitute runner/API/harness | verified | run: reported unsupported, no substitutes |
| R-105.2 | Environment limitation distinguished from failing assertion | verified | run: environment limitation distinct |
| R-106.1 | Dedicated automation browser/profile; Playwright Chromium default; configurable | verified | file: wrapper forces Playwright-managed browser (channel unset) |
| R-106.2 | Headless default with video; headed uses dedicated browser | verified | file: headless default, video on |
| R-107.1 | Never attach to or reuse operator Chrome profile/tabs/auth | verified | run: VR#6 |
| R-107.2 | Isolated credentials/state per run | verified | file: per-run state; synthetic data |
| R-108.1 | Acceptance: everyday Chrome unchanged during local run; cleanup kills only owned browser | verified | run: VR#6 |
| R-108.2 | Acceptance: cloud run proven without that profile | unverified | why: cloud browser run blocked by allowlist |
| R-109.1 | Unrunnable check: blocked/unverified or alternative; no auto machine/harness switch | verified | run: cloud blocked reported, no machine switch |
| R-110.1 | Interruption: preserve checkpoints, classify honestly | verified | run: PRE-5 sessions stopped and resumed from checkpoints |
| R-110.2 | Continue via native mechanism or explicit handoff; reconcile unknown actions first | verified | file: pending action reconciliation; run: PRE-5 run 6 checked PR head before merge |
| R-110.3 | Replacement runs reproduce revision; no inherited pass; clean abandoned local resources | verified | file: playwright.mjs cleanupAbandoned (stroppers browser cleanup); stale outcomes; run: re-verified at merge commit |
| R-111.1 | Videos linked in PR with revision, results, executor, skipped criteria | verified | run: PR evidence index with revision, executor, results |
| R-111.2 | Video is not a verdict; API/data/job checks still required | verified | file: index text; API checks in plan |
| R-112.1 | Supported publication mechanism chosen and demonstrated | verified | run: release assets + PR comment via REST |
| R-112.2 | Document access, rendering, retention, credentials, ownership | verified | file: README Browser verification (access, retention) |
| R-112.3 | No tokens in URLs, local paths or expiring links; redaction; synthetic accounts | verified | test: evidence.test checkPublishable, checkArtifact, publishableSummary |
| R-113.1 | Result index; failure diagnostics and focused success evidence | verified | file: renderIndex; traces for failures |
| R-113.2 | Bound to revision/env; invalidated after fixes | verified | file: setHead invalidation |
| R-113.3 | Independent reviewer context kept on shared host | verified | file: reviewer separate session |
| R-114.1 | Pre-merge vs post-deploy outcomes distinct; live acceptance determines Linear completion | verified | file: pre-merge vs post-deploy phases |
| R-115.1 | Playwright conditional; never a required GitHub check | verified | file: no required check |
| R-116.1 | Verification chosen per change surface; reuse existing tests | verified | file: verification.md |
| R-117.1 | Playwright outcomes reported with four states in PR and Linear | verified | test: renderIndex marks unverified; run: PR index |
| R-117.2 | Failures diagnosed against criteria; env unavailability is infra limitation | verified | file: verification.md |
| R-118.1 | Readiness from review, contract and acceptance results; browser evidence an input | verified | file: SKILL.md |
| R-118.2 | Unverifiable required criterion recorded and escalated, not marked verified | verified | test: acceptanceSummary (unverified, unplanned, stale, unexcused n/a never ok) |
| R-119.1 | Videos only for applicable runs; non-deployables define own completion | verified | file: videos only for browser runs |
| R-120.1 | Acceptance: backend/docs PR completes with non-browser verification | unverified | test: docs-only routing; run: PRE-6 n/a; full docs-only delivery not run |
| R-120.2 | Acceptance: browser PR publishes evidence | verified | run: PRE-5 PR evidence |
| R-120.3 | Acceptance: failed/unavailable browser visible without required check | verified | run: cloud unavailable visible on PR comment |
| R-120.4 | Acceptance: no unverified criterion relabeled passed | verified | test: approval.test completion requires every approved criterion; evidence.test runStatus; fixed after audit F1/F8 |

## spec/07-checkpoints-and-recovery.md

| ID | Obligation | Status | Implementation / evidence / reason |
| --- | --- | --- | --- |
| R-121.1 | Portable checkpoints in private repo/Linear/PR/native state; one authoritative record per task | verified | file: Linear checkpoint comment authoritative |
| R-121.2 | No database/controller; transcripts and ephemeral files insufficient | verified | file: no database |
| R-121.3 | Approvals/credentials/findings/evidence out of public plugin repo | verified | file: checkpoint in private Linear; public tree has none |
| R-122.1 | Persist identity, binding, contract revision + snapshot, approver/scope/revocation | verified | file: checkpoint task/contract/approval |
| R-122.2 | Persist stage/blocker, repo/base/head, deployed artifact, harness/mode | verified | file: checkpoint stage/revision/execution |
| R-122.3 | Persist verification plan and per-criterion outcomes, findings, retry counters, evidence refs, external actions | verified | file: checkpoint plan/outcomes/findings/counters/evidence/actions |
| R-122.4 | Versioned checkpoint schema | verified | file: schema stroppers.checkpoint/v1 |
| R-123.1 | Record intended external action before, identifier after | verified | test: action journal; run: PRE-5 merge journaled |
| R-123.2 | Reconcile remote before retrying unknown outcomes; idempotency keys/stable identities | verified | test: reconcile; run: merge pinned with --match-head-commit |
| R-123.3 | No exactly-once claims | verified | file: checkpoint-contract.md |
| R-123.4 | Competing sessions prevented with proven controls or enforced single-active-session mode | verified | test: lease; file: checkpoint-contract.md single-active-session |
| R-123.5 | Serialize conflicting writes or isolated worktrees | verified | file: shared clones for review; one checkout per active checkpoint (init refuses another issue) |
| R-124.1 | Approval/review/evidence bound to contract/revision; changed head re-evaluated | verified | test: changed head |
| R-124.2 | Pre-merge/deploy recheck of head protections, grant/revocation, artifact | verified | run: PRE-5 authorize before merge; test: default-deny |
| R-124.3 | Post-revocation completion reconciled/reported; subsequent actions stopped | verified | file: SKILL.md revoke handling |
| R-125.1 | Test repeated triggers and duplicate invocation | unverified | why: duplicate actions unit-tested; repeated native triggers not exercised |
| R-125.2 | Test competing sessions and concurrent issues | verified | test: lease conflict; checkpoint init refuses concurrent issue in one checkout |
| R-125.3 | Test changed heads and revocation | verified | test: changed head, revocation |
| R-125.4 | Test resume after unrecorded successful merge/deploy | verified | test: reconcile intended action; run: PRE-5 merge verified via PR state |
| R-125.5 | Resume in fresh session or other harness without losing counters or inventing steps | verified | test: counters across harness; run: fresh sessions resumed |
| R-125.6 | User-initiated continuation not claimed as unattended | verified | file: README states manual continuation |
| R-126.1 | Three unsuccessful fix-and-verify cycles per blocker then checkpoint/escalate with recommendation | verified | test: three cycles escalate |
| R-126.2 | Independent work continues | verified | file: recovery.md |
| R-126.3 | Limit globally configurable; counter persists across restarts/harness switches | verified | test: counter survives |
| R-127.1 | Cycle = fix + relevant verification | verified | file: recovery.md |
| R-127.2 | Separate bounded infra retry budget with backoff, documented | verified | test: infra budget with backoff |
| R-127.3 | Never relax criteria/disable checks | verified | file: recovery.md, floor guard |
| R-128.1 | Post-release failure: verified recovery within authorization else halt/escalate | verified | file: release-readiness.md |
| R-128.2 | Escalation includes revision, evidence, attempts, checkpoint, recommendation | verified | file: recovery.md escalation message |

## spec/08-delivery-and-validation.md

| ID | Obligation | Status | Implementation / evidence / reason |
| --- | --- | --- | --- |
| R-129.1 | Production rollout in scope after pilot; pilot not an approval gate | in-progress | why: pilot complete; production rollout target pending operator choice |
| R-129.2 | Pause only for concrete capability/scope/missing authorization | verified | why: pauses limited to concrete capability/authority gaps (questions asked one at a time) |
| R-129.3 | Workflow rollout distinguished from application deploys under issue grants | verified | file: validation report distinguishes workflow rollout from PRE-5 delivery |
| R-130.1 | Stage 1 inspection report incl. overlaps and baseline failures | verified | file: decisions D-001..; capability matrix; baseline (pilot tests green) |
| R-130.2 | Stage 2 capability matrix with demonstrated paths and blockers | verified | file: docs/capability-matrix.md |
| R-130.3 | Stage 3 pinned revisions, adaptations, manifest | verified | file: dependencies.json, THIRD_PARTY_NOTICES.md |
| R-130.4 | Stage 4 plugin, layers, install/update/remove; fresh local and cloud loading | unverified | why: Claude cloud loads via thin entry, not the plugin; Codex cloud blocked |
| R-130.5 | Stage 5 constraints, checks, specialist routing | verified | file: floor, triggers, specialists references; tests |
| R-130.6 | Stage 6 grilling and glossary/ADR | verified | file: grill wrappers; glossary/adr config (interactive run not exercised, see R-036) |
| R-130.7 | Stage 7 repo-specific verification generated and proven | verified | run: pilot PR #4 |
| R-130.8 | Stage 8 pilot, docs, change set, rollout, README validated on real paths | in-progress | why: pilot done; release rollout pending |
| R-131.1 | Each stage ends with inspectable files and evidence | verified | file: commits per stage with evidence in this ledger |
| R-132.1 | Fresh checkout reproduces setup from pinned sources | in-progress | why: pinned-tag install pending release tag |
| R-132.2 | Second install idempotent and preserving | verified | test: install idempotent |
| R-132.3 | All skills/refs resolve in both harnesses; capabilities exercised | verified | test: links resolve except listed upstream pstack ones; run: both harness loads |
| R-132.4 | Simple task: Pstack without interview or all specialists | verified | run: PRE-5 no interview, no extra specialists |
| R-132.5 | Security-sensitive example invokes security | verified | test: security routing (live skill application not exercised) |
| R-132.6 | Service/job example invokes observability; release example yields readiness/recovery | unverified | why: routing tested; no service/job delivery or release with readiness/recovery evidence exercised |
| R-132.7 | Failing required check blocks; weakening detected | verified | test: floor violations fail; weakening detected |
| R-132.8 | Explicit grill-with-docs records decisions into same plan | unverified | why: interactive grill-with-docs session not exercised |
| R-132.9 | Unattended missing intent reports blocker without grilling | verified | run: PRE-6 unattended blocker without grilling |
| R-132.10 | Verification bound to revision and rerun when invalidated | verified | run: PRE-5 re-verified at merge commit; test: changed head |
| R-132.11 | Existing CI requirements remain; aggregator tested if introduced | not-applicable | why: no aggregator introduced; existing CI unchanged |
| R-132.12 | Local/disposable demo; remote actions only with authorization | verified | run: disposable pilot; remote actions limited to authorized pilot |
| R-132.13 | Install/update/removal/limits/unverified capabilities documented | verified | file: README update/removal/limits; capability matrix |
| R-132.14 | Step overrides honored; checkpoint transfers between harnesses intact | verified | test: step overrides; checkpoint transfer across harnesses; run: VR#11 |
| R-132.15 | Exhaustion checkpoints; fallback opt-in only | verified | test: exhaustion blocks; fallback opt-in |
| R-132.16 | Defaults inherited without per-issue questions | verified | run: PRE-5 no policy questions |
| R-132.17 | Playwright pilot bound to live version; API/data checks supplement | verified | run: PRE-5 Playwright on isolated live server at merge commit, plus unit checks |
| R-132.18 | Linear reflects verified delivery; merge-only cannot complete | verified | run: PRE-5; test: completion gate reconciles contract criteria |
| R-132.19 | Native capability matrix complete; no hosted service | verified | file: capability matrix |
| R-133.1 | Tests cover integration behavior/enforcement, not prompt text | verified | test: 81 behavior tests |
| R-133.2 | Smoke scenarios in disposable fixture/worktree | verified | test: temp repos; run: disposable pilot |
| R-134.1 | Deliver plugin, both layers, config + checkpoint contract, manifest, capability matrix | verified | file: plugin, manifests, docs/checkpoint-contract.md, dependencies.json, capability matrix |
| R-134.2 | Deliver README, operator guide, update/removal instructions | verified | file: README, docs/configuration.md, operator usage in README |
| R-134.3 | Deliver pilot change set and validation report with remaining limitations | in-progress | why: pilot PRs #3 and #4; validation report final after re-review |
| R-135.1 | Native validation and portable checkpoints in scope; no hosting; no runtime/recovery overclaims | verified | file: README unattended expectations; no overclaims in matrix |
| R-136.1 | Root README with exact tested instructions, aligned to implementation | in-progress | why: README aligned to 0.1.7; clean-machine replay pending |
| R-137.1 | README: purpose, Pstack role, specialists, harnesses, plugin vs runtime vs Playwright | verified | file: README What does what |
| R-137.2 | README: prerequisites, environments, subscriptions, cloud limits, unsupported paths | verified | file: README Requirements |
| R-137.3 | README: install/config commands, pinned deps, credential setup, auth | verified | file: README Set up |
| R-137.4 | README: global/repo config, Linear binding, project, team, owners, GitHub, environments, recovery | verified | file: README Set up 2-3, configuration.md |
| R-137.5 | README: harness default/overrides/fallback/execution modes | verified | file: README Harnesses and routing |
| R-137.6 | README: first-task walkthrough incl. actual approval interaction | verified | file: README Your first delivery (actual approval comment) |
| R-137.7 | README: Playwright applicability/location/deps/isolation/publication/recovery; not a required check | verified | file: README Browser verification |
| R-137.8 | README: grilling, status, pause/cancel/revoke, resume/escalate, diagnose, logs | verified | file: README Everyday operation |
| R-137.9 | README: no hosting, limits, native automation, unattended expectations, update/rollback/uninstall, troubleshooting | verified | file: README Unattended, Update, Troubleshooting |
| R-137.10 | README: attribution and reference links | verified | file: README License and attribution |
| R-138.1 | README validated on fresh setup/fixture; record exercised paths | unverified | why: README steps exercised piecewise in the pilot (marketplace add/install, helper install, credentials, doctor, first delivery); not replayed top to bottom on a clean machine |
| R-138.2 | Samples/commands match schema and entry point | verified | file: README commands checked against bin/stroppers usage (install, update, uninstall, doctor, config); tag reference matches the release tag |
| R-138.3 | Second operator can set up without this conversation; provider UI steps explicit | unverified | why: requires an independent operator dry run |
| R-139.1 | Public-release-ready repo; upstream licenses/attribution preserved; pins/patches recorded | verified | file: LICENSE (MIT), THIRD_PARTY_NOTICES.md, dependencies.json |
| R-139.2 | Compatible project license selected; no relicensing | verified | file: MIT compatible with MIT/Apache-2.0 components; no relicensing |
| R-140.1 | Generic assets separated from private settings; sanitized examples; env placeholders | verified | file: templates with placeholders; private config outside repo |
| R-140.2 | Local-only path without private infrastructure or operator-specific access | verified | file: README local-only path (no private infra) |
| R-140.3 | No private hosts/credentials/team data/Linear identities/grants in public tree | verified | run: git grep for tokens, Linear ids, workspace names, emails, local paths: tree clean (vendor excluded; only fake test token) |
| R-140.4 | Tracker/PR publication integration configurable (Linear + GitHub current) | verified | file: Linear and GitHub integration via config; adapters |
| R-141.1 | No evidence/transcripts in public repo | verified | file: .stroppers/state and artifacts ignored; evidence lives in pilot repo |
| R-141.2 | Scan tree and history for secrets/private data before release | in-progress | why: tree clean; release PR must be squash-merged so workspace names in branch history stay out of main |
| R-141.3 | Making repo public is a separate authorized publishing action | verified | why: repository remains private; publishing is a separate action |
| R-142.1 | Fresh user installs/configures/uses without editing core or provisioning | unverified | why: fresh-user setup not replayed end to end on a clean machine |
| R-142.2 | Local and each cloud session test exact PR revision and export evidence | unverified | why: local verified; Claude cloud blocked by allowlist; Codex cloud blocked |
| R-142.3 | Local verifies locally; cloud verifies in cloud and continues laptop-asleep; no auto migration | verified | run: local verified locally; cloud browser attempt ran in the cloud session (blocked by allowlist); no migration code |
| R-142.4 | Interrupted runs: no silent duplication or stale pass | verified | test: action journal, stale outcomes |
| R-142.5 | Pilot PR gets durable accessible video evidence | verified | run: PR #1/#3 durable video links |
| R-142.6 | Public examples clean; upstream licenses/deps resolve | verified | run: tree scan clean; npm run vendor:check; licenses present |

## spec/09-context-appendix.md

| ID | Obligation | Status | Implementation / evidence / reason |
| --- | --- | --- | --- |
| APPX.1 | Record only visible/confirmed commitments; do not reconstruct unseen ones | reference | why: applied (decisions recorded only from visible commitments) |
| APPX.2 | Superseded proposals (hosted controller, single harness) not implemented | reference | why: superseded controller branch left untouched (D-001) |

