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
```

**Why this wins:**

- **Public API ≪ internal surface.** `IViewer` is ~30-40 properties/methods (`loadModel`, `cameraOrbit`, `toneMapping`, etc.). Much less to keep in sync than abstracting ~100+ internal APIs.
- **Each implementation stays idiomatic.** `Viewer` uses Babylon.js APIs directly. `ViewerLite` uses Lite APIs directly. No indirection, no leaky abstractions.
- **Feature asymmetry is natural.** `ViewerLite` simply doesn't implement code paths for unsupported features (IBL shadows, SSAO, snapshot rendering, etc.).
- **Zero regression risk.** The existing `Viewer` class stays untouched.
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

The `IViewer` interface captures the Viewer's **public API surface** — the contract that `viewerElement.ts`, `viewerFactory.ts`, and external consumers depend on. Both `Viewer` and `ViewerLite` implement it.

```typescript
/**
 * Public interface for the Viewer. Both the full Babylon.js Viewer
 * and ViewerLite implement this contract.
 */
export interface IViewer extends IDisposable {
    // ── Events (Observable from core, both impls can use it) ──
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

    // ── Camera ──
    cameraAutoOrbit: Readonly<CameraAutoOrbit>;
    cameraOrbit: CameraOrbit;
    cameraTarget: CameraTarget;
    resetCamera(interpolate?: boolean): void;

    // ── Model Loading ──
    loadModel(source: string | File | ArrayBufferView, options?: LoadModelOptions, abortSignal?: AbortSignal): Promise<void>;
    resetModel(abortSignal?: AbortSignal): Promise<void>;

    // ── Environment ──
    loadEnvironment(url: string, options?: LoadEnvironmentOptions): Promise<void>;
    resetEnvironment(options?: EnvironmentOptions): Promise<void>;
    environmentIntensity: number;
    environmentRotation: number;
    skyboxBlur: number;

    // ── Animation ──
    readonly animationNames: readonly string[];
    selectedAnimation: number;
    animationSpeed: number;
    readonly isAnimationPlaying: boolean;
    animationProgress: number;
    playAnimation(): void;
    pauseAnimation(): void;

    // ── Post Processing ──
    toneMapping: ToneMapping;
    contrast: number;
    exposure: number;

    // ── Material Variants ──
    readonly materialVariants: readonly string[];
    selectedMaterialVariant: Nullable<string>;

    // ── Shadows ──
    shadowQuality: ShadowQuality;

    // ── Hot Spots ──
    hotSpots: Record<string, HotSpot>;
    getHotSpotToRef(name: string, result: ViewerHotSpotResult): boolean;

    // ── Loading progress ──
    readonly loadingProgress: Nullable<number>;

    // ── Scene ──
    clearColor: readonly [r: number, g: number, b: number, a: number];

    // ── Dispose ──
    dispose(): void;
}
```

### What `viewerElement.ts` and `viewerFactory.ts` need to change

- **`viewerElement.ts`**: Currently types its internal viewer as `Viewer`. Change to `IViewer`. All property bindings and method calls already go through the public API, so this is mostly a type change.
- **`viewerFactory.ts`**: `CreateViewerForCanvas` currently creates a `Viewer` directly. Add a `"lite"` engine option that creates a `ViewerLite` instead. Return type becomes `Promise<IViewer>`.

```typescript
// viewerFactory.ts — sketch
export type CanvasViewerOptions = ViewerOptions & {
    onFaulted?: (error: Error) => void;
} & (
    | ({ engine?: undefined } & AbstractEngineOptions)
    | ({ engine: "WebGL" } & EngineOptions)
    | ({ engine: "WebGPU" } & WebGPUEngineOptions)
    | { engine: "lite" }
);

export async function CreateViewerForCanvas(
    canvas: HTMLCanvasElement,
    options?: CanvasViewerOptions
): Promise<IViewer> {
    if (options?.engine === "lite") {
        // Dynamic import to keep Lite out of the main bundle
        const { createLiteViewer } = await import("./viewerLite");
        return createLiteViewer(canvas, options);
    }
    // ... existing Babylon.js engine creation logic ...
}
```

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

1. Define `IViewer` interface in `packages/tools/viewer/src/viewerInterface.ts` capturing the public API surface.
2. Extract shared utility functions into `packages/tools/viewer/src/viewerUtils.ts` (bounding box math, camera orbit math, color parsing, animation progress, auto-rotation state machine).
3. Make existing `Viewer` class implement `IViewer`.
4. **All existing tests and behavior must continue to pass unchanged.**

### Phase 2: Update viewerElement + viewerFactory

1. Change `viewerElement.ts` to work against `IViewer` instead of `Viewer`.
2. Update `viewerFactory.ts` to return `IViewer` and add an `engine: "lite"` option that dynamically imports `ViewerLite`.
3. Existing code paths remain unchanged — `Viewer` is still the default.

### Phase 3: Build ViewerLite

1. Create `packages/tools/viewer/src/viewerLite.ts` implementing `IViewer` using Babylon Lite APIs.
2. Start with core subset: render loop, camera (arc-rotate), model loading (glTF), environment (IBL + skybox).
3. Use shared utilities from `viewerUtils.ts` for camera math, bounding boxes, auto-rotation, etc.
4. Implement camera interpolation and auto-rotation using shared logic + Lite's inertia system.
5. No-op or return defaults for unsupported features (SSAO, IBL shadows, material variants).

### Phase 4: Test + Polish

1. Add tests for `ViewerLite` loading a glTF model, environment, basic camera interaction.
2. Test `viewerElement` with `engine="lite"` attribute.
3. Verify bundle size difference between Viewer and ViewerLite.

## Open Questions

1. **Where does `ViewerLite` live?** In `packages/tools/viewer/src/viewerLite.ts` alongside `Viewer`, or in its own package? If Babylon Lite is in a separate repo, we need to decide on the dependency graph.
2. **Feature degradation UX**: When `ViewerLite` doesn't support a feature (e.g. SSAO, IBL shadows), should `viewerElement` reflect this to users (e.g. ignore the attribute silently, log a warning, etc.)?
3. **Scope of first milestone**: Should Phase 3 aim for the full `IViewer` contract, or a minimal "model loading + camera + environment" subset with no-op stubs for the rest?

## Todos

- [ ] Define `IViewer` interface in `viewerInterface.ts`
- [ ] Extract shared utility functions into `viewerUtils.ts`
- [ ] Make `Viewer` implement `IViewer`
- [ ] Update `viewerElement.ts` to use `IViewer`
- [ ] Update `viewerFactory.ts` to support `engine: "lite"` option
- [ ] Build `ViewerLite` implementing `IViewer` with Babylon Lite
- [ ] Add tests for `ViewerLite`
- [ ] Test `viewerElement` with both backends
