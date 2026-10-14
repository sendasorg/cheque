# Configuration reference

`cheque` reads YAML from up to four files plus approved task exceptions.
Later layers override earlier ones key by key.

| Order | Layer | Location | Committed | May set authority |
| --- | --- | --- | --- | --- |
| 1 | Packaged defaults | `plugins/cheque/defaults.yaml` | yes (plugin) | no |
| 2 | Operator | `$CHEQUE_OPERATOR_CONFIG`, else `$XDG_CONFIG_HOME/cheque/operator.yaml`, else `~/.config/cheque/operator.yaml`; or the whole file's content in `CHEQUE_OPERATOR_CONFIG_YAML` (cloud environments) | no | yes |
| 3 | Repository | `<repo>/.cheque/config.yaml` | yes | no |
| 4 | Repo-local | `<repo>/.cheque/config.local.yaml` (must stay untracked) | no | yes |
| 5 | Task exceptions | `config` objects inside the approved contract's `exceptions` | in Linear | no; also not `linear` or `adapters` |

Run `cheque config explain` to see the effective result and which layers
contributed. Credential settings are names of environment variables; explain
shows whether each is set, never its value.

Every setting below is validated. An unknown key, a wrong type, an
unregistered harness or authority in a committed file stops `cheque` with a
message naming the file and key. Missing settings that only delivery needs
(Linear binding, owners, repositories) block `cheque` delivery commands and
nothing else.

The parser accepts a strict YAML subset: block maps, block lists, plain or
quoted scalars, `[]`, `{}` and comments. Anchors, tags, flow collections and
multi-line strings are rejected rather than guessed.

## Schema

```yaml
version: 1

harness:
  default: claude-code          # harness for implement, feedback and live verification
  steps:                        # explicit per-step overrides
    implement: null
    feedback: null
    live_verification: null
  review:
    policy: different-harness   # or same-harness (fresh session, explicit opt-in only)
    reviewer: null              # explicit reviewer; wins over policy and survives default changes
    preferences: [claude-code, codex]   # ordered; first enabled one that differs from the implementer
    timeout_minutes: 30
  fallback:
    enabled: false              # use another subscription when the selected one is exhausted
    steps: []                   # limit fallback to these steps; empty = all steps

adapters:                       # registered harnesses
  claude-code: { enabled: true }
  codex: { enabled: true }
  # future-harness:             # a command adapter: reads the prompt on stdin,
  #   enabled: true             # writes findings JSON to $CHEQUE_REVIEW_OUTPUT
  #   command: [my-harness, review, --read-only]

linear:
  workspace: acme               # the one workspace this repository uses (id or URL key)
  team: ENG                     # team key that owns delivery issues
  project: null                 # optional default project
  credential_env: CHEQUE_LINEAR_API_KEY   # variable holding a read-only Linear API key
  approval_state: null          # optional status meaning "approval needed" (a marker only)

authority:                      # private layers only
  owners:
    - linear_user_id: 00000000-0000-0000-0000-000000000000
      label: Approval owner
  repositories: [acme/app]
  environments: [preview, production]

recovery:
  fix_cycles: 3                 # unsuccessful fix-and-verify cycles per blocker before escalation
  infra_retries: 4              # transient infrastructure retries per blocker
  infra_backoff_seconds: [30, 120, 300, 900]

verification:
  browser: chromium             # Playwright-managed browser; chromium, firefox or webkit
  headless: true
  max_run_minutes: 20
  evidence_publication: github-release   # or pr-comment-only

documents:                      # canonical shared documents (read and edited in place)
  constraints: CONSTRAINTS.md
  glossary: GLOSSARY.md
  adr_dir: docs/adr
  verification_skill: null      # auto-detected verify-* skill when null
  planning_dir: .cheque/docs/plans

pstack:
  models: {}                    # role -> model for Pstack, e.g. "hardest tasks": opus
```

## Authority

`authority` decides who can approve autonomous delivery and what it may touch.
It is accepted only from the operator layer and the untracked repo-local file,
so a commit to `.cheque/config.yaml`, a PR or an issue cannot add an owner,
a repository or an environment.

Owners are Linear user ids, not names. Find yours with the Linear API
(`{ viewer { id } }`) or Linear's "Copy user ID" command. Each repository's
binding is checked before every issue operation: the configured credential must
authenticate into `linear.workspace` and the issue must belong to `linear.team`.

In a cloud environment, provide the operator layer as the variable
`CHEQUE_OPERATOR_CONFIG_YAML` and the Linear key as the variable named by
`linear.credential_env`, using the harness's environment settings.

## Harness selection

- Implementation, feedback fixes and live verification run on `harness.default` unless a step override names another harness.
- The reviewer is chosen against the harness that actually implemented the change (recorded in the checkpoint), not the default.
- `different-harness` picks the first entry of `preferences` that is enabled, available in this environment and different from the implementer. If none is available the review is blocked and checkpointed; it is never silently done by the implementer.
- `reviewer` set explicitly always wins. Setting it to the implementer requires `policy: same-harness`.
- Exhaustion of a subscription blocks and waits unless `fallback.enabled` covers that step. `cheque` never uses API-key billing: reviewer processes run with API keys removed.

## Pstack models

Pstack reads model routing only from user-global files. `cheque` writes its
own map from `pstack.models` to `.cheque/state/pstack-models.md` for the
session (`cheque models`) and leaves the global files alone. Roles without
an entry run on the session's own model.
