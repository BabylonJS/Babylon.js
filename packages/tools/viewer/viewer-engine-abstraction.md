# Viewer Engine Abstraction — Exploration & Plan

## Problem Statement

The Viewer currently depends directly on `@babylonjs/core` (`AbstractEngine`, `Scene`, `ArcRotateCamera`, `PBRMaterial`, `LoadAssetContainerAsync`, `Observable`, shadow generators, post-processing pipelines, etc.). We want the Viewer to also work with Babylon Lite — a lightweight, WebGPU-only engine with a different API surface. The goal is to introduce an abstraction layer so the Viewer's core logic can run against either backend.

## High-Level Approach

Introduce a **`ViewerEngine`** interface (working name) that exposes the capabilities the Viewer needs, expressed in engine-agnostic terms. The Viewer constructor gains an overload that accepts a `ViewerEngine`. The existing `AbstractEngine` constructor overload creates a `ViewerEngine` implementation backed by full Babylon.js. A second implementation wraps Babylon Lite.

```
┌──────────────┐      ┌──────────────────┐
│   Viewer     │─────▶│  ViewerEngine    │  (interface)
└──────────────┘      └────────┬─────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                                  ▼
┌─────────────────────────┐       ┌──────────────────────────┐
│ BabylonViewerEngine     │       │ LiteViewerEngine         │
│ (wraps AbstractEngine,  │       │ (wraps Lite Engine,      │
│  Scene, ArcRotateCamera,│       │  SceneContext,            │
│  loaders, shadows, etc.)│       │  ArcRotateCamera, etc.)  │
└─────────────────────────┘       └──────────────────────────┘
```

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

## Proposed `ViewerEngine` Interface Design

Rather than one monolithic interface, I'd recommend a **small set of focused interfaces** that map to the Viewer's functional needs. This keeps each piece testable and avoids a god-interface.

### Option A: Composite Interface (Recommended)

```typescript
/**
 * The top-level abstraction the Viewer depends on.
 * Each sub-interface covers a distinct concern.
 */
interface ViewerEngine extends IDisposable {
    // ── Rendering ──────────────────────────────────────
    readonly rendering: ViewerRendering;

    // ── Scene ──────────────────────────────────────────
    readonly scene: ViewerScene;

    // ── Camera ─────────────────────────────────────────
    readonly camera: ViewerCamera;

    // ── Loading ────────────────────────────────────────
    readonly loader: ViewerLoader;

    // ── Environment / IBL ──────────────────────────────
    readonly environment: ViewerEnvironment;

    // ── Capabilities (what's supported) ────────────────
    readonly capabilities: ViewerCapabilities;
}
```

### Sub-Interfaces (Sketches)

