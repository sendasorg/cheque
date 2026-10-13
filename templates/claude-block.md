## Delivery workflow (stroppers)

Each stage has one owner. Don't run a second tool's version of a stage that already has one.

| Stage | Owner |
| --- | --- |
| Requirements and specs | `mattpocock-skills:grill-with-docs`, then `mattpocock-skills:to-spec` |
| Breaking work into issues | `mattpocock-skills:to-tickets`. Label an issue `ready-for-agent` only when someone could build it without asking a question. |
| Implementation | `mattpocock-skills:tdd`, with ponytail at the full level |
| Bug diagnosis | `mattpocock-skills:diagnosing-bugs` |
| Review and quality gates | `/sdlc:gate` (runs grumpy). Don't also run `mattpocock-skills:code-review` or `/ponytail:ponytail-review` on the same change. |
| Opening the PR | `/sdlc:ship`, without `--merge`. Merging is GitHub's job: branch protection plus auto-merge. |
| Production readiness | `agent-skills` security, observability, and launch skills, only where this repo enables that plugin |
| Debt | `/ponytail:ponytail-debt ponytail` to list deferred shortcuts. `/ponytail:ponytail-audit` is a periodic whole-repo check, not a per-PR step. |

Shortcut marker: this repo writes deliberate shortcuts as `ponytail: <the limit>, <when to upgrade>`, not `shortcut:`. Sharpen's reviewer and ship command read the `ponytail:` form, so it's the one that keeps deferred work visible in PRs.
