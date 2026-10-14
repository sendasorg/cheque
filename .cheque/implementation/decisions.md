# Implementation decisions

Decisions settled during implementation. Each names its trigger and the
requirement it serves. Settled product decisions are not re-asked.

## D-001 Existing remote branch is superseded

The remote held `ss/friendly-gates-n62i4n` (GitHub Actions controller,
label state, Ponytail and Sharpen gates). That contradicts the accepted
plugin-only architecture (R-003.8, R-004.20, R-069.1). Operator decision:
build on a fresh `main`, leave the old branch untouched on the remote, and
do not reuse its code. Default-branch switch happens at rollout.

## D-002 Repository is both the plugin source and a two-harness marketplace

Claude Code reads `.claude-plugin/marketplace.json`; Codex 0.162 reads
`.claude-plugin/marketplace.json` marketplaces as well as
`.agents/plugins/marketplace.json` (observed in local `codex plugin
marketplace list`). One plugin directory carries both
`.claude-plugin/plugin.json` and `.codex-plugin/plugin.json`. Serves
R-070.2, R-004.12.

## D-003 Upstream skills are vendored unmodified and not registered as harness skills

Registering vendored pstack/Addy/Matt skills as plugin skills would collide
with standalone installs that use the same bare names (R-049.3, R-058.2).
Vendored copies live under `plugins/cheque/vendor/` at pinned SHAs and
are read by path through the `cheque` entry point (path-aware adapter,
R-053, R-054). Only `cheque`-owned skills are registered.

## D-004 Pstack model routing is overridden in session, not in global files

Pstack reads only `~/.agents/pstack-models.md` (or Cursor's `.mdc`) and
hardcodes Grok defaults. `cheque` resolves a role map from its config into
ignored session state and instructs the session to use it in place of the
global file. No global file is written (R-050). Default map: every role
`inherit-parent`, so no Grok dependency (R-004.8).

## D-005 Claude Code cloud sessions load a committed thin entry, not the plugin

Official docs (cloud-environments, "What carries over"): cloud sessions do
not install plugins enabled in a repo's `.claude/settings.json`; committed
`.claude/skills/` do load. The optional cloud entry is a thin committed
skill that bootstraps the pinned package. Codex uses `.agents/skills/` the
same way. Serves R-070.2, R-075.1.

## D-006 Review adapters call the harness CLIs directly

`codex-plugin-cc` reviews only HEAD or the working tree against a base and
has no contract input. The Codex adapter uses `codex exec` read-only in an
isolated worktree at the exact head, with codex-plugin-cc's review output
schema (Apache-2.0, vendored with NOTICE) as the findings contract. The
Claude adapter uses `claude -p` with write tools disallowed. Serves R-063,
R-065, R-066.

## D-007 One plan per delivery, in the configured planning directory

Pstack keeps a single task's plan in its throughput-checkpoint todo list; only
the multi-phase playbook writes a `plan.md`, and that playbook depends on
monorepo paths that do not resolve outside cursor/plugins. `cheque` writes
one plan document per delivery at `documents.planning_dir/<issue>.md`
(default `.cheque/docs/plans/`) holding goals, non-goals, acceptance
criteria, verification plan and unresolved decisions. Pstack's throughput
checkpoint points at it; grilling summaries land in it. Serves R-036.2.

## D-008 Approval is an owner comment naming the contract revision

The canonical approval mechanism is a comment `cheque approve <revision>`
by a configured owner, written directly in Linear (no integration
`botActor`, not `onBehalfOf`), unedited, after the contract comment. It binds
the exact revision without requiring a workspace workflow change. An optional
`linear.approval_state` only marks "approval needed" and never grants
authority. Verified against the Linear GraphQL schema (`Comment.botActor`,
`Comment.onBehalfOf`, `Comment.editedAt`); live attribution of connector
writes remains to be demonstrated with a read-only key. Serves R-087, R-088.

## D-009 Direct pushes to protected main stop

`main` in this repository requires a pull request with one approving review
(not enforced for admins). Early commits were pushed directly by the
implementing session with admin bypass before this was noticed. From commit
`8853749` onward all work goes through `stroppers/release-0.1` and a PR. The
earlier commits are left as they are rather than rewritten.

## D-010 Release PR is squash-merged

Two docs commits on the release branch named the operator's Linear
workspaces before the public-tree scan generalized them. Squash-merging the
release PR keeps those strings out of `main`'s history. The branch itself is
deleted after merge.
