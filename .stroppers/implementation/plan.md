# Stroppers Implementation Plan

> **For agentic workers:** implement stage by stage; each stage ends with
> inspectable files and ledger evidence (R-131). The ledger is
> `.stroppers/implementation/requirements.md`; settled choices are in
> `decisions.md`.

**Goal:** A self-contained, open-source plugin that lets Claude Code or
Codex take a Linear-approved issue through Pstack, applicable specialist
checks, cross-harness review, PR, merge and live acceptance, with portable
checkpoints and no hosted infrastructure.

**Architecture:** One plugin directory with both harness manifests,
Stroppers-owned skills (public entry `deliver`, plus grilling wrappers) and
a zero-dependency Node helper CLI (`bin/stroppers`) for the deterministic
parts: config resolution, reviewer selection and invocation, checkpoint
and approval records, Playwright preparation and evidence indexing.
Upstream skills are vendored unmodified at pinned SHAs and read by path.

**Tech stack:** Node 20+ (built-ins only, ESM, `node --test`), `gh`,
Claude Code 2.1.287, Codex CLI 0.162.1, Linear GraphQL (read-only
verification), Playwright (target-repo dependency, conditional).

**Spec:** handoff package `spec/01..09` and `REQUIREMENTS.md` (outside this
repo).

## Global constraints

- No hosted controller, worker, database, daemon, GitHub Actions agent runner or browser service (R-003.8, R-069.1, R-096.2).
- Existing subscriptions only: never send `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` to child harnesses; no Grok (R-004.8, R-063.4).
- Upstream files unchanged; adaptations namespaced and recorded (R-004.13, R-015).
- Nothing private in the public tree: no Linear IDs, names, hosts, grants, evidence (R-140.3, R-141.1).
- Outcome vocabulary everywhere: `passed | failed | not-applicable | unverified` (+ reason) (R-040.4, R-093.1).
- Three fix-and-verify cycles per blocker, configurable; separate infra retry budget (R-126, R-127).
- Playwright is never a required GitHub check (R-115.1).

## Review focus

1. A reviewer that times out, is unauthenticated or out of quota must never be recorded as a clean review — test each classification in the adapter tests.
2. An agent-authored Linear write must never satisfy approval — verifier rejects any approval with `botActor` set, wrong actor ID, edited comment, or hash mismatch.
3. A config file with an unknown key or a repo file that widens owners/environments must be rejected, not ignored.
4. A changed PR head after review must invalidate review and evidence for that head.
5. Install over a repo with existing `.gitignore`, `AGENTS.md`, `CLAUDE.md` content must preserve it byte-for-byte outside managed blocks, and uninstall must not delete shared documents.

---

### Stage 1 — Inspection and capability matrix (R-130.1, R-130.2, R-072)

**Files:** `docs/capability-matrix.md`, ledger updates.
- [ ] Record harness versions, auth modes, plugin/marketplace paths, cloud loading rules, native triggers, network defaults from official docs and local `--help`.
- [ ] Mark each capability demonstrated / documented-only / blocked.

### Stage 2 — Sources and manifest (R-013..R-017, R-015, R-130.3)

**Files:** `dependencies.json`, `scripts/vendor.mjs`, `plugins/stroppers/vendor/**`, `docs/dependencies.md`.
**Interfaces:** `node scripts/vendor.mjs sync|check|update <name> <sha>` — sync materializes pinned files and verifies tree hashes; check exits 1 on drift; update shows `git diff --stat` and file-level diff before rewriting the pin.
- [ ] Test: `tests/vendor.test.mjs` — manifest entries have sha/license/destination/files; every relative link inside vendored files resolves or is listed as an accepted external.
- [ ] Vendor pstack (full `skills/` + `agents/` + LICENSE), Addy (4 skills + referenced `references/*.md` + LICENSE), Matt (4 skills + LICENSE), codex-plugin-cc (`schemas/review-output.schema.json`, LICENSE, NOTICE).

### Stage 3 — Configuration (R-042, R-043, R-046, R-081, R-082)

**Files:** `plugins/stroppers/lib/yaml.mjs`, `lib/config.mjs`, `schemas/config.schema.md`, `templates/config.example.yaml`, `docs/configuration.md`, tests.
**Interfaces:**
- `parseYaml(text) -> object` — strict subset (maps, lists, scalars, comments); throws `YamlError(line, msg)` on anything else.
- `resolveConfig({packageDefaults, operatorPath, repoPath, localPath, taskExceptions}) -> {effective, sources, errors}`; repo/local/task layers may not set `authority.*` keys except where the operator layer permits; unknown keys error.
- CLI: `stroppers config validate|explain [--json]` — explain prints effective config with credential refs as names only.
- [ ] Tests: precedence order; repo layer widening `authority.owners` rejected; unknown key rejected; missing Linear binding blocks only Stroppers ops (exit 3, message names the key).

