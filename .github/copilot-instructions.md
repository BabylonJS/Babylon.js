# Babylon.js Copilot Instructions

## Side-Effect Imports for Prototype Augmentations (CRITICAL)

This codebase uses TypeScript **module augmentation** to add methods to class prototypes (`Scene`, `Engine`, `ThinEngine`, `AbstractEngine`) in separate files. TypeScript will NOT flag a missing import — the `declare module` block makes methods type-check globally, but at runtime the prototype is `undefined` unless the augmenting file is imported, causing a crash.

**When writing or reviewing code in `packages/dev/core/src/`, always add a side-effect import for any call to a prototype-augmented method.** For example:

```ts
// Required when calling scene.getPhysicsEngine()
import "../Physics/joinedPhysicsEngineComponent";
```

No named imports are needed — the import just ensures the module executes and the prototype assignment runs. The import path should be relative to the consuming file.

See `.github/instructions/side-effect-imports.instructions.md` for the full table of augmented methods and their required imports.
