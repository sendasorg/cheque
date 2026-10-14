# Running the vendored Pstack

Pstack is bundled unmodified at `PLUGIN/vendor/pstack/` (pinned in
`dependencies.json`). It is not registered as a harness skill, so it never
collides with a standalone Pstack install. Read its files by path.

- Entry: read `PLUGIN/vendor/pstack/skills/poteto-mode/SKILL.md` in full and follow it. When it names a skill `<name>`, read `PLUGIN/vendor/pstack/skills/<name>/SKILL.md`. Playbooks are under `skills/poteto-mode/playbooks/`.
- Poteto-mode's own **Harness** section maps Cursor tools to yours (`Task` → `Agent` in Claude Code, `spawn_agent` in Codex; `AskQuestion` → your question tool; `/loop` → a timed shell wait in Codex).
- **Model routing.** Where Pstack says to read `~/.agents/pstack-models.md` or `~/.cursor/rules/pstack-models.mdc`, read the file printed by `cheque models` instead. It sets every role to `inherit-parent` unless the operator configured `pstack.models`. Do not write either global file; standalone Pstack keeps using them unchanged. Never route to a model your current subscription cannot run.
- **Skill edits.** Pstack says to fix a broken skill in its own PR and, in `interrogate`, to PR a default-table update. Do neither to the vendored copy. Report the problem as a `cheque` limitation instead.
- **Cross-harness review** is done by `cheque review run`, not by Pstack's multi-model panels. Pstack's own reviews (arena, interrogate) still run inside the session as its playbooks require.

## Playbooks `cheque` routes to

| Task | Playbook |
| --- | --- |
| New or changed behavior | Feature |
| Defect | Bug fix |
| Structure-only change | Refactoring |
| Slowness | Perf issue |
| PR to merge-ready | Babysit, then Opening a PR |
| Landing | Shipping |
| Continuing someone's work | Session pickup |
| Stopping cleanly | Pause safely |

## Known limits of the pinned Pstack outside Cursor

- `multi-phase-plan`, `autopilot-full` and `autopilot-stack` read files with `git show origin/main:pstack/skills/...`, a path that exists only in the cursor/plugins monorepo. `cheque` does not route to them; split large work into separate approved issues instead.
- `orchestrate` relies on the Cursor dashboard and restart semantics. Not used.
- `watch-pr` needs `bun`. Where `bun` is missing, poll with `gh pr checks <pr> --watch` and `gh pr view <pr> --json state,mergeStateStatus,reviewDecision`.
- `deslop`, `control-cli`, `control-ui` and Bugbot are Cursor products. Use the fallbacks poteto-mode's Harness section names; for browser driving use Playwright via `cheque browser`.
- `environment: "cloud"` subagents become local subagents in their own worktree, per poteto-mode.
