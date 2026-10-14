# Delivery contract and checkpoint (v1)

## Delivery contract

Posted on the issue as a comment that starts with `<!-- cheque:contract v1 -->`
and carries the contract as JSON. Its revision is the SHA-256 of the
canonical JSON (keys sorted), so any change produces a new revision.

| Field | Meaning |
| --- | --- |
| `issue` | Issue key |
| `outcome` | What will be true when delivered |
| `acceptance_criteria` | `[{id, criterion}]`; each gets a verification plan entry |
| `scope` | What may change |
| `repositories` | `owner/name` the delivery may change (must be within operator authority) |
| `environments` | Environments the delivery may deploy to |
| `deployment` | How it is released, or why there is no release |
| `recovery` | Rollback or forward-recovery procedure |
| `exceptions` | Owner-approved exceptions; an entry with a `config` object overrides non-authority settings for this task |

Unknown fields are rejected.

## Approval

An approval is an issue comment `cheque approve sha256:<revision>`:

- written after the contract comment;
- by a configured owner (Linear user id);
- directly by that person: not by an integration (`botActor`) and not on someone's behalf (`onBehalfOf`);
- never edited.

`cheque revoke` (by an owner, after the approval) or cancelling the issue
revokes it. `cheque extend sha256:<revision>` approves a widened revision.
The comment id is the approval event id, so repeated verification is
idempotent.

## Checkpoint

The authoritative copy is the issue comment that starts with
`<!-- cheque:checkpoint v1 -->`, updated in place by the agent app. The
copy in `.cheque/state/current.json` is a cache restored from it
(`cheque checkpoint restore`).

| Field | Content |
| --- | --- |
| `schema` | `cheque.checkpoint/v1`; other versions are refused until migrated |
| `task` | `workspace_id`, `team`, `issue_id`, `issue_key`, `repository` (task identity is workspace + issue + repository) |
| `run_id` | Run identity |
| `contract` | `revision` and the immutable `snapshot` |
| `approval` | `status` (pending, approved, stale, revoked), `actor_id`, `event_id`, `approved_at`, `contract_revision`, `scope` |
| `stage` / `blocked_reason` | contract, awaiting-approval, planning, implementing, reviewing, pull-request, merging, deploying, live-acceptance, delivered, blocked, revoked |
| `revision` | `base`, `head`, `pr`, `deployed_artifact` |
| `execution` | `harness`, `mode` (local or cloud), `implementer`, `lease` |
| `verification_plan` | `[{criterion_id, criterion, method, stage, environment, evidence, browser}]` |
| `outcomes` | per criterion: `status`, `reason`, `revision`, `evidence`, `stage`, `stale` |
| `reviews` / `findings` | reviewer identity and model, head, status; findings with dispositions |
| `counters` | per blocker: `fix`, `infra`, attempts with harness |
| `evidence` | published runs: revision, status, index URL, asset URLs |
| `actions` | journal of external actions: `intended` → `completed` with provider result |
| `history` | stage changes, head changes |

## Guarantees and limits

- A changed head marks earlier pre-merge outcomes stale; they no longer count.
- An action recorded as `intended` but not `completed` must be reconciled against the real system before it is retried. A `completed` action is not repeated. This is at-least-once bookkeeping with reconciliation, not exactly-once execution.
- The lease detects a second session working the same delivery and refuses it. Linear comments are not an atomic lock, so this is a single-active-session rule backed by detection, not mutual exclusion.
- Retry counters live in the checkpoint, so restarts and harness switches never reset them.
