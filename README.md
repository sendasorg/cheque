# stroppers

Stroppers turns a labeled GitHub issue into a reviewed, gated PR, then keeps pushing that PR until it's mergeable or a human has to step in. It doesn't write its own skills. It pins four existing plugin sets to exact commits, gives each stage of delivery one owner, and adds the thin controller those plugins leave out: triggers, retries, a stop condition, and a smoke check after deploy.

All the state lives in GitHub, in labels, branches, and PRs. Workers run on GitHub-hosted runners and keep nothing between runs, so no machine has to stay on.

## The loop

```
issue labeled ready-for-agent
  └─ stroppers-implement ─ tdd + ponytail ─ /sdlc:gate ─ /sdlc:ship ─► PR (agent/issue-N)
                                                                          │
     review submitted, or CI failed on the PR ◄─────────────────────────────┤
  └─ stroppers-respond ── fix ─ /sdlc:gate ─ push ─► (repeats, max 5 rounds) │
                                                                          │
     human approves ─ branch protection passes ─ GitHub auto-merge ◄────────┘
  └─ deploy reports success ─ stroppers-verify-deploy ─ smoke check ─► issue on failure
```

The agent never merges. A human approval plus your required checks decide that, and GitHub's own auto-merge does the clicking.

When the loop can't finish, it stops and says so. If the issue is too vague to build, the agent asks its questions on the issue and labels it `needs-info`. If a run fails, or a PR uses up its rounds, the issue or PR gets `needs-human` with a link to the run, and every later trigger skips it until someone removes the label.

## Who owns what

| Stage | Owner | Plugin |
| --- | --- | --- |
| Requirements, specs, tickets | `grill-with-docs`, `to-spec`, `to-tickets` | [mattpocock/skills](https://github.com/mattpocock/skills) |
| Implementation | `tdd`, with ponytail at the full level | mattpocock/skills, [ponytail](https://github.com/DietrichGebert/ponytail) |
| Review and gates | `/sdlc:gate`, which runs grumpy | [buritica/sharpen](https://github.com/buritica/sharpen) |
| Opening the PR | `/sdlc:ship`, never `--merge` | sharpen |
| Production readiness | security, observability, launch skills | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills), off by default |
| Merge | branch protection plus auto-merge | GitHub |
| Post-deploy check | `actions/verify-deploy` | this repo |

The same table goes into each repo's `CLAUDE.md` (see `templates/claude-block.md`), so interactive sessions follow the same split as the unattended runs. Matt's `implement` skill isn't in the unattended path because it runs its own code review, and that would duplicate the gate.

Addy's plugin is a full install or nothing. Its skills link to shared reference files, so you can't pull out three of them cleanly. Turn it on with `--with addy` in repos where security, observability, or rollout is where the gaps are.

[BMAD](https://github.com/bmad-code-org/BMAD-METHOD) isn't in the marketplace. It ships its own installer, and v7 is in preview with a stated release target of October 16, 2026. For an initiative big enough to need its planning, install stable v6.12 with `npx bmad-method install` in that repo and hand its stories to this loop as issues.

## Set up a repository

1. **Wire the repo.** From a checkout of stroppers:

   ```sh
   bin/stroppers-init --target ../my-app --ci-workflow CI
   ```

   This merges the marketplace and plugins into `.claude/settings.json`, writes a marked block into `CLAUDE.md`, ignores agent scratch directories, and copies three workflows into `.github/workflows/`, with `uses:` pinned to this checkout's commit. `--ci-workflow` is the `name:` of the workflow that runs your tests. Re-running only updates what it owns. Existing workflow files are kept unless you pass `--force`.

2. **Add your test setup** to `stroppers-implement.yml` and `stroppers-respond.yml` at the marked spot: runtimes, dependencies, database services. The agent can't fix code it can't test.

3. **Create a GitHub App** and install it on the repo. It needs repository permissions for Contents, Issues, and Pull requests (read and write), plus Actions and Checks (read). Leave Workflows off: without it, the agent can't change your CI. An App is required, not optional. GitHub doesn't run CI on pushes made with the default `GITHUB_TOKEN`, so without one the agent's PRs never get checked.

4. **Add the repository settings:**
   - Variable `STROPPERS_APP_CLIENT_ID` and secret `STROPPERS_APP_PRIVATE_KEY`
   - Variable `STROPPERS_APP_SLUG`. The respond workflow uses it to ignore the App's own reviews, and the action uses it to accept CI failures on commits the App pushed.
   - Secret `CLAUDE_CODE_OAUTH_TOKEN`, or switch the input to `anthropic_api_key` with a secret of that name

5. **Protect the default branch.** Require one approval and your CI check. If the repo uses Sharpen's `/sdlc:init`, that check is `ci-pass`. Turn on "Allow auto-merge" if you want approved agent PRs to merge themselves, then set `auto_merge: "true"` in `stroppers-implement.yml`.

6. **Set the smoke paths** in `stroppers-verify-deploy.yml` and check the environment name. Vercel reports production as `Production`.

7. **Label an issue `ready-for-agent`.** The labels are created on first run.

For interactive work on your own machine, step 1 is all you need. Once you trust the folder, Claude Code knows the marketplace from `.claude/settings.json`. If it reports a plugin as enabled but not installed, run `/plugin install <name>@stroppers`.

## Pins

Every plugin in `.claude-plugin/marketplace.json` is locked to a commit, and the actions inside the workflows are pinned to commits too. Plugins run hooks on your machine and on CI runners, so an upstream change shouldn't reach you until you've read it.

`bin/check-pins` shows which pins are behind and links to the upstream diff. CI runs it as a non-blocking report. To bump a pin, read the compare link, edit the SHA, and open a PR. CI validates the marketplace and runs the tests.

## Limits worth knowing

- **Sharpen's gate records that a review skill ran, not that the agent followed it.** Its own docs say so. Your required CI check and the human approval are the real gates. Treat the local gate as a fast filter.
- **Issue text is prompt input.** Only people with triage access can apply labels, and that's what stands between a stranger and an agent run. The agent has broad Bash access on the runner, because it has to run your tests. Its GitHub token can't touch workflows, but the Claude credential is available inside the run. Don't use this on repos where untrusted people can label issues.
- **Each round costs a model run.** A review that only says "looks good" still uses a round. Approvals don't trigger anything.
- **The smoke check sees what an anonymous client sees.** If a CDN's bot protection or Vercel's deployment protection sits in front of the URL, the check fails for reasons unrelated to your code. Allow the runner through, or point the check at paths that aren't challenged.
- **Two plugins disagree on the shortcut marker.** Ponytail writes `shortcut:` and Sharpen reads `ponytail:`. The `CLAUDE.md` block settles it on `ponytail:`, which ponytail's docs support. List the debt with `/ponytail:ponytail-debt ponytail`.

## Repository layout

```
.claude-plugin/marketplace.json   pinned plugin set
actions/agent/                    composite action: implement or respond
actions/verify-deploy/            composite action: smoke check, issue on failure
prompts/                          what the agent is told in each mode
bin/                              guard, finish, labels, smoke, init, check-pins
templates/                        caller workflows and the CLAUDE.md block
tests/                            run with: python3 -m unittest discover tests && tests/test_scripts.sh
```
