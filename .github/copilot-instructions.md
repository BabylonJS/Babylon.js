# Babylon.js Copilot Instructions

Extensive documentation for Babylon.js can be found at <https://doc.babylonjs.com/>.

## Product identity

Babylon.js is not a single product but a platform containing an API published via NPM and several supporting tools. The tools include deployed web-based apps such as the Playground, Sandbox, and editors: Node Material Editor (NME), GUI Editor, Node Geometry Editor (NGE), Node Render Graph Editor (NRGE), Smart Filters Editor (SFE), Node Particle Editor (NPE), and the Viewer.

When creating HTML mocks, match the look and feel of the tool's existing UI. Don't guess at what the tool looks like — read the UI code and create a close approximation.

## Product and Architecture Reference

For a complete inventory of all public `@babylonjs` npm packages and their corresponding implementation packages, see [product-inventory.md](product-inventory.md).

For detailed architecture documentation of each product, see the files in [architecture/](architecture/)

## Instruction Files

For a full index of all coding practice, review, and workflow instruction files, see [instructions/index.md](instructions/index.md).

## Feature documentation

Feature documentation lives in `/specs/`. Each feature has its own folder named `<feature-name>/` containing `goals.md`, `requirements.md`, and `architecture.md` as applicable. Within that folder, a `.temp/` directory holds files that don't need to be kept after development is complete (e.g., `mocks.html`, `mocks.context.md`, `implementation_plan/`).

## Tree-Shaking Architecture

The `@babylonjs/core` package uses a three-file split only for modules that need a side-effect-free implementation plus a backward-compatible side-effect wrapper:

- **`foo.pure.ts`** — Pure implementation and idempotent registration function. Imports only from other pure-safe modules. No top-level side effects.
- **`foo.ts`** — Thin wrapper that re-exports from `.pure.ts`, re-exports `.types.ts` when present, and calls the registration function.
- **`foo.types.ts`** — `declare module` augmentations only when the module augments another class or namespace.

Do not create `.pure.ts` plus an empty wrapper for side-effect-free modules. If a module has no runtime side effects or registration work, keep it as a single plain `.ts` file. Generated shader files under `Shaders/`, `ShadersWGSL/`, and `ShadersInclude/` are generated side-effect modules; never create `.pure.ts` variants for them. When modifying an existing split module in core, edit the `.pure.ts` file for logic. Side effects (RegisterClass, prototype augmentations, static API reattachment, generated shader imports, etc.) are owned by the registration function in `.pure.ts` and invoked by the wrapper. See [instructions/tree-shaking.instructions.md](instructions/tree-shaking.instructions.md) for the full guide.

## Public APIs

All public APIs exported from a package's root index file (except those prefixed with an underscore) are considered public APIs.

## Quality commands

Run these commands to verify code quality. All must pass before committing.

- **Format**: `npm run format:check`
- **Check (lint + typecheck + ratchets)**: `npm run lint:check`
- **Unit tests**: `npm run test:unit`

## Code review

When reviewing a PR or reviewing changes on the current branch, use the `code-review` skill. It performs a detailed review against all repo coding practices, flags issues by severity, and fixes them.
