# Babylon.js Copilot Instructions

Extensive documentation for Babylon.js can be found at <https://doc.babylonjs.com/>.

## Product and Architecture Reference

For a complete inventory of all public `@babylonjs` npm packages and their corresponding implementation packages, see [product-inventory.md](product-inventory.md).

For detailed architecture documentation of each product, see the files in [architecture/](architecture/):

- [Core](architecture/core.md) — Main 3D engine: scene graph, rendering, materials, cameras, lights, animation, physics, XR
- [GUI](architecture/gui.md) — 2D texture-based and 3D world-space UI systems
- [Loaders](architecture/loaders.md) — Asset import plugins (glTF, OBJ, STL, BVH, SPLAT)
- [Materials](architecture/materials.md) — Specialized material library (water, sky, fur, cel, grid, etc.)
- [Serializers](architecture/serializers.md) — Scene export plugins (glTF, OBJ, STL, USDZ, BVH, 3MF)
- [Post-Processes](architecture/post-processes.md) — Additional screen-space effects
- [Procedural Textures](architecture/procedural-textures.md) — GPU-generated textures
- [Addons](architecture/addons.md) — Optional modules (atmosphere, HTML mesh, MSDF text, navigation)
- [Smart Filters](architecture/smart-filters.md) — Graph-based GPU image-processing pipeline
- [Lottie Player](architecture/lottie-player.md) — Lottie animation runtime
- [Inspector](architecture/inspector.md) — React + Fluent UI scene debugging tool
- [Viewer](architecture/viewer.md) — Drop-in web component for 3D model display
- [Node Editors](architecture/node-editors.md) — Visual graph editors (materials, geometry, particles, render graphs)
- [GUI Editor](architecture/gui-editor.md) — Visual GUI layout editor
- [KTX2 Decoder](architecture/ktx2decoder.md) — Compressed texture transcoding
- [Accessibility](architecture/accessibility.md) — DOM twin rendering for screen readers
- [Shared UI Components](architecture/shared-ui-components.md) — Reusable React component library for editors

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
