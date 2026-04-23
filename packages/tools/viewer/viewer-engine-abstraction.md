# Viewer + Babylon Lite — Exploration & Plan

## Problem Statement

The Viewer currently depends directly on `@babylonjs/core` (`AbstractEngine`, `Scene`, `ArcRotateCamera`, `PBRMaterial`, `LoadAssetContainerAsync`, `Observable`, shadow generators, post-processing pipelines, etc.). We want the Viewer to also work with Babylon Lite — a lightweight, WebGPU-only engine with a different API surface.

## Architecture Decision: IViewer + Separate Implementations

Two approaches were considered:

### ❌ Approach A: ViewerEngine Abstraction (Rejected)

A single `Viewer` class parameterized by a `ViewerEngine` interface that abstracts ~100+ internal Babylon.js APIs. Rejected because:

- **Massive abstraction surface.** The Viewer uses ~100+ internal APIs (engine, scene, camera, loading, animation, shadows, environment, picking, math). Abstracting all of them produces a thick adapter layer.
- **Architecturally incompatible backends.** The two backends differ fundamentally: scene graph vs. flat struct, `Observable` vs. version tracking, `runRenderLoop` vs. `engine.start()`, CPU picking vs. GPU picking. The "abstraction" would end up re-implementing Viewer orchestration logic per-backend anyway — the same duplication as Approach B, but hidden in adapters.
- **Feature asymmetry friction.** ~40% of Viewer code is advanced features Lite won't support (IBL shadows, SSAO, snapshot rendering, scene optimizer, material variants). That's a lot of `if (capabilities.X)` guards scattered through a single class.
- **Lowest common denominator.** Any new Babylon.js feature requires extending the abstraction, constraining what the full Viewer can do.

### ✅ Approach B: IViewer Interface + Separate Implementations (Recommended)

```
                        ┌──────────────────┐
                        │     IViewer      │  (public interface, ~30-40 members)
                        └────────┬─────────┘
                                 │
                ┌────────────────┼────────────────┐
                ▼                                  ▼
┌───────────────────────────┐       ┌───────────────────────────┐
│  Viewer                   │       │  ViewerLite               │
│  (full Babylon.js,        │       │  (Babylon Lite,           │
│   unchanged existing code)│       │   WebGPU-only, subset)    │
└───────────────────────────┘       └───────────────────────────┘
                │                                  │
                └──────────┐      ┌────────────────┘
                           ▼      ▼
                   ┌──────────────────┐
                   │  viewerUtils.ts  │  (shared pure functions:
                   │                  │   camera math, bounding
                   │                  │   box, color parsing, etc.)
                   └──────────────────┘

─────────────────── Element Layer ───────────────────

                  ┌─────────────────────────┐
                  │  ViewerElementBase      │  (abstract, Lit-based,
                  │  (viewerElementBase.ts) │   only depends on IViewer,
                  │                         │   NO Babylon.js core imports)
                  └────────────┬────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                                  ▼
┌───────────────────────────┐       ┌───────────────────────────┐
│  ViewerElement            │       │  ViewerElementLite        │
│  (viewerElement.ts)       │       │  (viewerElementLite.ts)   │
│  + clearColor: Color4     │       │  + clearColor: IColor4Like│
│  + viewerDetails          │       │  (no viewerDetails)       │
└─────────┬─────────────────┘       └─────────┬─────────────────┘
          ▼                                    ▼
┌───────────────────────────┐       ┌───────────────────────────┐
│  HTML3DElement            │       │  HTML3DLiteElement         │
│  <babylon-viewer>         │       │  <babylon-viewer-lite>     │
│  @customElement(...)      │       │  @customElement(...)       │
└───────────────────────────┘       └───────────────────────────┘

─────────────────── Entry Points ───────────────────

  @babylonjs/viewer           @babylonjs/viewer/lite
  (index.ts)                  (lite/index.ts)
  └─ HTML3DElement            └─ HTML3DLiteElement
  └─ Viewer                   └─ ViewerLite
  └─ full Babylon.js          └─ Babylon Lite only
```