```typescript
interface ViewerRendering {
    runRenderLoop(renderFunction: () => void): void;
    stopRenderLoop(renderFunction: () => void): void;
    beginFrame(): void;
    endFrame(): void;
    render(): void;
    resize(): void;
    isReady(): boolean;

    readonly renderWidth: number;
    readonly renderHeight: number;

    hardwareScalingLevel: number;
    readonly defaultHardwareScalingLevel: number;
}

interface ViewerScene {
    clearColor: [r: number, g: number, b: number, a: number];
    useRightHandedSystem: boolean;

    // Image processing (tone mapping, contrast, exposure)
    imageProcessing: {
        toneMappingEnabled: boolean;
        toneMappingType: number; // or an enum
        contrast: number;
        exposure: number;
        isEnabled: boolean;
        onUpdateParameters: IObservableLike<void>;
    };

    // Entity access
    readonly meshes: ReadonlyArray<ViewerMesh>;
    readonly materials: ReadonlyArray<unknown>;
    readonly cameras: ReadonlyArray<unknown>;
    readonly animationGroups: ReadonlyArray<ViewerAnimationGroup>;

    // Observables
    onBeforeRender: IObservableLike<void>;
    onAfterRender: IObservableLike<void>;
    onAfterAnimations: IObservableLike<void>;

    dispose(): void;
}

interface ViewerCamera {
    alpha: number;
    beta: number;
    radius: number;
    target: [x: number, y: number, z: number];
    position: readonly [x: number, y: number, z: number];

    minZ: number;
    maxZ: number;
    lowerRadiusLimit: number;
    upperRadiusLimit: number;

    // Smooth animation
    interpolateTo(alpha?: number, beta?: number, radius?: number, target?: [number, number, number]): void;
    stopInterpolation(): void;

    // Auto-rotation
    autoRotation: {
        enabled: boolean;
        speed: number;
        delay: number;
        resetLastInteractionTime(): void;
    };

    // Input
    attachControl(): void;
    panningSensibility: number;
    speed: number;
    wheelDeltaPercentage: number;

    onViewMatrixChanged: IObservableLike<void>;
    update(): void;
}

interface ViewerLoader {
    loadModel(
        source: string | File | ArrayBufferView,
        options?: ViewerLoadModelOptions,
        abortSignal?: AbortSignal
    ): Promise<ViewerModel>;
}

interface ViewerModel extends IDisposable {
    readonly meshes: ReadonlyArray<ViewerMesh>;
    readonly animationGroups: ReadonlyArray<ViewerAnimationGroup>;
    readonly materialVariants: string[] | null;
    selectedMaterialVariant: string | null;
    addAllToScene(): void;
}

interface ViewerAnimationGroup {
    readonly name: string;
    readonly isPlaying: boolean;
    readonly duration: number;
    currentFrame: number;
    speedRatio: number;
    play(): void;
    pause(): void;
    stop(): void;
    goToFrame(frame: number): void;
    start(loop: boolean, speedRatio: number): void;
    onPlay: IObservableLike<void>;
    onPause: IObservableLike<void>;
    onEnd: IObservableLike<void>;
}

interface ViewerEnvironment {
    loadLighting(url: string, options?: { extension?: string }): Promise<void>;
    loadSkybox(url: string, options?: { blur?: number; extension?: string }): Promise<void>;
    setLightingIntensity(intensity: number): void;
    setLightingRotation(rotation: number): void;
    setSkyboxBlur(blur: number): void;
    clearLighting(): void;
    clearSkybox(): void;
}

interface ViewerCapabilities {
    readonly supportsWebGPU: boolean;
    readonly supportsShadows: boolean;
    readonly supportsSSAO: boolean;
    readonly supportsIBLShadows: boolean;
    readonly supportsSnapshotRendering: boolean;
    readonly supportsPicking: boolean;
}

/** Minimal observable-like contract the Viewer needs. */
interface IObservableLike<T> {
    add(callback: (data: T) => void): IObserverLike;
    addOnce(callback: (data: T) => void): IObserverLike;
    notifyObservers(data: T): void;
    clear(): void;
}

interface IObserverLike {
    remove(): void;
}
```

### Option B: Thinner, "Adapter" Approach

Instead of fine-grained sub-interfaces, provide a single `ViewerEngineAdapter` with methods that map 1:1 to the Viewer's operations. The Viewer calls adapter methods like `adapter.loadModel(...)`, `adapter.createEnvironment(...)`, etc. This is simpler but less composable and harder to test in isolation.

**Recommendation**: Option A. It mirrors the natural capability groupings and allows incremental porting (e.g., start with `ViewerRendering` + `ViewerCamera`, then add `ViewerLoader`, etc.).

## Feature Gap Analysis for Lite Backend

Features the Viewer uses that Babylon Lite **does not currently support**:

