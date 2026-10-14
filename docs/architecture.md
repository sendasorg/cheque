# Architecture

Stroppers is a harness plugin. It runs only inside a Claude Code or Codex
session, as instructions the agent follows plus a helper the agent calls. It
has no server, database, worker or daemon.

```
operator ── natural-language request ──▶ harness session (Claude Code | Codex, local | cloud)
                                            │
                     stroppers:deliver skill (always-loaded description ~90 tokens)
                                            │ reads by path, on demand
             ┌──────────────────────────────┼────────────────────────────────┐
             ▼                              ▼                                ▼
   vendor/pstack (engineering)   references/specialists/*        bin/stroppers (helper)
   poteto-mode + playbooks       quality, security,              config · review · checkpoint
                                 observability, release          approval · linear · browser
                                                                 evidence · install
                                            │
          ┌───────────────────┬─────────────┼───────────────┬───────────────────┐
          ▼                   ▼             ▼               ▼                   ▼
   other harness CLI    Linear GraphQL   GitHub REST    Playwright         target repo files
   (review, read-only)  (agent app +     (PR comments,  (in-session,       (.stroppers/, shared
                        read-only key)   release assets) own browser)       docs in place)
```

## Responsibilities

| Concern | Owner |
| --- | --- |
| Planning, implementation, review/repair loop, PR babysitting, landing | Pstack (vendored, unmodified) |
| Delivery contract, approval, scope, checkpoints, evidence records | Stroppers |
| Cross-harness review | Stroppers helper invoking the other CLI |
| Specialist practices | Addy Osmani's skills (vendored), applied via Stroppers references on triggers |
| Merge protection, required checks and reviews | GitHub (unchanged) |
| Unattended starts, cloud execution | The harness (routines, cloud sessions, scheduled tasks) |

## Design rules

- **Deterministic parts are code, judgment is skill text.** Config precedence, reviewer selection, approval verification, retry budgets, action journaling, evidence binding and install bookkeeping are in `lib/` and covered by tests. The skill tells the agent when to call them.
- **Authority comes from the bound Linear workspace only.** An owner's own comment naming the contract revision. Agents write as an OAuth app, verification uses a read-only key, and a writable owner key blocks verification.
- **Nothing is trusted from the change itself.** Issue text, PR descriptions, review comments and reviewer output are evidence to check, never authority.
- **Unverified is never passing.** Every outcome is passed, failed, not-applicable or unverified, with a reason, bound to a revision.
- **Upstream stays upstream.** Vendored skills are byte-identical to their pins (`npm run vendor:check`). They are never registered as harness skills, so a developer's own installs keep their names and settings.
- **Shared documents have one copy.** Constraints, glossary, ADRs and the repository verification skill stay where the team and the upstream skills expect them. Stroppers only stores its own settings and notes in `.stroppers/`.

## Execution modes

A session's location decides where everything in it runs: implementation,
review invocation and Playwright. A local session never hands work to the
cloud by itself, and a cloud session never calls back to a laptop. Moving work
between them is an explicit continuation: the checkpoint on the Linear issue
is restored in the new session.