**Why this wins:**

- **Public API ≪ internal surface.** `IViewer` is ~30-40 properties/methods. Much less to keep in sync than abstracting ~100+ internal APIs.
- **Each implementation stays idiomatic.** `Viewer` uses Babylon.js APIs directly. `ViewerLite` uses Lite APIs directly. No indirection, no leaky abstractions.
- **Feature asymmetry is natural.** `ViewerLite` simply doesn't implement code paths for unsupported features (IBL shadows, SSAO, snapshot rendering, etc.).
- **Zero regression risk.** The existing `Viewer` class, `ViewerElement`, and `HTML3DElement` stay untouched.
- **Complete bundle isolation.** `@babylonjs/viewer/lite` never imports `Viewer`, `ViewerElement`, or anything from `@babylonjs/core` beyond lightweight utilities.
- **No breaking changes.** `ViewerElement.clearColor` stays as `Color4`. `viewerDetails` stays on `ViewerElement`. `ViewerElementBase` uses `IColor4Like` internally; each subclass wraps as needed.
- **Shared code is pure functions.** Camera orbit math, bounding box computation, auto-rotation logic, color parsing — factored into `viewerUtils.ts`.
- **Easier to add a third backend later.** Each implementation evolves independently.

## Viewer's Babylon.js API Usage — Categorized

Below is the complete inventory of Babylon.js APIs the Viewer uses, grouped into tiers by how fundamental they are to the Viewer's operation.

### Tier 1 — Core (must abstract, used on every frame / every model load)

| Category      | APIs Used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Engine**    | `runRenderLoop`, `stopRenderLoop`, `beginFrame`, `endFrame`, `resize`, `dispose`, `getHardwareScalingLevel`, `setHardwareScalingLevel`, `getRenderWidth`, `getRenderHeight`, `isWebGPU`, `performanceMonitor`, `onResizeObservable`, `onContextLostObservable`                                                                                                                                                                                                                                                                                                                                                            |
| **Scene**     | `new Scene()`, `render`, `isReady`, `dispose`, `clearColor`, `autoClear`, `useRightHandedSystem`, `environmentTexture`, `meshes`, `materials`, `lights`, `cameras`, `defaultMaterial`, `blockMaterialDirtyMechanism`, `imageProcessingConfiguration`, `getEngine`, `getTransformMatrix`, `skipFrustumClipping`, `skipPointerDownPicking`, `skipPointerUpPicking`, `skipPointerMovePicking`, various observables (`onBeforeRenderObservable`, `onAfterRenderObservable`, `onClearColorChangedObservable`, `onPointerObservable`, `onNewCameraAddedObservable`, `onCameraRemovedObservable`, `onAfterAnimationsObservable`) |
| **Camera**    | `ArcRotateCamera` (alpha, beta, radius, target, position, minZ, maxZ, viewport, lowerRadiusLimit, upperRadiusLimit), `attachControl`, `interpolateTo`, `stopInterpolation`, `setTarget`, `getForwardRay`, `getWorldMatrix`, `globalPosition`, `onViewMatrixChangedObservable`, `useAutoRotationBehavior`, `getBehaviorByName("AutoRotation")`, `panningSensibility`, `speed`, `wheelDeltaPercentage`, `useNaturalPinchZoom`, `inputs.attached["keyboard"]`, `update`                                                                                                                                                      |
| **Loading**   | `LoadAssetContainerAsync`, `AssetContainer` (meshes, animationGroups, materials, lights, addAllToScene, dispose), `registerBuiltInLoaders`, material variants controller                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Animation** | `AnimationGroup` (start, pause, play, goToFrame, getCurrentFrame, isPlaying, to, from, speedRatio, onAnimationGroupPlayObservable, onAnimationGroupPauseObservable, onAnimationGroupEndObservable, animatables)                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Math**      | `Vector3`, `Vector2`, `Matrix`, `Color3`, `Color4`, `Viewport`, `Clamp`, `Lerp`, `BuildTuple`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

