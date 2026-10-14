# Recovery and escalation

- A cycle is one proposed fix plus its relevant verification. Record each unsuccessful one with `stroppers checkpoint attempt <blocker-id> fix`. At the limit (default 3) the helper marks the delivery blocked: escalate.
- Transient infrastructure failures (network, registry, rate limits) are recorded with `attempt <blocker-id> infra` and retried after the backoff the helper prints, within their own budget.
- Use a stable blocker id (for example `test:checkout-total` or `ci:typecheck`) so counters survive restarts and harness switches.
- Never relax a criterion, skip or delete a test, or disable a check to get past a blocker.
- Subscription exhaustion: checkpoint and wait. Use another subscription only if `harness.fallback` enables it for that step. Never switch to API billing.
- Keep independent units moving while one is blocked.

## Escalation message

Revision, failing evidence (commands and output excerpts), the attempts made, the checkpoint comment link, and one recommended next action.

## After a failed release

Run the contract's recovery procedure only if it is verified and inside the approval. Otherwise halt further rollout and escalate.

## Interrupted runs

A resumed run reconciles every journaled action still marked `intended` against the real system before retrying it, and reruns any verification whose result was incomplete at the exact recorded revision. It never inherits a pass from an incomplete run. Local continuation cleans up only resources the earlier run created. Continuing a local run in the cloud is an explicit handoff: start a cloud session and restore the checkpoint there.
