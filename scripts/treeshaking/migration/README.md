# Tree-Shaking Migration Scripts

This folder contains one-off migration and audit helpers that were used while creating the tree-shaking split. They are kept for reference and for possible follow-up migration work, but they are not part of the normal contributor workflow.

Do not treat scripts in this folder as CI-supported maintenance commands. The supported tree-shaking commands live one directory up in `scripts/treeshaking/` and are wired through `package.json`.

Before running anything here:

- Read the script source and run with `--dry-run` when available.
- Expect scripts to modify files under `packages/dev/core/src`.
- Re-run the supported tree-shaking checks afterward: `npm run check:treeshaking-all`.

These scripts were created on the tree-shaking branch and moved here to keep the permanent tool surface small.
