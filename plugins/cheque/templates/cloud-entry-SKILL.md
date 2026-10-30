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
   # another branch. An entry pinned to a custom ref looks only in that ref's
   # own cache, since another checkout of the same version may be another ref.
   ok() { [ -n "$1" ] && [ -f "$1/plugins/cheque/skills/deliver/SKILL.md" ] && grep -qs '"version": "{{version}}"' "$1/plugins/cheque/.claude-plugin/plugin.json"; }
   for d in {{candidates}}; do
     ok "$d" && break
     d=
   done
   CHEQUE_HOME="${d:-$HOME/.cache/cheque/{{cache}}}"
   # Here CHEQUE_HOME is the cache unless a checkout passed; a cache that fails
   # the check is partial or stale, and git clone refuses a non-empty directory.
   if ! ok "$CHEQUE_HOME"; then
     rm -rf "$HOME/.cache/cheque/{{cache}}"
     git clone --depth 1 --branch '{{ref}}' {{repo_url}} "$HOME/.cache/cheque/{{cache}}"
   fi
   ok "$CHEQUE_HOME" || { echo "cheque {{version}} is not available at $CHEQUE_HOME" >&2; false; }
   ```

   If the snippet fails (no network, no access, or no checkout of cheque
   {{version}}), stop and report the blocker.
   Cloud sessions authenticate GitHub only for the repositories attached to
   the session, so attach {{repo_url}} as an additional repository so the
   clone can authenticate, or use an environment setup script that checks out
   {{ref}} at `$HOME/.cache/cheque/{{cache}}`.
3. Read `$CHEQUE_HOME/plugins/cheque/skills/deliver/SKILL.md` and follow it. Its
   helper is `node $CHEQUE_HOME/plugins/cheque/bin/cheque`.
