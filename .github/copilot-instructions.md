# Babylon.js Copilot Instructions

## Labels

When reviewing a PR, suggest zero or more labels based on these rules:

- Changes to documentation, instructions, build scripts, or anything that is not under packages/dev or packages/tools should use the "skip changelog" label.
- Accessibility improvements should use the "accessibility" label.
- Changes under packages/dev/inspector-v2/src/components/curveEditor should use the "ace" label.
- Changes under packages/dev/core related to animation should use the "animations" label.
- Changes under packages/dev/core related to audio should use the "audio" label.
- Changes under packages/dev/core related to bones or skeletal animation should use the "bones" label.
- Breaking changes to public APIs (except those prefixed with an underscore) should use the "breaking change" label.
- Bug fixes should use the "bug" label.
- Changes to build scripts or pipelines should use the "build" label.
- Changes to general documentation files or doc comments only should use the "documentation" label.
- Improvements to existing features should use the "enhancement" label.
- Changes under packages/dev/core/FrameGraph should use the "frame graph" label.
- Changes under packages/dev/core related to gaussian splats should use the "gaussian splats" label.
- Changes under packages/tools/guiEditor should use the "gui editor" label.
- Changes under packages/dev/inspector-v2 should use the "inspector" label.
- Changes under packages/dev/loaders should use the "loaders" label.
- Changes under packages/dev/materials should use the "materials" label.
- Changes to nativeEngine.ts or under packages/dev/core/src/Engines/Native should use the "native" label.
- New features should use the "new feature" label.
- Changes under packages/tools/nodeGeometryEditor should use the "nge" label.
- Changes under packages/tools/nodeEditor should use the "nme" label.
- Changes under packages/tools/nodeRenderGraphEditor should use the "nrge" label.
- Changes related to performance optimizations should use the "optimizations" label.
- Changes related to particles should use the "particles" label.
- Changes related to physics should use the "physics" label.
- Changes under packages/tools/playground should use the "playground" label.
- Changes under packages/tools/sandbox should use the "sandbox" label.
- Changes under packages/tools/viewer or packages/tools/viewer-configurator should use the "viewer" label.

## Side-Effect Imports for Prototype Augmentations (CRITICAL)

This codebase uses TypeScript **module augmentation** to add methods to class prototypes (`Scene`, `Engine`, `ThinEngine`, `AbstractEngine`) in separate files. TypeScript will NOT flag a missing import — the `declare module` block makes methods type-check globally, but at runtime the prototype is `undefined` unless the augmenting file is imported, causing a crash.

**When writing or reviewing code in `packages/dev/core/src/`, always add a side-effect import for any call to a prototype-augmented method.** For example:

```ts
// Required when calling scene.getPhysicsEngine()
import "../Physics/joinedPhysicsEngineComponent";
```

No named imports are needed — the import just ensures the module executes and the prototype assignment runs. The import path should be relative to the consuming file.

See `.github/instructions/side-effect-imports.instructions.md` for the full table of augmented methods and their required imports.

## Backward Compatibility

Public APIs must maintain compile-time and runtime backward compatibility. See `.github/instructions/backcompat.instructions.md`.

## Documentation Comments

All public APIs must have complete multi-line doc comments. See `.github/instructions/comments.instructions.md`.

## New Scene Entities

New top-level scene constructs (meshes, cameras, textures, materials, etc.) must be exposed in the Inspector, serializer, and loader. See `.github/instructions/entities.instructions.md`.

## glTF Extensions

New glTF 2.0 loader extensions must be registered in the dynamic imports file. See `.github/instructions/gltf-extensions.instructions.md`.

## Performance

Avoid allocations and Observable notifications in the render loop. See `.github/instructions/performance.instructions.md`.

## Playground Examples

New public APIs should have corresponding playground examples with documentation links. See `.github/instructions/pg.instructions.md`.

## Prohibited APIs

`Function.bind` is prohibited; use arrow functions instead. See `.github/instructions/prohibited-apis.instructions.md`.

## Inspector v2

Inspector v2 extensions and UI code must use shared UI components, unsized Fluent icons, Fluent spacing tokens, `makeStyles` over inline styles, and `ISettingsStore` for persistence. See `.github/instructions/inspector.instructions.md`.

## Tests

New APIs should have vitest tests following the existing test structure and conventions, and visualization tests via Playwright when applicable. See `.github/instructions/tests.instructions.md`.
