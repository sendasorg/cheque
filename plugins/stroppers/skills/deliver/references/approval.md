# Contract and approval in Linear

The repository is bound to one Linear workspace and team in
`.stroppers/config.yaml`. Never act on an issue outside that binding, never
search other workspaces, and never use whichever account happens to be signed in.

## Writes go through the connector; verification reads with the configured key

- Post the contract, checkpoint and evidence comments with the harness's Linear connector. Linear records those as integration writes.
- `stroppers approval verify` reads the issue with the read-only key named by `linear.credential_env` and checks, in order: the key authenticates to the bound workspace; the issue is in the bound team; the latest contract comment hashes to the checkpoint's contract revision; an owner comment `stroppers approve <revision>` exists after it, written directly by a configured owner (matched by Linear user id, never display name), not by an integration or on someone's behalf, and not edited.
- If the configured team uses an "approval needed" status (`linear.approval_state`), move the issue there after posting the contract. That status is a marker only.

## What the operator does

Read the contract comment and, if it is right, comment exactly the line it shows:

    stroppers approve sha256:<revision>

`stroppers revoke` withdraws it. `stroppers extend sha256:<revision>` approves a posted contract revision that widens scope.

## Rules

- A changed contract has a new revision; the old approval does not carry over. Routine clarifications that leave the contract unchanged need nothing.
- Recheck with `stroppers approval authorize <action>` immediately before each PR publication, merge and deploy. A revoked or stale approval stops new actions; report any action that had already completed.
- Approval grants autonomy inside the contract only. Repository protections, required checks and required human reviews still apply, and required reviewers are a separate role from the approval owner.
- Before changing an issue's status, list the team's statuses through the connector and use the real names.