| Feature                                       | Viewer Usage                                                                 | Lite Status                                                                                                                                                                                                                                                                                                                                                                                                                                        | Strategy                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SSAO**                                      | Optional post-processing                                                     | ❌ Not supported                                                                                                                                                                                                                                                                                                                                                                                                                                    | `capabilities.supportsSSAO = false`, Viewer skips                                                                                                                                                                                                                |
| **IBL Shadows (high)**                        | Optional shadow pipeline                                                     | ❌ Not supported                                                                                                                                                                                                                                                                                                                                                                                                                                    | `capabilities.supportsIBLShadows = false`, Viewer skips                                                                                                                                                                                                          |
| **Normal shadows**                            | Standard shadow maps                                                         | ✅ Supported (basic `createShadowGenerator`)                                                                                                                                                                                                                                                                                                                                                                                                        | Implement in `LiteViewerEngine`                                                                                                                                                                                                                                  |
| **Snapshot rendering**                        | WebGPU optimization                                                          | ❌ Not applicable                                                                                                                                                                                                                                                                                                                                                                                                                                   | `capabilities.supportsSnapshotRendering = false`                                                                                                                                                                                                                 |
| **Scene optimizer**                           | Auto quality scaling                                                         | ❌ Not supported                                                                                                                                                                                                                                                                                                                                                                                                                                    | Implementation detail of `BabylonViewerEngine` — not part of the `ViewerEngine` interface. The optimizer only touches `Scene` and hardware scaling internally, so it belongs inside the Babylon implementation's rendering adapter. Lite simply doesn't need it. |
| **CPU picking**                               | Double-tap reframing, hot spots                                              | ❌ (GPU picking only)                                                                                                                                                                                                                                                                                                                                                                                                                               | Either use GPU picker or mark `supportsPicking = false`                                                                                                                                                                                                          |
| **`Observable`**                              | Viewer's own event system + subscriptions to engine/scene/camera observables | ✅ Not a gap for Viewer's own observables — they're `new Observable()` from `core/Misc/observable` and don't depend on the engine backend. **However**, the Viewer subscribes to ~10 observables on engine/scene/camera/animation objects (see below). The `ViewerEngine` sub-interfaces must expose equivalent callback hooks; Babylon wraps real observables, Lite synthesizes them from version tracking / setter interception / explicit calls. |
| AnimationGroup `onPlay` / `onPause` / `onEnd` | AnimationGroup                                                               | No equivalent — Lite groups have no callbacks                                                                                                                                                                                                                                                                                                                                                                                                      |
| **ImageProcessingConfiguration**              | Tone mapping, contrast, exposure                                             | ✅ Partial (`toneMappingEnabled`, `exposure`, `contrast`)                                                                                                                                                                                                                                                                                                                                                                                           | Implement adapter                                                                                                                                                                                                                                                |
| **BackgroundMaterial / skybox**               | Skybox rendering                                                             | ✅ `loadSkybox()` in Lite                                                                                                                                                                                                                                                                                                                                                                                                                           | Implement in `LiteViewerEngine.environment`                                                                                                                                                                                                                      |
| **CubeTexture / HDRCubeTexture**              | Environment loading                                                          | ✅ `loadEnvironment()` / `loadHdrEnvironment()` in Lite                                                                                                                                                                                                                                                                                                                                                                                             | Implement adapter                                                                                                                                                                                                                                                |
| **Auto-rotation behavior**                    | Camera auto-orbit                                                            | ❌ No behavior system                                                                                                                                                                                                                                                                                                                                                                                                                               | Implement in Lite camera adapter (inertia offsets exist)                                                                                                                                                                                                         |
| **Camera interpolation**                      | Smooth camera animation                                                      | ❌ No `interpolateTo`                                                                                                                                                                                                                                                                                                                                                                                                                               | Implement in adapter or Viewer layer                                                                                                                                                                                                                             |
| **Material variants**                         | `KHR_materials_variants`                                                     | ❌ Not in Lite loaders                                                                                                                                                                                                                                                                                                                                                                                                                              | Mark as unsupported initially                                                                                                                                                                                                                                    |

**External observables the Viewer subscribes to (must be abstracted as callback hooks):**

| Observable                                                       | Source | Lite Equivalent                                            |
| ---------------------------------------------------------------- | ------ | ---------------------------------------------------------- |
| `scene.imageProcessingConfiguration.onUpdateParameters`          | Scene  | Lite has `imageProcessing` but no callback — needs adapter |
| `camera.onViewMatrixChangedObservable`                           | Camera | Lite uses dirty version tracking — needs polling or hook   |
| `scene.onClearColorChangedObservable`                            | Scene  | No equivalent — adapter uses setter interception           |
| `scene.onPointerObservable`                                      | Scene  | No equivalent — adapter wraps canvas pointer events        |
| `scene.onNewCameraAddedObservable` / `onCameraRemovedObservable` | Scene  | No equivalent — Lite has flat `scene.camera`               |
| `scene.onBeforeRenderObservable` / `onAfterRenderObservable`     | Scene  | Lite has `onBeforeRender(cb)` — partial match              |
| `scene.onAfterAnimationsObservable`                              | Scene  | No equivalent — adapter fires after animation tick         |
| `engine.onResizeObservable`                                      | Engine | No equivalent — adapter hooks canvas resize                |
| `engine.onContextLostObservable`                                 | Engine | Not applicable (WebGPU device lost)                        |

