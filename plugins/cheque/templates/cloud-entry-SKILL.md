---
name: cheque
description: Deliver an approved Linear issue with `cheque` in a cloud session where the `cheque` plugin is not installed. Use when asked to "use `cheque`", "deliver <issue> with `cheque`", or to continue a `cheque` checkpoint.
---

# `cheque` (cloud entry)

This thin entry exists because cloud sessions load skills committed to the
repository but not plugins. It loads the pinned `cheque` package and hands
over to its entry point.

1. If a `cheque:deliver` skill is available in this session, use it and stop reading here.
2. Otherwise make the pinned package available:

   ```sh
   # A session with sendasorg/cheque attached as a second repository has it
   # checked out next to this one; otherwise clone the pinned ref. A checkout
   # counts only if it is cheque {{version}}: an attached repository may be on
   # another branch.
   ok() { [ -n "$1" ] && [ -f "$1/plugins/cheque/skills/deliver/SKILL.md" ] && grep -qs '"version": "{{version}}"' "$1/plugins/cheque/.claude-plugin/plugin.json"; }
   for d in "$CHEQUE_HOME" "$(git rev-parse --show-toplevel)/../cheque" "$HOME/.cache/cheque/{{cache}}"; do
     ok "$d" && break
     d=
   done
   CHEQUE_HOME="${d:-$HOME/.cache/cheque/{{cache}}}"
   ok "$CHEQUE_HOME" || git clone --depth 1 --branch '{{ref}}' {{repo_url}} "$CHEQUE_HOME"
   ok "$CHEQUE_HOME" || { echo "cheque {{version}} is not available at $CHEQUE_HOME" >&2; false; }
   ```

   If the snippet fails (no network, no access, or no checkout of cheque
   {{version}}), stop and report the blocker.
   Cloud sessions authenticate GitHub only for the repositories attached to
   the session, so attach {{repo_url}} as an additional repository, or use an
   environment setup script that installs it at `$CHEQUE_HOME`.
3. Read `$CHEQUE_HOME/plugins/cheque/skills/deliver/SKILL.md` and follow it. Its
   helper is `node $CHEQUE_HOME/plugins/cheque/bin/cheque`.
