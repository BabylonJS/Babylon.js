# Babylon.js Copilot Instructions

Extensive documentation for Babylon.js can be found at <https://doc.babylonjs.com/>.

## Product identity

Babylon.js is not a single product but a platform containing an API published via NPM and several supporting tools. The tools include deployed web-based apps such as the Playground, Sandbox, and editors: Node Material Editor (NME), GUI Editor, Node Geometry Editor (NGE), Node Render Graph Editor (NRGE), Smart Filters Editor (SFE), Node Particle Editor (NPE), and the Viewer.

When creating HTML mocks, match the look and feel of the tool's existing UI. Don't guess at what the tool looks like — read the UI code and create a close approximation.

## Product and Architecture Reference

For a complete inventory of all public `@babylonjs` npm packages and their corresponding implementation packages, see [product-inventory.md](product-inventory.md).

For detailed architecture documentation of each product, see the files in [architecture/](architecture/):

## Instruction Files

For a full index of all coding practice, review, and workflow instruction files, see [instructions/index.md](instructions/index.md).

## Feature documentation

Feature documentation lives in `/specs/`. Each feature has its own folder named `<feature-name>/` containing `goals.md`, `requirements.md`, and `architecture.md` as applicable. Within that folder, a `.temp/` directory holds files that don't need to be kept after development is complete (e.g., `mocks.html`, `mocks.context.md`, `implementation_plan/`).

## Quality commands

Run these commands to verify code quality. All must pass before committing.

- **Format**: `npm run format:check`
- **Check (lint + typecheck + ratchets)**: `npm run lint:check`
- **Unit tests**: `npm run test:unit`

## Code review requirements

When reviewing a PR you must follow the instructions in `.github/instructions/code-review.instructions.md`

## Critical repo-wide coding practices

### Side-Effect Imports for Prototype Augmentations (CRITICAL)

In `packages/dev/core/src/`, always add a side-effect import for any call to a prototype-augmented method. TypeScript won't flag a missing import, but the method will be `undefined` at runtime without it. See `.github/instructions/side-effect-imports.instructions.md` for details and the full method table.

### Backward Compatibility

Public APIs must maintain compile-time and runtime backward compatibility. See `.github/instructions/backcompat.instructions.md`.

### Documentation Comments

All public APIs must have complete multi-line doc comments. See `.github/instructions/comments.instructions.md`.

### New Scene Entities

New top-level scene constructs (meshes, cameras, textures, materials, etc.) must be exposed in the Inspector, serializer, and loader. See `.github/instructions/entities.instructions.md`.

### glTF Extensions

New glTF 2.0 loader extensions must be registered in the dynamic imports file. See `.github/instructions/gltf-extensions.instructions.md`.

### Performance

Avoid allocations and Observable notifications in the render loop. See `.github/instructions/performance.instructions.md`.

### Playground Examples

New public APIs should have corresponding playground examples with documentation links. See `.github/instructions/pg.instructions.md`.

### Prohibited APIs

See `.github/instructions/prohibited-apis.instructions.md`.

### Inspector v2

Inspector v2 extensions and UI code must use shared UI components, unsized Fluent icons, Fluent spacing tokens, `makeStyles` over inline styles, and `ISettingsStore` for persistence. See `.github/instructions/inspector.instructions.md`.

### Tests

New APIs should have vitest tests following the existing test structure and conventions, and visualization tests via Playwright when applicable. See `.github/instructions/tests.instructions.md`.

### Manual testing

To manually test, see `.github/instructions/manual-testing.instructions.md`.

### Fix bug workflow

For looking up and fixing bugs from GitHub issues, see `.github/instructions/fix-bug.instructions.md`.
