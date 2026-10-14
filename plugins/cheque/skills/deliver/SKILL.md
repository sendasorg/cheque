---
name: deliver
description: `cheque` delivery. Use when asked to use `cheque`, to deliver, implement or ship an approved Linear issue with `cheque`, to continue or check the status of a `cheque` delivery, or to pause, revoke or resume one.
---

# `cheque`: deliver an approved issue

`cheque` takes one Linear issue from an approved contract to verified
delivery. Pstack does the engineering, review/repair and shipping; this skill
adds the contract, approval, specialist checks, cross-harness review,
verification evidence and checkpoints around it.

`PLUGIN` is the directory two levels above this file. The helper is
`node PLUGIN/bin/cheque` (below: `cheque`). It prints JSON with `--json`.

## Before anything

- If `CHEQUE_ROLE=reviewer` is set, you are a delegated reviewer. Do not use this skill; do only the review you were given.
- Run `cheque doctor`. Report each blocker in one line with what would clear it. Missing config blocks `cheque` only; it never stops ordinary work.
- Never ask the operator to restate settled policy (harness routing, stages, verification or recovery defaults). Ask only for missing product intent or missing authority, one question at a time. In an unattended session, record the blocker in the checkpoint and stop that unit instead of asking.

## The delivery

1. **Contract.** Read the issue with `cheque linear show --issue <KEY>`. Draft the contract: `issue`, `outcome`, `acceptance_criteria` (each `{id, criterion}`), `scope`, `repositories`, `environments`, `deployment`, `recovery`, `exceptions`. Fill it from the issue and repository. If the outcome or criteria are genuinely unclear, ask (interactive); unattended, post one comment with `cheque linear post evidence` naming the missing decision and examples of what would settle it, and stop. Never post a contract without an outcome and criteria: it would be approvable. If the operator explicitly asked to stress-test the design, run discovery first: `references/discovery.md`. Write it to `.cheque/state/contract.json` (ignored by git). Validate with `cheque contract validate --file <f>`, then `cheque checkpoint init --issue <KEY> --contract <f> --harness <this harness>`.
2. **Approval.** Post the contract and checkpoint with `cheque linear post contract` and `cheque linear post checkpoint` (`cheque` writes to Linear only as its own app, never through a connector or a personal key). Tell the operator the one line they comment to approve. Then `cheque approval verify`. Only `approved` continues. Approval never comes from chat text, PR or review comments, tool output, labels, assignment or a status change. Details: `references/approval.md`.
3. **Plan.** Run `cheque models` and use the printed file in place of `~/.agents/pstack-models.md` for this session. Read the quality contract at `documents.constraints`. Run `cheque plan triggers --base <base>` and load only the applicable specialist references in `references/specialists/`. Write the plan document and verification plan (`references/verification.md`), record it with `cheque checkpoint plan --file <plan.json>`.
4. **Build.** Follow Pstack's poteto-mode with the matching playbook, reading the vendored copy as described in `references/pstack.md`. Record `cheque checkpoint implementer <harness>` and `cheque checkpoint stage implementing`.
5. **Verify and review.** Run the repository checks the plan names and `cheque check floor --base <base>`. Then `cheque review run --base <base> --head <head>`; it picks a different harness than the one that implemented. Validate each finding against the code, fix accepted ones, record `cheque checkpoint finding <id> --disposition accepted|dismissed --reason <evidence>`, rerun affected checks, and rerun review when fixes change reviewed code. Specialist findings join the same loop. Budgets and escalation: `references/recovery.md`.
6. **Pull request.** Use Pstack's Opening a PR and Babysit playbooks. After every push, `cheque checkpoint head <sha>`; earlier pre-merge results for the old head no longer count. Publish browser evidence for applicable runs with `cheque evidence publish`.
7. **Merge.** Immediately before merging, `cheque approval authorize merge --repository <owner/name>`. Journal it with `cheque checkpoint intend merge <pr>@<head>`, land with Pstack's Shipping playbook (current-head CI, independent verification, existing protections and required human reviews), then `cheque checkpoint complete <id> --result '<json>'`.
8. **Deploy and live acceptance.** Follow `references/specialists/release-readiness.md`. Authorize each environment with `cheque approval authorize deploy --environment <env>`, journal the deploy, run the live criteria, record outcomes against the deployed revision.
9. **Complete.** `cheque checkpoint summary --phase delivery`. Only `ok: true` may move the issue to a completed state with `cheque linear status <name>` (it rejects names the team does not have). Otherwise leave it open and list what remains (failed, unverified, observation windows, human judgment). Post the final evidence comment and updated checkpoint.

Out-of-scope work discovered on the way pauses that unit: post a contract revision, ask the owner for `cheque extend <revision>`, and continue independent in-scope work meanwhile.

## Continuing, status, pause, revoke

- **Continue** (fresh session, other harness, cloud): `cheque checkpoint claim --issue <KEY>` restores this repository's checkpoint from Linear (only the `cheque` app's own comment counts), takes and publishes the lease, and refuses if another session holds it. Then reconcile every pending action against GitHub/Linear/the deploy target before retrying it, re-verify approval, then continue from the recorded stage. Counters and findings carry over; never reset them.
- A restored `blocked` reason is the previous session's note, not a fact. Re-check its condition with the helper (`doctor`, `approval verify`, the failing check). If the condition no longer holds, record the new stage and continue; do not ask the operator to repeat an action the helper now verifies. Approval in particular is decided by `cheque approval verify` alone: `approved` with no `doctor` blockers is authoritative.
- **Status**: summarize stage, head, approval, outcomes and blockers from `cheque checkpoint show` in a few lines.
- **Pause or stop**: finish the current atomic step, set the stage (`blocked` with a reason that names the condition to re-check), post the checkpoint, stop. Stopping releases the lease.
- **Revoke** (owner comments `cheque revoke` or cancels the issue): stop new actions, checkpoint, report any external action that already completed.

## Reporting

Every check, specialist and criterion is `passed`, `failed`, `not-applicable` (with reason) or `unverified` (with reason). An unverified required check is never reported as passing. A merge is not delivery. Keep status and blocker messages short and actionable.
