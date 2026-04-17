# Instruction Files

This directory contains instruction files that define coding practices, review rules, and workflows for the Babylon.js repository. Read the relevant files based on the task at hand.

## Code Review & Contribution

- **[pr-labels.md](pr-labels.md)** — PR label assignment rules based on the type and location of changes.
- **[backcompat.instructions.md](backcompat.instructions.md)** — Backward compatibility rules for public APIs (compile-time and runtime).
- **[comments.instructions.md](comments.instructions.md)** — Doc comment requirements for public APIs.
- **[prohibited-apis.instructions.md](prohibited-apis.instructions.md)** — Banned APIs (e.g. `Function.bind`), deprecated API usage rules, and their alternatives.

## Architecture & Patterns

- **[side-effect-imports.instructions.md](side-effect-imports.instructions.md)** — Critical prototype augmentation import rules for `Scene`, `Engine`, `ThinEngine`, and `AbstractEngine`.
- **[entities.instructions.md](entities.instructions.md)** — Rules for new scene entities (Inspector, serializer, and loader support).
- **[gltf-extensions.instructions.md](gltf-extensions.instructions.md)** — glTF 2.0 extension registration in the dynamic imports file.
- **[performance.instructions.md](performance.instructions.md)** — Render loop allocation and Observable notification rules.

## UI & Editors

- **[react.instructions.md](react.instructions.md)** — React component conventions (FunctionComponent declarations, props destructuring, conditional rendering).
- **[fluent.instructions.md](fluent.instructions.md)** — Fluent UI conventions (shared components, `makeStyles`, spacing tokens, icon imports, `Collapse`, `ToggleButton`).
- **[inspector.instructions.md](inspector.instructions.md)** — Inspector v2-specific conventions (`ISettingsStore`, extension architecture, service definitions).
- **[editor-interaction.instructions.md](editor-interaction.instructions.md)** — How to interact with Babylon editors (layout, wiring nodes, selecting blocks/wires).
- For porting tools from legacy shared-ui-components to Fluent UI, use the `porting-tools-to-fluent` skill.

## Testing

- **[tests.instructions.md](tests.instructions.md)** — Test coverage expectations (Vitest unit tests, Playwright integration/interaction tests).
- **[visual-tests.instructions.md](visual-tests.instructions.md)** — Playwright-based visual regression test workflow (creating, running, verifying).
- **[visual-tests-reference.md](visual-tests-reference.md)** — Config field reference, renderCount/errorRatio tuning, multi-engine and devhost-based tests.
- **[devhost-testing.instructions.md](devhost-testing.instructions.md)** — Using Babylon devhost as the development-time validation loop for core engine changes.
- **[manual-testing.md](manual-testing.md)** — Manual testing workflows (SFE, CDN-based editors).

## Infrastructure

- **[local-servers.md](local-servers.md)** — Port table, readiness checks, and startup commands for local development servers.

## Workflows

- **[fix-bug.md](fix-bug.md)** — Bug-fixing workflow: investigating GitHub issues, extracting repro details, and test-driven fixes.
- **[playground-workflow.md](playground-workflow.md)** — Playground examples for new public APIs, writing Playground code, managing snippets, running local servers, and forcing WebGPU.
