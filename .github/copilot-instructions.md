# Babylon.js Copilot Instructions

Extensive documentation for Babylon.js can be found at <https://doc.babylonjs.com/>.

## Product and Architecture Reference

For a complete inventory of all public `@babylonjs` npm packages and their corresponding implementation packages, see [product-inventory.md](product-inventory.md).

For detailed architecture documentation of each product, see the files in [architecture/](architecture/):

## Code review requirements

When reviewing a PR you must follow the instructions in `.github/instructions/code-review.instructions.md`

## Critical repo-wide coding practices

### Side-Effect Imports for Prototype Augmentations (CRITICAL)

This codebase uses TypeScript **module augmentation** to add methods to class prototypes (`Scene`, `Engine`, `ThinEngine`, `AbstractEngine`) in separate files. TypeScript will NOT flag a missing import — the `declare module` block makes methods type-check globally, but at runtime the prototype is `undefined` unless the augmenting file is imported, causing a crash.

**When writing or reviewing code in `packages/dev/core/src/`, always add a side-effect import for any call to a prototype-augmented method.** For example:

```ts
// Required when calling scene.getPhysicsEngine()
import "../Physics/joinedPhysicsEngineComponent";
```

No named imports are needed — the import just ensures the module executes and the prototype assignment runs. The import path should be relative to the consuming file.

See `.github/instructions/side-effect-imports.instructions.md` for the full table of augmented methods and their required imports.

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

`Function.bind` is prohibited; use arrow functions instead. See `.github/instructions/prohibited-apis.instructions.md`.

### Inspector v2

Inspector v2 extensions and UI code must use shared UI components, unsized Fluent icons, Fluent spacing tokens, `makeStyles` over inline styles, and `ISettingsStore` for persistence. See `.github/instructions/inspector.instructions.md`.

### Tests

New APIs should have vitest tests following the existing test structure and conventions, and visualization tests via Playwright when applicable. See `.github/instructions/tests.instructions.md`.