### Stage 4 — Harness routing and review (R-059..R-068)

**Files:** `lib/harness.mjs`, `lib/adapters/{claude,codex,command}.mjs`, `lib/review.mjs`, `schemas/findings.schema.json`, tests with fake binaries.
**Interfaces:**
- `selectReviewer({config, implementer, step}) -> {harness, reason} | {blocked, reason}` — override wins; `different-harness` picks first enabled preference != implementer; `same-harness` explicit only.
- `runReview({adapter, worktree, base, head, contractPath, constraintsPath, timeoutMs}) -> {status: 'findings'|'clean'|'timeout'|'auth-failed'|'exhausted'|'error', findings[], raw, participant}`.
- CLI: `stroppers review select|run`; refuses when `STROPPERS_ROLE=reviewer`.
- [ ] Tests: both directions selected; override; step override; missing reviewer → blocked; fake third harness ordering; timeout/auth/exhausted classification; recursion guard; env scrubbing of API keys.
- [ ] Live proof: Claude→Codex and Codex→Claude review on a fixture diff with subscription auth.

### Stage 5 — Checkpoint, approval and recovery (R-077..R-089, R-121..R-128)

**Files:** `lib/checkpoint.mjs`, `lib/approval.mjs`, `lib/linear.mjs`, `schemas/checkpoint.schema.md`, `docs/checkpoint-contract.md`, tests.
**Interfaces:**
- Checkpoint v1 JSON; `render(cp) -> markdown comment with fenced json and marker`; `parse(comment) -> cp`.
- `contractHash(contract) -> 'sha256:...'` over canonical JSON.
- `verifyApproval({issue, comments, owners, contractHash}) -> {status:'approved'|'pending'|'stale'|'revoked'|'rejected', reason, eventId}`; approval = latest owner-authored, unedited, `botActor == null` comment `stroppers approve <hash>` after the contract comment.
- Action journal: `intend(cp, action) / complete(cp, id, result)`; continuation lists pending intents for reconciliation.
- Counters: `recordAttempt(cp, blockerId, kind: 'fix'|'infra')` → `escalate` at limit.
- [ ] Tests: forged (botActor) approval rejected; display-name match without ID rejected; stale hash; revoked; duplicate event idempotent; counter survives serialize → parse → other harness; pending intent reported on resume.

### Stage 6 — Entry point, specialists, grilling (R-005, R-006, R-018..R-041)

**Files:** `plugins/stroppers/skills/deliver/SKILL.md` + `references/*.md`, `skills/grill-with-docs/SKILL.md`, `skills/grill-me/SKILL.md`, `lib/triggers.mjs`, `lib/floor.mjs`.
**Interfaces:** `stroppers plan triggers --base <ref>` → which specialists apply with reasons (paths/patterns); `stroppers check floor --base <ref>` wraps Addy's floor-guard contract.
- [ ] Tests: auth/webhook/dependency diff → security; job/service diff → observability; docs-only → none; removed test/assertion/threshold → floor violation.

### Stage 7 — Install, update, uninstall (R-044, R-052, R-055..R-058)

**Files:** `lib/install.mjs`, `templates/**`.
**Interfaces:** `stroppers install|update|uninstall|status --repo <path> [--cloud-entry]` with managed-block markers and `.stroppers/managed.json` (owned files + hashes).
- [ ] Tests on temp git repos: idempotent second install; preserved user content; conflict reported on modified owned file; uninstall leaves shared docs and no broken links.

### Stage 8 — Verification and browser evidence (R-092..R-120)

**Files:** `lib/playwright.mjs`, `lib/evidence.mjs`.
**Interfaces:** `stroppers browser doctor|prepare|run`, `stroppers evidence index|publish`.
- [ ] Tests: unique ports/dirs per run; restricted environment classified `unverified: environment`; index binds revision; publish refuses tokens/local paths.
- [ ] Live: fixture app Playwright run with video, published to PR via release asset.

### Stage 9 — Pilot, docs, review, rollout (R-129..R-142)

- [ ] Disposable pilot repo with fixture app; run first-task walkthrough from README.
- [ ] Coexistence scenarios (R-057).
- [ ] Cloud proofs where available; matrix updated.
- [ ] Independent review of code and ledger; bounded repair.
- [ ] Push `main`, open PR, rollout per authorization.
