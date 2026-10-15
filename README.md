# `cheque`

`cheque` is a plugin for Claude Code and Codex that takes a Linear issue from
an approved contract to verified delivery. You say "Use `cheque` to deliver
ENG-123. Ship when verified." The agent drafts a delivery contract on the
issue, waits for you to approve it once, then builds, reviews, verifies, opens
and lands the PR, deploys where approved, checks the result live, and records
the evidence in Linear.

It is a set of skills plus a small helper that runs inside your agent session.

## Status of 0.1

Demonstrated in the pilot: plugin loading in Claude Code and Codex; Claude ↔
Codex review in both directions on subscription sign-ins; Linear approval that
an agent cannot forge through the `cheque` app; a complete delivery in fresh
Claude Code sessions (contract, approval, implementation, cross-harness
review, browser evidence on the PR, merge, re-verification, Done in Linear);
native Claude Code cloud starts. Not yet demonstrated: a delivery with a real
deployment and live acceptance, Codex cloud, browser checks inside cloud
sessions (blocked by the default network allowlist), cross-harness review
inside a vendor cloud, and the interactive grilling flow. Details:
[docs/capability-matrix.md](docs/capability-matrix.md) and
[docs/validation-report.md](docs/validation-report.md).
There is no server, daemon or hosted controller. Unattended runs use each
harness's own cloud sessions and schedules.

## What does what