### Tier 2 — Environment / Lighting / Materials

| Category                 | APIs Used                                                                                                                                                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Environment textures** | `CubeTexture`, `HDRCubeTexture` (load, clone, coordinatesMode, level, rotationY, url, onLoadObservable, dispose)                                                                                                                                                                     |
| **Materials**            | `PBRMaterial`, `BackgroundMaterial`, `ShaderMaterial`, `ImageProcessingConfiguration`, `Texture` (SKYBOX_MODE, CUBIC_MODE)                                                                                                                                                           |
| **Lighting**             | `HemisphericLight`, `DirectionalLight`                                                                                                                                                                                                                                               |
| **Mesh builders**        | `CreateBox`, `CreateDisc`                                                                                                                                                                                                                                                            |
| **Mesh operations**      | `Mesh` (scaling, rotation, position, material, isPickable, infiniteDistance, applyFog, setEnabled, receiveShadows, getClassName, dispose, refreshBoundingInfo, getWorldMatrix, BACKSIDE), `computeMaxExtents`, `RemoveUnreferencedVerticesData`, `GetHotSpotToRef`, `IMeshDataCache` |

### Tier 3 — Advanced / Optional Features

| Category               | APIs Used                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **Shadows (normal)**   | `ShadowGenerator` (addShadowCaster, removeShadowCaster, getShadowMap, setDarkness, etc.) |
| **Shadows (high/IBL)** | `IblShadowsRenderPipeline`, `IblCdfGenerator` (full voxelization pipeline)               |
| **SSAO**               | `SSAO2RenderingPipeline`, `postProcessRenderPipelineManager`                             |
| **Snapshot rendering** | `SnapshotRenderingHelper`                                                                |
| **Scene optimizer**    | `SceneOptimizer`, `SceneOptimizerOptions`, `HardwareScalingOptimization`                 |
| **Picking**            | `scene.pick()`, `scene.pickWithRay()`, `PickingInfo`                                     |
| **Pointer events**     | `PointerEventTypes`, `onPointerObservable`                                               |
| **Observable**         | `Observable`, `Observer` (used extensively for the Viewer's own event system)            |

## Key Differences Between Full Babylon.js and Babylon Lite

| Aspect             | Full Babylon.js                                                   | Babylon Lite                                                         |
| ------------------ | ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| Rendering backends | WebGL + WebGPU                                                    | WebGPU only                                                          |
| Scene              | Deep scene graph with `Node` hierarchy                            | Flat `SceneContext` struct                                           |
| Render loop        | `engine.runRenderLoop(fn)`                                        | `engine.start(scene)` (owns the loop)                                |
| Materials          | 30+ types                                                         | Standard + PBR only                                                  |
| Camera             | 8+ types with behavior system                                     | ArcRotate + Free (plain data objects)                                |
| Loaders            | `LoadAssetContainerAsync` → `AssetContainer`                      | `loadGltf()` / `loadBabylon()` → `LoaderResult`                      |
| Animation          | `AnimationGroup` (full Observable system)                         | `AnimationGroup` (simpler: play/pause/stop/goToFrame)                |
| Observable system  | `Observable<T>` with `Observer` handles                           | None (version-based dirty tracking)                                  |
| Post-processing    | SSAO, tone mapping, IBL shadows pipelines                         | None (shader composition only)                                       |
| Shadow generators  | `ShadowGenerator`, `IblShadowsRenderPipeline`                     | `createShadowGenerator`, `createPcfShadowGenerator`                  |
| Image processing   | `ImageProcessingConfiguration` (tone mapping, contrast, exposure) | `ImageProcessingConfig` (exposure, contrast, toneMappingEnabled)     |
| Picking            | CPU ray casting (`scene.pick`, `pickWithRay`)                     | GPU-based picker                                                     |
| Math               | `Vector3`, `Matrix`, `Color3`, `Color4` (class-based)             | `Vec3`, `Mat4`, `Color3` (plain objects / `Float32Array`)            |
| Environment        | `CubeTexture` / `HDRCubeTexture` + `environmentTexture` on Scene  | `loadEnvironment()` / `loadHdrEnvironment()` → `EnvironmentTextures` |

## Proposed IViewer Interface

The `IViewer` interface is scoped to **exactly the Viewer API subset that `viewerElement.ts` uses**. It uses the same names and signatures as the existing `Viewer` class wherever possible, so `Viewer implements IViewer` requires minimal code changes. Members that `viewerElement.ts` never touches (`showDebugLogs`, `getHotSpotToRef`, `shadowConfig`) are **not** on the interface — they remain as `Viewer`-only API.

```typescript
/**
 * The subset of the Viewer API that ViewerElement depends on.
 * Both the full Babylon.js Viewer and ViewerLite implement this contract.
 */
export interface IViewer extends IDisposable {
    // ── Events (Observable from core, both impls can import it) ──
    readonly onEnvironmentChanged: Observable<void>;
    readonly onEnvironmentConfigurationChanged: Observable<void>;
    readonly onEnvironmentError: Observable<unknown>;
    readonly onShadowsConfigurationChanged: Observable<void>;
    readonly onPostProcessingChanged: Observable<void>;
    readonly onModelChanged: Observable<Nullable<string | File | ArrayBufferView>>;
    readonly onModelError: Observable<unknown>;
    readonly onLoadingProgressChanged: Observable<void>;
    readonly onCameraAutoOrbitChanged: Observable<void>;
    readonly onSelectedAnimationChanged: Observable<void>;
    readonly onAnimationSpeedChanged: Observable<void>;
    readonly onIsAnimationPlayingChanged: Observable<void>;
    readonly onAnimationProgressChanged: Observable<void>;
    readonly onSelectedMaterialVariantChanged: Observable<void>;
    readonly onHotSpotsChanged: Observable<void>;
    readonly onCamerasAsHotSpotsChanged: Observable<void>;
    readonly onAfterRenderObservable: Observable<void>;        // NEW — see below
    readonly onClearColorChanged: Observable<void>;            // NEW — see below

    // ── Clear Color (NEW — moved from Scene to IViewer) ──
    clearColor: IColor4Like;

    // ── Camera ──
    cameraAutoOrbit: Partial<Readonly<CameraAutoOrbit>>;
    resetCamera(reframe?: boolean): void;
    updateCamera(pose: { alpha?: number; beta?: number; radius?: number;
                         targetX?: number; targetY?: number; targetZ?: number }): void;

    // ── Environment ──
    environmentConfig: Partial<Readonly<EnvironmentParams>>;
    loadEnvironment(url: string, options?: LoadEnvironmentOptions, abortSignal?: AbortSignal): Promise<void>;
    resetEnvironment(options?: EnvironmentOptions, abortSignal?: AbortSignal): Promise<void>;

    // ── Post Processing ──
    postProcessing: Partial<Readonly<PostProcessing>>;

    // ── Shadows ──
    readonly shadowConfig: Readonly<ShadowParams>;
    updateShadows(value: Partial<Readonly<ShadowParams>>): Promise<void>;

    // ── Model Loading ──
    loadModel(source: string | File | ArrayBufferView, options?: ViewerLoadModelOptions, abortSignal?: AbortSignal): Promise<void>;
    resetModel(abortSignal?: AbortSignal): Promise<void>;

    // ── Animation ──
    readonly animations: readonly string[];
    selectedAnimation: number;
    animationSpeed: number;
    readonly isAnimationPlaying: boolean;
    animationProgress: number;
    toggleAnimation(): void;
    playAnimation(): void;
    pauseAnimation(): Promise<void>;

    // ── Material Variants ──
    readonly materialVariants: readonly string[];
    selectedMaterialVariant: Nullable<string>;

    // ── Hot Spots ──
    hotSpots: Record<string, HotSpot>;
    camerasAsHotSpots: boolean;
    queryHotSpot(name: string, result: ViewerHotSpotResult): boolean;
    focusHotSpot(name: string): boolean;

    // ── Loading progress ──
    readonly isModelLoaded: boolean;
    readonly loadingProgress: boolean | number;

    // ── Reset ──
    reset(...flags: ResetFlag[]): void;

    // ── Dispose ──
    dispose(): void;
}
```

### Members NOT used by ViewerElement (Viewer-only API)

These exist on `Viewer` but are not called anywhere in `viewerElement.ts`:

- `showDebugLogs`
- `getHotSpotToRef` (ViewerElement uses `queryHotSpot` and `focusHotSpot` instead)

### New members needed on IViewer (not currently on Viewer)

`viewerElement.ts` currently reaches through `ViewerDetails` to access the Babylon.js `Scene` directly for two things. These need to become first-class IViewer members:

| viewerElement usage today                     | Proposed IViewer member                              | Notes                                                                             |
| --------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `details.scene.clearColor` (get/set `Color4`) | `clearColor: IColor4Like`                            | Uses `IColor4Like` (`{ r, g, b, a }`). Viewer wraps ↔ `Color4` internally.       |
| `details.scene.onClearColorChangedObservable`  | `readonly onClearColorChanged: Observable<void>`     | Viewer forwards from `scene.onClearColorChangedObservable`.                       |
| `details.scene.onAfterRenderCameraObservable`  | `readonly onAfterRenderObservable: Observable<void>` | Used to fire `"viewerrender"` custom events.                                      |

These are small additions to `Viewer` that wrap existing Scene internals — no behavioral change.

### clearColor — No Breaking Change

With the `ViewerElementBase` / `ViewerElement` split, clearColor is handled cleanly at each layer:

- **`ViewerElementBase`**: Uses `IColor4Like` (`{ r, g, b, a }`) internally for the property binding to IViewer. The `parseColor()` helper returns a plain `{ r, g, b, a }` object.
- **`ViewerElement`** (extends `ViewerElementBase`): Overrides `clearColor` as `Nullable<Color4>` — **no breaking change**. Wraps `Color4` ↔ `IColor4Like` at the boundary.
- **`ViewerElementLite`** (extends `ViewerElementBase`): Uses `Nullable<IColor4Like>` directly. No `Color4` import.

### ViewerDetails — On ViewerElement Only

`viewerDetails` stays on `ViewerElement` (not `ViewerElementBase`). It exposes the full `ViewerDetails` type (`scene`, `camera`, `model`, `suspendRendering`, `markSceneMutated`, `pick`, `isIdle`).

`ViewerElementLite` does not have a `viewerDetails` property. ViewerDetail-like APIs can be added to the Lite IViewer implementation later as needed.

For ViewerElementBase's one internal use of `details.model != null` (line 1058 — toolbar visibility), this check moves to `viewer.isModelLoaded` on the IViewer API.

### ViewerElementBase — What It Contains

`ViewerElementBase` is the abstract Lit-based base class containing all shared UI logic. It depends only on IViewer and lightweight utilities — no Babylon.js core imports (except `Observable`, `Nullable` as types, and pure utilities like `AsyncLock`, `Deferred`, `AbortError`, `Logger`).

It contains:
- All Lit HTML template rendering (toolbar, animation controls, progress bar, etc.)
- All `@property` declarations that map to IViewer (everything except `clearColor`, `viewerDetails`, and `engine`)
- All property bindings (`_createPropertyBinding` infrastructure)
- All IViewer event subscriptions
- The `_createViewer` abstract method (each subclass provides its own factory)
- CSS styles

It does **not** contain:
- `clearColor` property (each subclass declares its own with appropriate type)
- `viewerDetails` property (ViewerElement-only)
- `engine` property (ViewerElement-only — chooses WebGL vs WebGPU; ViewerElementLite always uses Lite's WebGPU-only engine)
- Any direct `Scene` / `Camera` / `Color4` imports

### Changes to `viewerElement.ts`

The existing `viewerElement.ts` is refactored into:

1. **`viewerElementBase.ts`** (new): The abstract `ViewerElementBase` class with all shared UI logic. Imports only `IViewer`, viewer-defined types, and lightweight core utilities.
2. **`viewerElement.ts`** (existing, slimmed): `ViewerElement extends ViewerElementBase`. Adds `clearColor: Nullable<Color4>`, `viewerDetails`, and the `_createViewer` implementation that uses `CreateViewerForCanvas`. `HTML3DElement` and `ConfigureCustomViewerElement` stay here.
3. **`viewerElementLite.ts`** (new): `ViewerElementLite extends ViewerElementBase`. Adds `clearColor: Nullable<IColor4Like>`, and the `_createViewer` implementation for Lite. `HTML3DLiteElement` with `@customElement("babylon-viewer-lite")` lives here.

### Entry Points / Bundle Isolation

Two separate entry points ensure complete bundle isolation:

| Entry point | Custom element | Viewer class | Dependencies |
|---|---|---|---|
| `@babylonjs/viewer` (`index.ts`) | `<babylon-viewer>` via `HTML3DElement` | `Viewer` | Full `@babylonjs/core` |
| `@babylonjs/viewer/lite` (`lite/index.ts`) | `<babylon-viewer-lite>` via `HTML3DLiteElement` | `ViewerLite` | Babylon Lite only |

The `@customElement` decorator triggers `customElements.define()` as a module-level side effect. By placing each in a separate entry point, loading `@babylonjs/viewer/lite` never pulls in `Viewer` or `@babylonjs/core`.

The package.json `exports` field:
```json
{
  "exports": {
    ".": "./src/index.ts",
    "./lite": "./src/lite/index.ts"
  }
}
```

### `viewerFactory.ts` — Unchanged for Lite

Since Lite has its own entry point and element, `viewerFactory.ts` does not need an `engine: "lite"` option. `CreateViewerForCanvas` stays as-is, creating only full Babylon.js viewers. A separate `CreateViewerLiteForCanvas` factory (or equivalent) lives in the Lite entry point.

## Shared Utility Code (`viewerUtils.ts`)

The following logic is currently embedded in `viewer.ts` and should be extracted into pure functions that both implementations can share:

| Utility                                          | Current Location       | Description                                         |
| ------------------------------------------------ | ---------------------- | --------------------------------------------------- |
| `computeModelsMaxExtents`                        | viewer.ts:301-305      | Compute bounding extents across models + animations |
| `reduceMeshesExtendsToBoundingInfo`              | viewer.ts:307-325      | Reduce extents to min/max/size/center               |
| `adjustLightTargetDirection`                     | viewer.ts:332-349      | Ensure shadow light direction points down           |
| Camera orbit math (alpha/beta/radius ↔ position) | viewer.ts:~3097-3190   | Camera framing, radius limits, minZ/maxZ            |
| `parseColor`                                     | viewerElement.ts:45-64 | CSS color string → `[r, g, b, a]`                   |
| `WhenNext`                                       | viewer.ts:79-97        | Promise wrapper for observable + abort signal       |
| `observePromise`                                 | viewer.ts:363-374      | Fire-and-forget async with error logging            |
| Auto-rotation state machine                      | viewer.ts:1100-1130    | Enable/disable/speed/delay logic                    |
| Animation progress math                          | viewer.ts:~1520-1540   | Frame ↔ progress normalization                      |

These are pure functions or small state machines with no Babylon.js or Lite dependencies — they operate on plain numbers, arrays, and tuples.

## Feature Gap Analysis for Lite Backend

Features the full Viewer supports that Babylon Lite does not currently have. In the IViewer approach, `ViewerLite` simply omits or no-ops these features rather than needing capability flags.

| Feature                  | Viewer Usage                     | Lite Status                                                              | ViewerLite Strategy                                                                                       |
| ------------------------ | -------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| **SSAO**                 | Optional post-processing         | ❌ Not supported                                                          | `ViewerLite` ignores SSAO settings (no-op setters)                                                        |
| **IBL Shadows (high)**   | Voxelization shadow pipeline     | ❌ Not supported                                                          | `ViewerLite` only supports "none" and "normal" shadow quality                                             |
| **Normal shadows**       | Standard shadow maps             | ✅ `createShadowGenerator`                                                | Implement in `ViewerLite`                                                                                 |
| **Snapshot rendering**   | WebGPU optimization              | ❌ Not applicable                                                         | N/A — internal to `Viewer`                                                                                |
| **Scene optimizer**      | Auto quality scaling             | ❌ Not supported                                                          | N/A — internal to `Viewer`                                                                                |
| **CPU picking**          | Double-tap reframing, hot spots  | ❌ (GPU picking only)                                                     | Use Lite's GPU picker, or skip hot spot features initially                                                |
| **Image processing**     | Tone mapping, contrast, exposure | ✅ Partial (`toneMappingEnabled`, `exposure`, `contrast`)                 | Implement — tone mapping type selection may be limited                                                    |
| **Skybox**               | Environment background           | ✅ `loadSkybox()`                                                         | Implement in `ViewerLite`                                                                                 |
| **Environment IBL**      | Environment lighting             | ✅ `loadEnvironment()` / `loadHdrEnvironment()`                           | Implement in `ViewerLite`                                                                                 |
| **Auto-rotation**        | Camera auto-orbit                | ❌ No behavior system                                                     | Implement in `ViewerLite` using shared auto-rotation logic from `viewerUtils.ts` + Lite's inertia offsets |
| **Camera interpolation** | Smooth camera transitions        | ❌ No `interpolateTo`                                                     | Implement in `ViewerLite` using shared interpolation math                                                 |
| **Material variants**    | `KHR_materials_variants`         | ❌ Not in Lite loaders                                                    | `ViewerLite.materialVariants` returns empty array initially                                               |
| **Observable**           | Viewer's own event system        | ✅ Not a gap — both impls import `Observable` from `core/Misc/observable` |

### Note on Observable

The Viewer's own `Observable` instances (`onModelChanged`, `onEnvironmentChanged`, etc.) are created by the Viewer itself and can import `Observable` from `core/Misc/observable` in both implementations. This is not a gap.

The full `Viewer` also subscribes to observables on engine/scene/camera objects (e.g. `scene.onPointerObservable`, `camera.onViewMatrixChangedObservable`). Since `ViewerLite` is a separate implementation, it handles the equivalent behavior using whatever mechanism Lite provides (version tracking, canvas events, render loop hooks, etc.) — no abstraction layer needed.

## Migration Strategy

### Phase 1: Extract IViewer + Shared Utilities

1. Define `IViewer` interface in `packages/tools/viewer/src/viewerInterface.ts` capturing the ViewerElement-facing API surface.
2. Define `ViewerLoadModelOptions` (backend-agnostic subset of `LoadModelOptions`).
3. Add new IViewer members to `Viewer`: `clearColor` (as `IColor4Like`, wrapping `scene.clearColor`), `onClearColorChanged`, `onAfterRenderObservable`, `isModelLoaded`.
4. Make existing `Viewer` class implement `IViewer`.
5. Extract shared utility functions into `packages/tools/viewer/src/viewerUtils.ts` (bounding box math, camera orbit math, color parsing, animation progress, auto-rotation state machine).
6. **All existing tests and behavior must continue to pass unchanged.**

### Phase 2: Factor out ViewerElementBase

1. Create `viewerElementBase.ts` with the abstract `ViewerElementBase` class — all shared Lit UI logic, property bindings, toolbar, animation controls, etc.
2. `ViewerElementBase` depends only on `IViewer`, viewer-defined types, and lightweight core utilities (`AsyncLock`, `Deferred`, `AbortError`, `Logger`, `Observable`, `Nullable`).
3. `ViewerElementBase` uses `IColor4Like` internally for `clearColor` binding.
4. `ViewerElementBase` uses `viewer.isModelLoaded` instead of `details.model != null`.
5. `ViewerElementBase` uses `viewer.onAfterRenderObservable` instead of `details.scene.onAfterRenderCameraObservable`.
6. `ViewerElementBase` uses `viewer.clearColor` / `viewer.onClearColorChanged` instead of `details.scene.clearColor` / `details.scene.onClearColorChangedObservable`.
7. Slim down `viewerElement.ts`: `ViewerElement extends ViewerElementBase`, adds `clearColor: Nullable<Color4>` (wrapping base's `IColor4Like`), `viewerDetails`, and `_createViewer` using `CreateViewerForCanvas`. `HTML3DElement` and `ConfigureCustomViewerElement` stay here.
8. **All existing tests and behavior must continue to pass unchanged.**

### Phase 3: Build ViewerLite + Lite Entry Point

1. Create `packages/tools/viewer/src/viewerLite.ts` implementing `IViewer` using Babylon Lite APIs.
2. Start with core subset: render loop, camera (arc-rotate), model loading (glTF), environment (IBL + skybox).
3. Use shared utilities from `viewerUtils.ts` for camera math, bounding boxes, auto-rotation, etc.
4. Implement camera interpolation and auto-rotation using shared logic + Lite's inertia system.
5. No-op or return defaults for unsupported features (SSAO, IBL shadows, material variants).
6. Create `viewerElementLite.ts`: `ViewerElementLite extends ViewerElementBase`, adds `clearColor: Nullable<IColor4Like>`, `_createViewer` for Lite. `HTML3DLiteElement` with `@customElement("babylon-viewer-lite")`.
7. Create `lite/index.ts` entry point exporting `HTML3DLiteElement`, `ViewerLite`, etc.
8. Add `"./lite"` to package.json `exports`.

### Phase 4: Test + Polish

1. Add tests for `ViewerLite` loading a glTF model, environment, basic camera interaction.
2. Test `<babylon-viewer-lite>` element end-to-end.
3. Verify bundle size difference between `@babylonjs/viewer` and `@babylonjs/viewer/lite`.
4. Verify `@babylonjs/viewer` has zero regressions.

## Open Questions

1. **Where does `ViewerLite` live?** In `packages/tools/viewer/src/viewerLite.ts` alongside `Viewer`, or in its own package? If Babylon Lite is in a separate repo, we need to decide on the dependency graph.
2. **Feature degradation UX**: When `ViewerLite` doesn't support a feature (e.g. SSAO, IBL shadows), should the element reflect this to users (e.g. ignore the attribute silently, log a warning, etc.)?
3. **Scope of first milestone**: Should Phase 3 aim for the full `IViewer` contract, or a minimal "model loading + camera + environment" subset with no-op stubs for the rest?
4. **`LoadModelOptions`**: The existing `LoadModelOptions` is aliased to `LoadAssetContainerOptions` from `@babylonjs/core`. IViewer uses a narrower `ViewerLoadModelOptions` (e.g. just `{ pluginExtension }`) that both backends can accept. ViewerElementBase only passes `{ pluginExtension }` today, so this covers its actual usage.

## Todos

- [ ] Define `IViewer` interface in `viewerInterface.ts`
- [ ] Define `ViewerLoadModelOptions` type
- [ ] Add `clearColor`, `onClearColorChanged`, `onAfterRenderObservable`, `isModelLoaded` to `Viewer`
- [ ] Make `Viewer` implement `IViewer`
- [ ] Extract shared utility functions into `viewerUtils.ts`
- [ ] Create `viewerElementBase.ts` with shared UI logic
- [ ] Refactor `viewerElement.ts` to extend `ViewerElementBase`
- [ ] Create `viewerElementLite.ts` with `HTML3DLiteElement`
- [ ] Build `ViewerLite` implementing `IViewer` with Babylon Lite
- [ ] Create `lite/index.ts` entry point
- [ ] Add `"./lite"` export to package.json
- [ ] Add tests for `ViewerLite`
- [ ] Test `<babylon-viewer-lite>` end-to-end
- [ ] Verify bundle isolation (no cross-contamination between entry points)
