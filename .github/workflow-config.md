# Workflow Configuration

This file provides repo-specific settings consumed by workflow skills.

## Feature docs directory

Feature documentation lives at:

```
/specs/
```

Within this directory, each feature has its own folder named `<feature-name>/`, containing
`goals.md`, `requirements.md`, and `architecture.md` as applicable.
Within that `<feature-name>` directory should be a directory named `.temp/` with files that
do not need to be kept after feature development is complete, such as `mocks.html`, `mocks.context.md`,
and `implementation_plan/`.

## Quality commands

Run these commands to verify code quality. All must pass before committing.

- **Format**: `npm run format:check`
- **Check (lint + typecheck + ratchets)**: `npm run lint:check`
- **Unit tests**: `npm run test:unit`

## Product identity

This is not a product, but a platform which contains an API that's published via NPM and
several supporting tools. The platform is called Babylon.js, and the tools include several
deployed web-based tools, such as the playground, sandbox, and editors: Node Material
Editor (NME), GUI Editor, Node Geometry Editor (NGE), Node Render Graph Editor (NRGE),
Smart Filters Editor (SFE), Node Particle Editor (NPE), and the Viewer.

When creating HTML mocks, match the look and feel of the tool's existing UI. Don't guess at
what the tool looks like — read the UI code and create a close approximation.

## Manual testing

To manually test see the instructions in `.github/instructions/manual-testing.instructions.md`

## Test conventions

### Unit tests

Place unit tests in a `test` folder alongside the `src` folder of the code to test.
Unit tests must be in a `unit` subdirectory (e.g. `test/unit/`) to be picked up by the test runner. Test files must end with `.test.ts` and **must** end with `test.ts` to be recognized. For example:

```
/ src
  / MyFeature
    index.ts
    / test
      / unit
        myFeature.test.ts
```

### Visualization tests

Every major new rendering feature **must** have a visualization test when applicable.
Babylon.js-specific guidance for adding, updating, and running visualization tests lives in:

```
.github/instructions/visual-tests.instructions.md
```

That instruction file is the source of truth for config locations, helper script paths,
reference image paths, local commands, engine coverage expectations, and related snippet
tooling notes.

## Fix bug

See `.github/instructions/fix-bug.instructions.md` for detailed instructions on how to
look up and fix bugs from GitHub issues.

## Related skills

These project-specific skills are referenced by the workflow skills. If a skill is not
available in your project, the instruction referencing it can be skipped.

- **Manual testing / screenshots**: `/manual-testing` — launch the app in a headless browser
  and interact with the UI via Playwright CLI to take screenshots or manually test features.
- **Visual testing**: `/visual-testing` — decide when screenshot-based regression coverage is
  appropriate, then follow `.github/instructions/visual-tests.instructions.md` for the
  Babylon.js-specific workflow.
