---
name: stroppers
description: Deliver an approved Linear issue with Stroppers in a cloud session where the Stroppers plugin is not installed. Use when asked to "use Stroppers", "deliver <issue> with Stroppers", or to continue a Stroppers checkpoint.
---

# Stroppers (cloud entry)

This thin entry exists because cloud sessions load skills committed to the
repository but not plugins. It loads the pinned Stroppers package and hands
over to its entry point.

1. If a `stroppers:deliver` skill is available in this session, use it and stop reading here.
2. Otherwise make the pinned package available:

   ```sh
   # A session with sogamoso/stroppers attached as a second repository has it
   # checked out next to this one; otherwise clone the pinned ref.
   for d in "$STROPPERS_HOME" "$(git rev-parse --show-toplevel)/../stroppers" "$HOME/.cache/stroppers/{{ref}}"; do
     [ -n "$d" ] && [ -f "$d/plugins/stroppers/skills/deliver/SKILL.md" ] && STROPPERS_HOME="$d" && break
   done
   STROPPERS_HOME="${STROPPERS_HOME:-$HOME/.cache/stroppers/{{ref}}}"
   [ -f "$STROPPERS_HOME/plugins/stroppers/skills/deliver/SKILL.md" ] || \
     git clone --depth 1 --branch "${STROPPERS_REF:-{{ref}}}" {{repo_url}} "$STROPPERS_HOME"
   ```

   If the clone fails (no network or no access), stop and report the blocker.
   Cloud sessions authenticate GitHub only for the repositories attached to
   the session, so attach {{repo_url}} as an additional repository, or use an
   environment setup script that installs it at `$STROPPERS_HOME`.
3. Read `$STROPPERS_HOME/plugins/stroppers/skills/deliver/SKILL.md` and follow it. Its
   helper is `node $STROPPERS_HOME/plugins/stroppers/bin/stroppers`.
