# Quality contract

Applies to every change. Practices: `PLUGIN/vendor/addyosmani-agent-skills/skills/constraint-driven-development/SKILL.md`.

- The contract is the repository's own standards file at `documents.constraints` (default root `CONSTRAINTS.md`). Read and update it in place; never copy it into `.stroppers/`. Standalone users of the upstream skill edit the same file.
- If the repository has none and the contract needs one, create it with the upstream skill's format: floor, enforced rules (each with command, scope, threshold and stage), measured metrics with today's baseline, and exceptions (reason, owner, expiry). Measure baselines first. Derive every command from the repository's own tooling.
- Fast checks run during the build, task checks before review, CI checks through the existing CI. Do not add a required check or weaken an existing one.
- `stroppers check floor --base <base>` runs the upstream floor guard. A violation fails the change. A legitimate test replacement or threshold change needs evidence in the PR and, if it lowers a bar, an owner-approved contract exception.
