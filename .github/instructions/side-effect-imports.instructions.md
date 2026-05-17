---
applyTo: "packages/dev/core/src/**/*.ts"
---

# Side-Effect Imports for Prototype Augmentations

This codebase uses TypeScript **module augmentation** to add methods to class prototypes (`Scene`, `Engine`, `ThinEngine`, `AbstractEngine`) in separate files. These augmenting files both `declare module` (adding the type) AND assign the implementation to the prototype.

**The critical bug pattern to watch for:**

TypeScript will NOT flag a missing import for these augmented methods. The `declare module` type declaration makes the method visible to the type checker globally, but the actual runtime implementation is only loaded if the augmenting file is imported somewhere in the dependency chain. At runtime, calling an augmented method without importing its source file causes a crash because the prototype property is `undefined`.

**When reviewing code, flag any call to a prototype-augmented method on Scene, Engine, ThinEngine, or AbstractEngine where the augmenting module is not imported in the same file.**

## How to identify an augmented method

An augmented method is defined in a **separate file** from the base class and uses this two-part pattern:

1. A `declare module` block extending the class interface:
    ```ts
    declare module "../scene" {
        export interface Scene {
            enableDepthRenderer(...): DepthRenderer;
        }
    }
    ```
2. A prototype assignment adding the runtime implementation:
    ```ts
    Scene.prototype.enableDepthRenderer = function (...) { ... };
    ```

Any method added this way **requires a side-effect import** of the file where the prototype assignment lives.

## Common Scene augmented methods

| Method                                                                                                                            | Required Import                                              |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `scene.enableDepthRenderer()` / `scene.disableDepthRenderer()`                                                                    | `import "../Rendering/depthRendererSceneComponent"`          |
| `scene.enableGeometryBufferRenderer()` / `scene.disableGeometryBufferRenderer()`                                                  | `import "../Rendering/geometryBufferRendererSceneComponent"` |
| `scene.enablePhysics()` / `scene.disablePhysicsEngine()` / `scene.getPhysicsEngine()`                                             | `import "../Physics/joinedPhysicsEngineComponent"`           |
| `scene.createDefaultCamera()` / `scene.createDefaultLight()` / `scene.createDefaultEnvironment()` / `scene.createDefaultSkybox()` | `import "../Helpers/sceneHelpers"`                           |
| `scene.pick()` / `scene.multiPick()` / `scene.pickWithRay()` / `scene.createPickingRayToRef()`                                    | `import "../Culling/ray"`                                    |
| `scene.getBoundingBoxRenderer()`                                                                                                  | `import "../Rendering/boundingBoxRenderer"`                  |
| `scene.getSoundByName()`                                                                                                          | `import "../Audio/audioSceneComponent"`                      |
| `scene.pickSprite()` / `scene.multiPickSprite()`                                                                                  | `import "../Sprites/spriteSceneComponent"`                   |

## Common Engine augmented methods

| Method                                                                       | Required Import                                           |
| ---------------------------------------------------------------------------- | --------------------------------------------------------- |
| `engine.createMultiviewRenderTargetTexture()`                                | `import "../Engines/Extensions/engine.multiview"`         |
| `engine.createTransformFeedback()` / `engine.bindTransformFeedback()`        | `import "../Engines/Extensions/engine.transformFeedback"` |
| `engine.setCompressedTextureExclusions()` / `engine.setTextureFormatToUse()` | `import "../Engines/Extensions/engine.textureSelector"`   |

## Common ThinEngine augmented methods

| Method                                                            | Required Import                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------ |
| `engine.updateVideoTexture()`                                     | `import "../Engines/Extensions/engine.videoTexture"`   |
| `engine.createUniformBuffer()` / `engine.updateUniformBuffer()`   | `import "../Engines/Extensions/engine.uniformBuffer"`  |
| `engine.createMultipleRenderTarget()`                             | `import "../Engines/Extensions/engine.multiRender"`    |
| `engine.createDynamicTexture()` / `engine.updateDynamicTexture()` | `import "../Engines/Extensions/engine.dynamicTexture"` |
| `engine.createRenderTargetTexture()`                              | `import "../Engines/Extensions/engine.renderTarget"`   |
| `engine.createComputeEffect()` / `engine.computeDispatch()`       | `import "../Engines/Extensions/engine.computeShader"`  |
| `engine.createRawTexture()` / `engine.updateRawTexture()`         | `import "../Engines/Extensions/engine.rawTexture"`     |
| `engine.createCubeTexture()`                                      | `import "../Engines/Extensions/engine.cubeTexture"`    |
| `engine._readTexturePixels()`                                     | `import "../Engines/Extensions/engine.readTexture"`    |
| `engine.createQuery()` / `engine.beginOcclusionQuery()`           | `import "../Engines/Extensions/engine.query"`          |

## Common AbstractEngine augmented methods

| Method                                                      | Required Import                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------------------- |
| `engine.getStencilBuffer()` / `engine.setStencilFunction()` | `import "../Engines/AbstractEngine/abstractEngine.stencil"`       |
| `engine.getDepthFunction()` / `engine.setDepthWrite()`      | `import "../Engines/AbstractEngine/abstractEngine.states"`        |
| `engine.displayLoadingUI()` / `engine.hideLoadingUI()`      | `import "../Engines/AbstractEngine/abstractEngine.loadingScreen"` |
| `engine.registerView()` / `engine.unRegisterView()`         | `import "../Engines/AbstractEngine/abstractEngine.views"`         |
| `engine.createRenderPassId()`                               | `import "../Engines/AbstractEngine/abstractEngine.renderPass"`    |
| `engine.createDepthStencilTexture()`                        | `import "../Engines/AbstractEngine/abstractEngine.texture"`       |

## How to fix

Add a side-effect import at the top of the consuming file:

```ts
import "../Rendering/depthRendererSceneComponent";
```

The import path should be relative to the consuming file. No named imports are needed — the import just ensures the module executes and the prototype assignment runs.

### Alternative: Pure path with registration functions (Phase 9)

Each side-effect file now has a three-file split. This applies to files that actually own legacy side effects; do not create this split for side-effect-free modules or generated shader files.

- **`component.types.ts`** — `declare module` augmentation (types only, zero runtime bytes)
- **`component.pure.ts`** — registration function + pure code
- **`component.ts`** — backward-compatible wrapper that exports `component.pure.ts` and `component.types.ts`, then calls the registration function

When importing from `.pure.ts` files (or the `pure.ts` barrel), you must **explicitly call the registration function** for the augmented methods to work at runtime:

```ts
// Pure path — explicit registration
import { registerDepthRendererSceneComponent } from "../Rendering/depthRendererSceneComponent.pure";
registerDepthRendererSceneComponent();
scene.enableDepthRenderer(); // ✅ runtime works

// Legacy path — backward compatible (unchanged)
import "../Rendering/depthRendererSceneComponent";
scene.enableDepthRenderer(); // ✅ runtime works
```

Registration functions are:

- **Idempotent** — safe to call multiple times (guarded by `_registered` flag)
- **Tree-shakeable** — if you import `.pure.ts` but don't call the function, bundlers can eliminate it
- **Discoverable** — all named `registerXxx`, so typing `register` in your IDE lists them all

## Why TypeScript misses this

The `declare module` block in the augmenting file extends the interface globally within the TypeScript project. This means `scene.enableDepthRenderer()` type-checks successfully even without importing `depthRendererSceneComponent`. But at runtime, `Scene.prototype.enableDepthRenderer` is `undefined` unless the module was loaded, causing a crash like `TypeError: this._scene.enableDepthRenderer is not a function`.
