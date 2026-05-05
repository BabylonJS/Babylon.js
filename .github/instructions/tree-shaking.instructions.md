---
applyTo: "packages/dev/core/src/**/*.ts"
---

# Tree-Shaking File Architecture

The `@babylonjs/core` package uses a **three-file split** pattern so bundlers can tree-shake unused code. Every source file in `packages/dev/core/src/` follows this convention.

## The Three Files

| File           | Purpose                                                                                                                               | Side effects?                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `foo.pure.ts`  | All logic, classes, functions, and exports. Imports only from other `.pure.ts` files.                                                 | **No** — must be fully tree-shakeable                                   |
| `foo.ts`       | Thin backward-compatible wrapper. Re-exports everything from `foo.pure.ts`, then calls the registration function to run side effects. | **Yes** — registers classes, augments prototypes, writes to ShaderStore |
| `foo.types.ts` | `declare module` augmentations (types only, zero runtime bytes). Exported from `foo.pure.ts`.                                         | **No**                                                                  |

Not every file needs all three. `.types.ts` is only needed when the file augments another class's interface (e.g., adding methods to `Scene`). Files with no side effects at all may only have a `.pure.ts`.

## Creating a New File

When adding a new class or module to `packages/dev/core/src/`:

### 1. Create `myModule.pure.ts` — the pure implementation

```ts
/** This file must only contain pure code and pure imports */

// If this file augments another class, re-export the types
export * from "./myModule.types";

// Import only from .pure.ts files
import { Scene } from "../scene.pure";
import { SomeHelper } from "../Misc/someHelper.pure";

export class MyModule {
    // ... all logic here
}

// Registration function — idempotent, called by the wrapper
let _registered = false;
export function registerMyModule() {
    if (_registered) return;
    _registered = true;

    // Side effects go here:
    // - RegisterClass("BABYLON.MyModule", MyModule)
    // - Scene.prototype.someMethod = function() { ... }
    // - ShaderStore writes
}
```

### 2. Create `myModule.ts` — the thin wrapper

```ts
export * from "./myModule.pure";

import { registerMyModule } from "./myModule.pure";
registerMyModule();
```

That's it. The wrapper is always exactly these 3 lines (plus the registration call).

### 3. Create `myModule.types.ts` (only if augmenting)

Only needed if `registerMyModule()` adds methods to `Scene`, `Engine`, or another class via prototype assignment:

```ts
import { type MyModule } from "./myModule.pure";

declare module "../scene" {
    export interface Scene {
        myMethod(): MyModule;
    }
}
```

## Rules

1. **`.pure.ts` files must not import from non-pure files.** Import from `foo.pure` or `foo.types`, never from bare `foo`. The ESLint rule `no-side-effect-imports-in-pure` enforces this as an **error**.

2. **Top-level calls in `.pure.ts` must be annotated `/*#__PURE__*/`.** The ESLint rule `require-pure-annotation` enforces this. Example:

    ```ts
    const _result = /*#__PURE__*/ someFunction();
    ```

3. **Registration functions must be idempotent.** Guard with a `_registered` flag so multiple calls are safe.

4. **Per-directory `pure.ts` barrels** re-export all `.pure.ts` files in the directory. After adding a new `.pure.ts` file, run tooling to regenerate barrels.

## Tooling

After adding, renaming, or removing files, run these scripts to keep everything in sync:

| Command                              | What it does                                                   |
| ------------------------------------ | -------------------------------------------------------------- |
| `npm run generate:pure-barrels`      | Regenerates per-directory `pure.ts` barrel files               |
| `npm run generate:side-effect-stubs` | Creates missing `.ts` wrappers for `.pure.ts` files            |
| `npm run inject:pure-annotations`    | Adds missing `/*#__PURE__*/` annotations                       |
| `npm run audit:side-effects`         | Validates the side-effects manifest against actual files       |
| `npm run check:manifest-drift`       | Checks `package.json` `sideEffects` field matches the manifest |
| `npm run test:treeshaking`           | Bundle smoke tests — verifies tree-shaking actually works      |

Run the full verification pipeline:

```sh
npm run audit:side-effects && npm run check:manifest-drift && npm run test:treeshaking
```

## Modifying an Existing File

- **Adding logic?** Edit the `.pure.ts` file, not the `.ts` wrapper.
- **Adding a prototype augmentation?** Add the type to `.types.ts`, add the prototype assignment inside the `register*()` function in `.pure.ts`.
- **Adding a side effect (RegisterClass, ShaderStore write)?** Put it inside the `register*()` function in `.pure.ts`.
- **Never add side effects directly at module scope in `.pure.ts`** — always inside the registration function.
