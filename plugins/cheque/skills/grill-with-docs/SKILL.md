---
name: grill-with-docs
description: `cheque` packaging of Matt Pocock's grill-with-docs. A relentless interview to sharpen a plan or design, which also records glossary terms and ADRs as it goes.
disable-model-invocation: true
---

This is the upstream `grill-with-docs` skill, bundled at a pinned revision so
it works without a separate install. `PLUGIN` is the directory two levels
above this file.

Read and follow, in this order, as the upstream skill directs:

1. `PLUGIN/vendor/mattpocock-skills/skills/productivity/grilling/SKILL.md`
2. `PLUGIN/vendor/mattpocock-skills/skills/engineering/domain-modeling/SKILL.md` (and the format files it links)

Where those files say `GLOSSARY.md` or `docs/adr/`, use the repository's
existing locations from `.cheque/config.yaml` (`documents.glossary`,
`documents.adr_dir`; the defaults are the upstream conventions). Edit those
files in place so standalone users of the upstream skill see the same
documents.

When the operator confirms shared understanding, write goals, non-goals,
acceptance criteria and unresolved decisions into the delivery's plan
document (`documents.planning_dir/<issue>.md`), the one plan the `cheque`
delivery uses.
