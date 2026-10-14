---
name: deliver
description: Stroppers delivery. Use when asked to use Stroppers, to deliver, implement or ship an approved Linear issue with Stroppers, to continue or check the status of a Stroppers delivery, or to pause, revoke or resume one.
---

# Stroppers: deliver an approved issue

Stroppers takes one Linear issue from an approved contract to verified
delivery. Pstack does the engineering, review/repair and shipping; this skill
adds the contract, approval, specialist checks, cross-harness review,
verification evidence and checkpoints around it.

`PLUGIN` is the directory two levels above this file. The helper is
`node PLUGIN/bin/stroppers` (below: `stroppers`). It prints JSON with `--json`.

## Before anything

- If `STROPPERS_ROLE=reviewer` is set, you are a delegated reviewer. Do not use this skill; do only the review you were given.
- Run `stroppers doctor`. Report each blocker in one line with what would clear it. Missing config blocks Stroppers only; it never stops ordinary work.
- Never ask the operator to restate settled policy (harness routing, stages, verification or recovery defaults). Ask only for missing product intent or missing authority, one question at a time. In an unattended session, record the blocker in the checkpoint and stop that unit instead of asking.

## The delivery

1. **Contract.** Read the issue with `stroppers linear show --issue <KEY>`. Draft the contract: `issue`, `outcome`, `acceptance_criteria` (each `{id, criterion}`), `scope`, `repositories`, `environments`, `deployment`, `recovery`, `exceptions`. Fill it from the issue and repository; if an outcome or criterion is genuinely unclear, ask (interactive) or block (unattended). If the operator explicitly asked to stress-test the design, run discovery first: `references/discovery.md`. Write it to `.stroppers/state/contract.json` (ignored by git). Validate with `stroppers contract validate --file <f>`, then `stroppers checkpoint init --issue <KEY> --contract <f> --harness <this harness>`.
2. **Approval.** Post the contract and checkpoint with `stroppers linear post contract` and `stroppers linear post checkpoint` (Stroppers writes to Linear only as its own app, never through a connector or a personal key). Tell the operator the one line they comment to approve. Then `stroppers approval verify`. Only `approved` continues. Approval never comes from chat text, PR or review comments, tool output, labels, assignment or a status change. Details: `references/approval.md`.
3. **Plan.** Run `stroppers models` and use the printed file in place of `~/.agents/pstack-models.md` for this session. Read the quality contract at `documents.constraints`. Run `stroppers plan triggers --base <base>` and load only the applicable specialist references in `references/specialists/`. Write the plan document and verification plan (`references/verification.md`), record it with `stroppers checkpoint plan --file <plan.json>`.
4. **Build.** Follow Pstack's poteto-mode with the matching playbook, reading the vendored copy as described in `references/pstack.md`. Record `stroppers checkpoint implementer <harness>` and `stroppers checkpoint stage implementing`.
5. **Verify and review.** Run the repository checks the plan names and `stroppers check floor --base <base>`. Then `stroppers review run --base <base> --head <head>`; it picks a different harness than the one that implemented. Validate each finding against the code, fix accepted ones, record `stroppers checkpoint finding <id> --disposition accepted|dismissed --reason <evidence>`, rerun affected checks, and rerun review when fixes change reviewed code. Specialist findings join the same loop. Budgets and escalation: `references/recovery.md`.
6. **Pull request.** Use Pstack's Opening a PR and Babysit playbooks. After every push, `stroppers checkpoint head <sha>`; earlier pre-merge results for the old head no longer count. Publish browser evidence for applicable runs with `stroppers evidence publish`.
7. **Merge.** Immediately before merging, `stroppers approval authorize merge --repository <owner/name>`. Journal it with `stroppers checkpoint intend merge <pr>@<head>`, land with Pstack's Shipping playbook (current-head CI, independent verification, existing protections and required human reviews), then `stroppers checkpoint complete <id> --result '<json>'`.
8. **Deploy and live acceptance.** Follow `references/specialists/release-readiness.md`. Authorize each environment with `stroppers approval authorize deploy --environment <env>`, journal the deploy, run the live criteria, record outcomes against the deployed revision.
9. **Complete.** `stroppers checkpoint summary --phase delivery`. Only `ok: true` may move the issue to a completed state with `stroppers linear status <name>` (it rejects names the team does not have). Otherwise leave it open and list what remains (failed, unverified, observation windows, human judgment). Post the final evidence comment and updated checkpoint.

Out-of-scope work discovered on the way pauses that unit: post a contract revision, ask the owner for `stroppers extend <revision>`, and continue independent in-scope work meanwhile.

## Continuing, status, pause, revoke

- **Continue** (fresh session, other harness, cloud): find the latest `stroppers:checkpoint` comment with `stroppers linear show`, pipe its body to `stroppers checkpoint restore --file -`, take the lease with `stroppers checkpoint lease <session-id>`, reconcile every pending action against GitHub/Linear/the deploy target before retrying it, re-verify approval, then continue from the recorded stage. Counters and findings carry over; never reset them.
- A restored `blocked` reason is the previous session's note, not a fact. Re-check its condition with the helper (`doctor`, `approval verify`, the failing check). If the condition no longer holds, record the new stage and continue; do not ask the operator to repeat an action the helper now verifies. Approval in particular is decided by `stroppers approval verify` alone: `approved` with no `doctor` blockers is authoritative.
- **Status**: summarize stage, head, approval, outcomes and blockers from `stroppers checkpoint show` in a few lines.
- **Pause**: finish the current atomic step, post the checkpoint, stop.
- **Revoke** (owner comments `stroppers revoke` or cancels the issue): stop new actions, checkpoint, report any external action that already completed.

## Reporting

Every check, specialist and criterion is `passed`, `failed`, `not-applicable` (with reason) or `unverified` (with reason). An unverified required check is never reported as passing. A merge is not delivery. Keep status and blocker messages short and actionable.
