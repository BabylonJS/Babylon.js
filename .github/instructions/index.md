# Instruction Files

This directory contains instruction files that define coding practices, review rules, and workflows for the Babylon.js repository. Read the relevant files based on the task at hand.

## Code Review & Contribution

- **[code-review.instructions.md](code-review.instructions.md)** — PR review rules and label assignment based on the type and location of changes.
- **[backcompat.instructions.md](backcompat.instructions.md)** — Backward compatibility rules for public APIs (compile-time and runtime).
- **[comments.instructions.md](comments.instructions.md)** — Doc comment requirements for public APIs.
- **[prohibited-apis.instructions.md](prohibited-apis.instructions.md)** — Banned APIs (e.g. `Function.bind`) and their alternatives.

## Architecture & Patterns

- **[side-effect-imports.instructions.md](side-effect-imports.instructions.md)** — Critical prototype augmentation import rules for `Scene`, `Engine`, `ThinEngine`, and `AbstractEngine`.
- **[entities.instructions.md](entities.instructions.md)** — Rules for new scene entities (Inspector, serializer, and loader support).
- **[gltf-extensions.instructions.md](gltf-extensions.instructions.md)** — glTF 2.0 extension registration in the dynamic imports file.
- **[performance.instructions.md](performance.instructions.md)** — Render loop allocation and Observable notification rules.

## UI & Editors

- **[inspector.instructions.md](inspector.instructions.md)** — Inspector v2 UI conventions (shared components, `makeStyles`, Fluent icons, `ISettingsStore`).
- **[editor-interaction.instructions.md](editor-interaction.instructions.md)** — How to interact with Babylon editors (layout, wiring nodes, selecting blocks/wires).

## Testing

- **[tests.instructions.md](tests.instructions.md)** — Test coverage expectations (Vitest unit tests, Playwright integration/interaction tests).
- **[visual-tests.instructions.md](visual-tests.instructions.md)** — Playwright-based visual regression tests and screenshot comparison workflows.
- **[devhost-testing.instructions.md](devhost-testing.instructions.md)** — Using Babylon devhost as the development-time validation loop for core engine changes.
- **[manual-testing.instructions.md](manual-testing.instructions.md)** — Manual testing workflows, reusing running processes, and checking service ports.

## Workflows

- **[fix-bug.instructions.md](fix-bug.instructions.md)** — Bug-fixing workflow: investigating GitHub issues, extracting repro details, and test-driven fixes.
- **[pg.instructions.md](pg.instructions.md)** — Playground examples for new public APIs.
