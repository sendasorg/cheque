# Native harness capability matrix

What each harness actually does for `cheque`, as demonstrated during the
0.1 pilot (2026-10-14) with Claude Code 2.1.287 and Codex CLI 0.162.1 on
macOS, and in Claude Code cloud sessions (Ubuntu, Node 22). Every cell is one of:

- **demonstrated**: exercised end to end, evidence noted.
- **documented**: the vendor's current documentation says it works; not exercised here.
- **blocked**: tried or analyzed and it does not work without a change named in the cell.
- **not supported**: the harness does not offer it.

`cheque` adds no hosted service. Anything below that needs a server would be
reported as blocked, not built.

## Plugin loading

| Path | Claude Code | Codex |
| --- | --- | --- |
| Local, project scope | demonstrated: `claude plugin marketplace add sendasorg/cheque#<ref> --scope project` then `claude plugin install cheque@cheque --scope project`; skills `cheque:deliver`, `cheque:grill-with-docs`, `cheque:grill-me`; ~226 always-on tokens, no hooks | demonstrated: `codex plugin marketplace add <source>` then `codex plugin add cheque@cheque`; same namespaced skill names, plugin cached with `bin/`, `lib/` and `vendor/` intact |
| Cloud session | blocked for plugins: cloud sessions do not install plugins enabled in a repository's `.claude/settings.json` (official docs, "What carries over"). Demonstrated alternative: the committed thin entry `.claude/skills/cheque/` bootstraps the pinned package; the `cheque` repository must be attached to the session (private repo) or public | documented: repository skills are available in cloud tasks; plugin loading in cloud tasks is not documented. Thin entry `.agents/skills/cheque/` provided; not exercised (see Codex cloud below) |
| Upstream skills not shadowed | demonstrated: vendored Pstack/Addy/Matt skills are never registered, only read by path | demonstrated: same |

## Subscription authentication and cross-harness review

| Path | Result |
| --- | --- |
| Claude Code implementer → Codex reviewer, local | demonstrated: `codex exec --sandbox read-only` with ChatGPT sign-in; structured findings with model `gpt-6-astra`; caught the seeded defect |
| Codex implementer → Claude reviewer, local | demonstrated: a `codex exec` session ran `cheque review run --reviewer claude-code`; Claude (claude.ai subscription, model `claude-opus-5-5`) returned findings. Requires network access in the Codex sandbox (`sandbox_workspace_write.network_access`) |
| API-key billing avoided | demonstrated: reviewer environment is an allowlist without `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `CODEX_API_KEY`; auth precheck refuses API-key sign-ins |
| Claude cloud implementer → Codex reviewer | blocked: Codex CLI is not in the cloud image (`spawnSync codex ENOENT`, recorded as `unavailable`). Unattended ChatGPT auth in a third-party VM needs a ChatGPT Business/Enterprise Codex access token or a copied auth cache; neither is configured. Continuation: run the review step from a local session (`cheque review run`) or set `harness.review.policy: same-harness` explicitly |
| Codex cloud implementer → Claude reviewer | blocked: needs a `CLAUDE_CODE_OAUTH_TOKEN` (`claude setup-token`, subscription) provisioned in the Codex environment and the Claude CLI installed by its setup; not configured |
| Reviewer isolation | demonstrated: reviewer gets Read/Grep/Glob only (Claude) or a read-only sandbox (Codex), a shared clone of the exact head, the diff as a file |

## Native unattended starts

| Trigger | Claude Code | Codex |
| --- | --- | --- |
| Scheduled / one-off | demonstrated: routine `run_once_at` fired in an Anthropic VM (`CLAUDE_CODE_REMOTE=true`) with no local process involved; minimum recurring interval 1 hour; 100 scheduled runs/hour per account | documented: ChatGPT "Scheduled tasks" (web/mobile/desktop); local-project tasks need the computer awake; CLI cannot manage them |
| Manual run / API | demonstrated: routine "run now"; API `/fire` documented (bearer token per routine, beta header); fire text arrives as untrusted data | documented: `codex cloud exec --env <id>` submits a cloud task |
| GitHub event | documented: routine GitHub triggers on pull request and release events (Claude GitHub App required; hourly caps; events beyond cap dropped) | documented: web scheduled tasks on PR activity; Codex GitHub code review observed active on the pilot repository |
| Laptop asleep | demonstrated in the sense that the run executed entirely in the vendor VM with no local relay; the lid was not physically closed during the pilot | not exercised |
| Duplicate/dropped events | documented: each GitHub event starts an independent session; caps drop excess events. `cheque`'s action journal and lease make repeats safe (unit-tested) | documented: close events may be combined into one run |

## Cloud execution environment

| Need | Claude Code cloud | Codex cloud |
| --- | --- | --- |
| Git and PR access | demonstrated through the GitHub proxy for repositories attached to the session; GitHub GraphQL is refused (`HTTP 403`), so `cheque` uses REST | documented: GitHub connection per environment |
| Second private repository (`cheque` itself) | demonstrated: works only when attached as a session source | not exercised |
| Playwright browsers | blocked on the Default environment: `cdn.playwright.dev` is not on the Trusted allowlist (403). Fix: Custom network access adding `cdn.playwright.dev` and `playwright.download.prss.microsoft.com`, or a setup script on an environment that allows them. Classified by `cheque` as an environment limitation, not a product failure | documented limitation: "computer and browser use" listed as not currently supported; package installs only in setup |
| System libraries (apt) | documented: setup scripts run as root on Ubuntu 24.04 | documented: setup phase has internet |
| Linear credentials | documented: environment variables (visible to environment users on Team/Enterprise) or network secrets (Pro/Max) | documented: network secrets substituted by proxy |
| Evidence export before teardown | demonstrated locally via REST release assets and PR comment; cloud export pending the browser allowlist | not exercised |
| Codex cloud environment for the pilot | — | blocked: environments are created in ChatGPT Codex settings (provider UI); none exists for the pilot repository |

## Linear authority

| Capability | Result |
| --- | --- |
| Per-repository workspace binding | demonstrated: a key for another workspace is rejected ("credential authenticates to workspace other-workspace, but this repository is bound to my-workspace", names changed) |
| Owner approval read with a read-only key | demonstrated: owner comment approving the contract revision verified as `approved`, actor matched by user id |
| Agent cannot self-authorize | demonstrated: an approval line posted by the `cheque` agent app was rejected ("not a configured approval owner"); a comment written with an owner's personal write key is indistinguishable from the owner's (same user id, no `botActor`), which is why agents never hold one |
| Both harnesses honor the same grant | demonstrated: Claude Code and Codex sessions both returned `authorized: merge` from the same Linear record |
| Scope enforcement | demonstrated: `deploy --environment production` refused outside the approved environments |

## Browser isolation (local)

Demonstrated: during a recorded run the operator's everyday Chrome kept the
same process id and an identical tab list (ids and URLs compared before and
after), and no automation browser process remained afterwards. The run used
Playwright-managed Chromium 156 with its own profile on a free port.

Playwright 1.56.1 browser extraction hung on this macOS 27 / Node 26 machine;
1.64.0 installs normally. Repositories should keep Playwright current.