## Migration Strategy

### Phase 1: Define Interfaces + Babylon Implementation

1. Define the `ViewerEngine` interface hierarchy in `packages/tools/viewer/src/viewerEngine.ts`.
2. Build `BabylonViewerEngine` that wraps the existing Babylon.js APIs.
3. Refactor `Viewer` constructor to accept `ViewerEngine`.
4. Keep the existing `new Viewer(engine: AbstractEngine, options)` overload as sugar that internally creates `BabylonViewerEngine`.
5. **All existing tests and behavior must continue to pass unchanged.**

### Phase 2: Refactor Viewer Internals

Incrementally change the Viewer's private methods to use `ViewerEngine` sub-interfaces instead of direct Babylon.js types. Start with:
- Render loop (`_beginRendering`) → `ViewerRendering`
- Camera setup/update → `ViewerCamera`
- Scene basics (clear color, right-handed, image processing) → `ViewerScene`
- Model loading (`_loadModel`) → `ViewerLoader`
- Environment (`_loadEnvironmentLighting`, `_loadEnvironmentSkybox`) → `ViewerEnvironment`

### Phase 3: Lite Implementation

1. Build `LiteViewerEngine` that wraps Babylon Lite.
2. Implement supported capabilities, return `false` for unsupported ones.
3. The Viewer guards advanced features with `capabilities.*` checks.
4. Test with a Lite-backed Viewer loading a glTF model.

### Phase 4: ViewerElement / Factory Integration

1. Update `viewerFactory.ts` to support a Lite engine option.
2. Update `viewerElement.ts` to support a `engine="lite"` attribute.

## Open Questions

1. **Where should `ViewerEngine` live?** In `packages/tools/viewer/src/` or in a shared package? If Lite is in a separate repo, the interface needs to be in a shared dependency or duplicated.
2. **Observable pattern**: The Viewer uses `Observable<T>` from core heavily for its own events. These are independent of the engine backend. Should the `ViewerEngine` sub-interfaces use a minimal `IObservableLike` contract, or should we ship a tiny standalone Observable?
3. **Math types**: The Viewer uses Babylon's `Vector3`, `Matrix`, `Color3` etc. extensively. Lite uses plain objects/`Float32Array`. The abstraction needs a math bridge — either the interface uses plain arrays/tuples (which the Viewer already does for its public API surface), or we define minimal math contracts.
4. **Render loop ownership**: Full Babylon.js lets the Viewer own the render loop (`engine.runRenderLoop`). Lite's `engine.start(scene)` owns it internally. The adapter needs to reconcile this — likely by having `LiteViewerEngine.rendering` use its own `requestAnimationFrame` loop to match the Viewer's expectations.
5. **Feature degradation UX**: When capabilities are missing (SSAO, IBL shadows, etc.), should the Viewer silently skip them, or should `viewerElement` reflect the limitation to users?
6. **Scope of first milestone**: Should Phase 1 aim for the full interface, or a minimal "model loading + camera + render loop" subset?

## Todos

- [ ] Finalize `ViewerEngine` interface hierarchy
- [ ] Build `BabylonViewerEngine` implementation
- [ ] Refactor `Viewer` constructor to accept `ViewerEngine`
- [ ] Preserve backward-compatible `new Viewer(AbstractEngine, ...)` overload
- [ ] Incrementally port Viewer internals to use `ViewerEngine`
- [ ] Build `LiteViewerEngine` implementation
- [ ] Add capability guards in Viewer for optional features
- [ ] Update `viewerFactory.ts` and `viewerElement.ts`
- [ ] Add tests for both backends
