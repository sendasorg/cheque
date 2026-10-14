# Contract and approval in Linear

The repository is bound to one Linear workspace and team in
`.cheque/config.yaml`. Never act on an issue outside that binding, never
search other workspaces, and never use whichever account happens to be signed in.

## Two credentials, never a personal write key

- Agent writes (contract, checkpoint, evidence comments, status changes) go through `cheque linear post|status`, which authenticates as the Cheque OAuth app (`client_credentials`, `actor=app`). Linear attributes those writes to the app, so none of them can pass as an owner's approval. Do not write to Linear through a connector or a personal API key: a write made as the owner is indistinguishable from the owner's own approval.
- `cheque approval verify` reads the issue with the read-only key named by `linear.credential_env` and checks, in order: the key authenticates to the bound workspace; the issue is in the bound team; the latest contract comment hashes to the checkpoint's contract revision; an owner comment `cheque approve <revision>` exists after it, written directly by a configured owner (matched by Linear user id, never display name), not by an integration or on someone's behalf, and not edited.
- If the configured team uses an "approval needed" status (`linear.approval_state`), move the issue there after posting the contract. That status is a marker only.

## Trusting the result

When `cheque doctor` reports no Linear blockers, the verification key is
read-only (or not an owner's), so `approved` from `cheque approval verify`
is authoritative. Do not second-guess it from comment history: older comments
that predate this setup cannot satisfy the verifier unless they name the
current contract revision after it was posted. The approved contract, not the
issue description, defines the work.

## What the operator does

Read the contract comment and, if it is right, comment exactly the line it shows:

    cheque approve sha256:<revision>

`cheque revoke` withdraws it. `cheque extend sha256:<revision>` approves a posted contract revision that widens scope.

## Rules

- A changed contract has a new revision; the old approval does not carry over. Routine clarifications that leave the contract unchanged need nothing.
- Recheck with `cheque approval authorize <action>` immediately before each PR publication, merge and deploy. A revoked or stale approval stops new actions; report any action that had already completed.
- Approval grants autonomy inside the contract only. Repository protections, required checks and required human reviews still apply, and required reviewers are a separate role from the approval owner.
- `cheque linear status <name>` only accepts statuses the bound team actually has.