- **[Pstack](https://github.com/backnotprop/pstack)** (Lauren Tan's engineering skills) does the engineering: planning, implementation playbooks, its own review and repair loop, PR babysitting and shipping. `cheque` does not replace any of it.
- **`cheque`** adds what Pstack leaves to the operator:
  - a delivery contract per issue, approved once by an owner in Linear;
  - review by a different harness than the one that implemented (Claude Code implements, Codex reviews, or the reverse);
  - specialist checks only when the change calls for them: a quality floor on every change, and security, observability and release readiness when triggered (adapted from [Addy Osmani's agent skills](https://github.com/addyosmani/agent-skills));
  - optional design interviews ([Matt Pocock's](https://github.com/mattpocock/skills) `grill-with-docs` and `grill-me`);
  - browser verification with Playwright inside the session that does the work, with videos on the PR;
  - portable checkpoints on the Linear issue, so a run can resume in a fresh session, the other harness, or the cloud.
- **Your harness** (Claude Code or Codex) is the runtime. Its cloud sessions and schedules provide unattended operation; a plugin cannot start itself.

## Requirements

- Claude Code 2.1 or later signed in with a claude.ai subscription, and/or Codex CLI 0.162 or later signed in with ChatGPT. `cheque` never uses API-key billing; it removes API keys from reviewer processes and refuses API-key sign-ins.
- For cross-harness review, both CLIs installed and signed in where the review runs.
- Node.js 20 or later, `git`, and the GitHub CLI `gh` signed in.
- A Linear workspace where you can create an OAuth application and a personal API key.
- Tested on macOS 27 (local) and Claude Code cloud sessions (Ubuntu, Node 22). See [the capability matrix](docs/capability-matrix.md) for what works where, including what is blocked.

## Set up

### 1. Install the plugin in a repository

Claude Code (project scope, so the team gets the same version):

```sh
cd your-repo
claude plugin marketplace add sendasorg/cheque#v0.2.0 --scope project
claude plugin install cheque@sendas --scope project
```

Codex:

```sh
codex plugin marketplace add https://github.com/sendasorg/cheque.git
codex plugin add cheque@sendas
```

Both register the namespaced skills `cheque:deliver`, `cheque:grill-with-docs`
and `cheque:grill-me`. `cheque` bundles its own pinned copies of Pstack and
the other skills and never registers them, so it works without separate
installs and never shadows a version you installed yourself.

Then add the `cheque` files to the repository. The helper lives in the
plugin; `PLUGIN` below is the installed plugin directory (Claude Code:
`~/.claude/plugins/cache/sendas/cheque/<version>`; Codex:
`~/.codex/plugins/cache/sendas/cheque/<version>`), or the
`plugins/cheque` directory of a `cheque` checkout:

```sh
node PLUGIN/bin/cheque install            # add --cloud-entry for cloud sessions
git add .cheque .gitignore && git commit -m "Set up cheque"
```

This creates `.cheque/config.yaml`, `.cheque/README.md` and a marked
block in `.gitignore`. Nothing else in the repository changes.

### 2. Bind the repository to Linear

Each repository uses exactly one Linear workspace. Edit `.cheque/config.yaml`:

```yaml
linear:
  workspace: your-workspace-url-key
  team: ENG
```

In that Linear workspace, create two credentials once:

1. **Agent app.** Settings > API > OAuth applications > New. Name it (for example "`cheque` agent"), enter any callback URL, enable client credentials, and give it read and write access. `cheque` writes every contract, checkpoint and evidence comment as this app.
2. **Read-only key.** Settings > Security & access > Personal API keys, read-only. `cheque` reads approvals with it.

Keep them out of the repository. Provide them as environment variables (the
names are configurable in `linear.*_env`):

```sh
CHEQUE_LINEAR_API_KEY=<read-only key>
CHEQUE_LINEAR_AGENT_CLIENT_ID=<app client id>
CHEQUE_LINEAR_AGENT_CLIENT_SECRET=<app client secret>
```

One way is a private file you source before starting your agent:
`set -a; . ~/.config/cheque/<workspace>.env; set +a` (create it with mode 600).

Never give `cheque` a personal key that can write. A comment written with
your own write key looks exactly like a comment you typed, so an agent holding
one could approve its own work. `cheque doctor` blocks delivery if the
verification key can write as an owner. The same applies to a Linear
connector or MCP server signed in as an approval owner: `cheque` never writes
through one, but a session that has one could. Keep owner-signed Linear
connectors out of delivery sessions (for Claude Code routines, scope the
routine's connectors) until their attribution has been checked.

### 3. Set your private operator policy

Who may approve, and what delivery may touch, is never read from the
repository. Put it in `~/.config/cheque/operator.yaml` (mode 600):

```yaml
authority:
  owners:
    - linear_user_id: 00000000-0000-0000-0000-000000000000   # your Linear user id
      label: Me
  repositories:
    - acme/app
  environments:
    - preview
    - production
```

Find your Linear user id with the read-only key:

```sh
curl -s https://api.linear.app/graphql -H "Authorization: $CHEQUE_LINEAR_API_KEY" \
  -H "Content-Type: application/json" -d '{"query":"{ viewer { id } }"}'
```

### 4. Check

```sh
node PLUGIN/bin/cheque doctor
```

`doctor` lists any blocker with what clears it: missing binding, a key for the
wrong workspace, a writable owner key, a harness that is not signed in.

## Your first delivery

1. **Ask.** In Claude Code or Codex, in the repository: "Use `cheque` to deliver ENG-123. Ship when verified." (The skill is also available as `/cheque:deliver`.) To pick the reviewer explicitly, add "Review with Codex" or "Review with Claude".
2. **Read the contract.** The agent reads the issue and posts a "`cheque` delivery contract" comment: outcome, acceptance criteria, scope, repositories, environments, deployment and recovery. It also posts a checkpoint comment and tells you the approval line.
3. **Approve once.** If the contract is right, comment exactly the line it shows:

   ```
   cheque approve sha256:<revision>
   ```

   That approves this revision only. `cheque revoke` withdraws it. If the agent later needs more scope, it posts a new revision and waits for `cheque extend sha256:<revision>`. It continues unrelated in-scope work meanwhile.
4. **Let it run.** The agent plans with Pstack, runs the triggered specialist checks and the quality floor, implements, gets a review from the other harness, fixes accepted findings, and opens the PR. Your repository's required checks and required human reviews still apply. Approval does not bypass them.

   Your harness's own permission policy applies too. Claude Code's auto mode refuses to merge without a human review even when Linear approval covers it. If you want `cheque` to land approved work itself, allow the command deliberately, for example in `.claude/settings.local.json`:

   ```json
   { "permissions": { "allow": ["Bash(gh pr merge:*)"] } }
   ```

   Otherwise the agent stops at "ready to merge" and you merge.
5. **Inspect the PR.** Browser changes get a "`cheque` verification" comment with the tested revision, executor, per-criterion outcomes and links to the recorded videos. Backend and docs changes get the checks that fit them instead.
6. **Delivery.** After merge, and deployment where the contract includes one, the agent runs the live acceptance checks and posts the results to Linear. It closes the issue only when every criterion has passed. Anything still unverified, or waiting on an observation window or your judgment, stays open and listed.

Ask "`cheque` status for ENG-123" at any time.

## Everyday operation

| You want to | Do |
| --- | --- |
| See where a delivery is | "`cheque` status for ENG-123", or `cheque checkpoint show` |
| Pause | "Pause the `cheque` delivery"; it finishes the current step, checkpoints, stops |
| Stop for good | Comment `cheque revoke` on the issue, or cancel it |
| Resume | "Continue the `cheque` delivery of ENG-123" in a new session. It claims the checkpoint from Linear (refusing if another session holds it) and reconciles unfinished actions first. Demonstrated in fresh local Claude Code sessions; see the capability matrix for cloud and Codex |
| Stress-test a design first | "/cheque:grill-with-docs" (the upstream name is `grill-with-docs`, not `grill-me-with-docs`), or "/cheque:grill-me" for decisions that don't need repo docs |
| Find evidence | PR comments marked "`cheque` verification", the repository's `cheque-evidence` prerelease, and the Linear checkpoint comment. Local run files are in `.cheque/artifacts/` (ignored) |
| Diagnose a blocker | `cheque doctor`, then `cheque checkpoint show`; blockers name what clears them |

Recovery is bounded. Three unsuccessful fix-and-verify cycles on the same
blocker stop that work and escalate to you with evidence and a recommended
next step. Transient infrastructure failures retry with backoff on a separate
budget. Counters survive restarts and harness switches. If a subscription runs
out, the run checkpoints and waits. It uses your other subscription only if you
set `harness.fallback.enabled`.

## Harnesses and routing

Claude Code implements by default and a different harness reviews. Change it
in operator or repository config:

```yaml
harness:
  default: codex                 # who implements, fixes feedback, verifies live
  steps:
    live_verification: claude-code
  review:
    policy: different-harness    # or same-harness (fresh session), explicit only
    reviewer: null               # pin a reviewer; survives default changes
  fallback:
    enabled: false
```

The reviewer is chosen against the harness that actually implemented the
change. If no different harness is available in the current environment, the
review is blocked and checkpointed. It is never quietly done by the
implementer. Review sessions are read-only and cannot start further reviews.
Full reference: [docs/configuration.md](docs/configuration.md).

## Browser verification

- Runs only when the contract's criteria involve browser behavior. Playwright is never a required GitHub check.
- Runs where the session runs: on your machine for local work, inside the harness cloud session for cloud work. Never on another machine, and never by falling back to another harness.
- Installing missing browsers and system libraries is pre-authorized (`cheque browser prepare`). If the environment can't install them, the result is "unverified (environment)", not a pass and not a product failure.
- Uses a Playwright-managed browser with its own profile, a free port and its own output directory. It never touches your everyday browser, its profile or its sessions.
- Videos and failure traces are uploaded as assets of the repository's `cheque-evidence` prerelease. Links follow the repository's visibility and expire only if you delete them. A result index goes on the PR, bound to the tested commit.
- A run interrupted by sleep or a closed session is never counted. Resuming reruns it at the recorded commit.

## Unattended runs

`cheque` runs only inside a harness session. For work that continues while
your laptop is closed, start it in a cloud session:

- **Claude Code.** `claude --cloud "Use cheque to deliver ENG-123"`, or a [routine](https://code.claude.com/docs/en/routines) (schedule, API or GitHub trigger). Cloud sessions don't install plugins, so run `cheque install --cloud-entry` in the repository. Attach `sendasorg/cheque` to the session if it is private for you. In the cloud environment:
  - set the three Linear variables and `CHEQUE_OPERATOR_CONFIG_YAML` (the content of your operator.yaml);
  - allow `api.linear.app`, `cdn.playwright.dev` and `playwright.download.prss.microsoft.com` under Custom network access;
  - scope the routine's connectors to what it needs.
- **Codex.** Cloud tasks need an environment created in ChatGPT's Codex settings with the same variables; see the capability matrix for what was not exercised.

Cross-harness review inside one vendor's cloud needs the other vendor's CLI
and subscription credential provisioned there, which is not set up by
default. When it isn't available, the review step blocks with a continuation
path instead of being skipped. Details and current limits:
[docs/capability-matrix.md](docs/capability-matrix.md).

## Update, roll back, uninstall

```sh
# update: refresh the marketplace, then the plugin (harnesses cache by version)
claude plugin marketplace update sendas && claude plugin update cheque@sendas --scope project
node PLUGIN/bin/cheque update             # refreshes managed files it still owns

# roll back: pin the marketplace to an earlier tag, v0.2.0 or later, and reinstall
claude plugin marketplace remove sendas --scope project
claude plugin marketplace add sendasorg/cheque#<earlier tag> --scope project
claude plugin install cheque@sendas --scope project

# uninstall from a repository
node PLUGIN/bin/cheque uninstall
claude plugin uninstall cheque@sendas --scope project
```

`uninstall` removes only files and blocks `cheque` created and that nobody has
edited since. It always keeps `.cheque/config.yaml` and shared documents
(constraints, glossary, ADRs, verification skills), and reports anything it
left in place. Active deliveries keep their checkpoints in Linear and can
resume after reinstalling.

## Coexistence

Teammates who don't use `cheque` aren't affected:

- `cheque` registers only namespaced skills and installs no hooks; the always-loaded cost is about 230 tokens.
- It reads Pstack's model settings without writing `~/.agents/pstack-models.md`; its own model map stays in the session.
- Shared documents stay in their usual places (`CONSTRAINTS.md`, `GLOSSARY.md`, `docs/adr/`, `.claude/skills/verify-*`) and work with the upstream skills alone.
- Symlinks are not used.

See [docs/validation-report.md](docs/validation-report.md) for what was
tested.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `credential authenticates to workspace X, but this repository is bound to Y` | The key belongs to another workspace. Use the key for the repository's workspace |
| `verification key ... can write as an approval owner` | Replace `CHEQUE_LINEAR_API_KEY` with a read-only key |
| `Linear did not issue an agent token` | Enable client credentials on the OAuth app; check the client id and secret |
| Review `unavailable` or `auth-failed` | Install and sign in to the reviewer CLI where the review runs (`claude auth status`, `codex login status`) |
| Browser `unverified (environment)` | Run `cheque browser prepare`; in cloud, allow the Playwright download hosts |
| Another project's `cheque` version changed | Claude Code tracks a marketplace by name per machine; adding it at a new ref moves every project installed from it. Pin with the same ref everywhere, or reinstall |
| Plugin changes not picked up | Harnesses cache by version: update the marketplace and the plugin, or reinstall |
| Agent stops at "ready to merge" with a permission denial | The harness blocked the merge. Merge yourself, or allow `Bash(gh pr merge:*)` for the repository |
| `HTTP 403: GitHub GraphQL is not available` in cloud | Expected; `cheque` uses REST. Avoid `gh pr comment` in custom steps |

## Contributing

```sh
npm test               # unit and integration tests (node --test)
npm run vendor:check   # vendored sources match their pinned commits
npm run validate       # Claude plugin and marketplace manifests
npm run version:check  # plugin version bumped if plugins/cheque/ changed since main
```

To check the version before every commit, point git at the versioned hooks
once per clone: `git config core.hooksPath .githooks`.

### Releasing

A pull request that changes `plugins/cheque/` bumps `version` to the same value
in both plugin manifests and the Claude Code marketplace entry: MAJOR for a
breaking change (a renamed or removed skill, command, config key or environment
variable, or a renamed plugin), MINOR for a new capability, PATCH otherwise.
Harnesses refresh an installed plugin only when its version changes, so an
unbumped change never reaches anyone. CI fails a pull request that changes
`plugins/cheque/` without a bump, or that reuses a tagged version; if another
pull request takes the version first, rebase and bump again. Changes outside
`plugins/cheque/` (docs, tests, CI) need no bump. The install command in Set
up pins a tag; move it to the new version in the same pull request.

When the bump lands on `main`, CI tags the commit `vX.Y.Z` and publishes a
GitHub release with generated notes. Never tag by hand. For a major release,
edit the release notes afterwards to say what broke and how to migrate.

## License and attribution

MIT. 

Bundled components keep their own licenses. See
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and the pinned sources in
[dependencies.json](dependencies.json): 
- Pstack (MIT, Lauren Tan)
- agent-skills (MIT, Addy Osmani)
- skills (MIT, Matt Pocock)
- codex-plugin-cc review schema (Apache-2.0, OpenAI).
