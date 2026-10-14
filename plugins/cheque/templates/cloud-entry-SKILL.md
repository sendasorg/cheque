---
name: cheque
description: Deliver an approved Linear issue with Cheque in a cloud session where the Cheque plugin is not installed. Use when asked to "use Cheque", "deliver <issue> with Cheque", or to continue a Cheque checkpoint.
---

# Cheque (cloud entry)

This thin entry exists because cloud sessions load skills committed to the
repository but not plugins. It loads the pinned Cheque package and hands
over to its entry point.

1. If a `cheque:deliver` skill is available in this session, use it and stop reading here.
2. Otherwise make the pinned package available:

   ```sh
   # A session with sendasorg/cheque attached as a second repository has it
   # checked out next to this one; otherwise clone the pinned ref.
   for d in "$CHEQUE_HOME" "$(git rev-parse --show-toplevel)/../cheque" "$HOME/.cache/cheque/{{ref}}"; do
     [ -n "$d" ] && [ -f "$d/plugins/cheque/skills/deliver/SKILL.md" ] && CHEQUE_HOME="$d" && break
   done
   CHEQUE_HOME="${CHEQUE_HOME:-$HOME/.cache/cheque/{{ref}}}"
   [ -f "$CHEQUE_HOME/plugins/cheque/skills/deliver/SKILL.md" ] || \
     git clone --depth 1 --branch "${CHEQUE_REF:-{{ref}}}" {{repo_url}} "$CHEQUE_HOME"
   ```

   If the clone fails (no network or no access), stop and report the blocker.
   Cloud sessions authenticate GitHub only for the repositories attached to
   the session, so attach {{repo_url}} as an additional repository, or use an
   environment setup script that installs it at `$CHEQUE_HOME`.
3. Read `$CHEQUE_HOME/plugins/cheque/skills/deliver/SKILL.md` and follow it. Its
   helper is `node $CHEQUE_HOME/plugins/cheque/bin/cheque`.
