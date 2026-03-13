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

## Test conventions

### Unit tests

Place unit tests in a `test` folder alongside the `src` folder of the code to test.

## Related skills

These project-specific skills are referenced by the workflow skills. If a skill is not
available in your project, the instruction referencing it can be skipped.

- **Manual testing / screenshots**: `/manual-testing` — launch the app in a headless browser
  and interact with the UI via Playwright CLI to take screenshots or manually test features.
