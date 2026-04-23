# Viewer + Babylon Lite — Plan

## Goal

Make the Viewer work with both the full Babylon.js API and Babylon Lite (a lightweight, WebGPU-only engine in a separate repo). No breaking changes to existing APIs.

## Architecture

```
                        ┌──────────────────┐
                        │     IViewer      │
                        └────────┬─────────┘
                                 │
                ┌────────────────┼────────────────┐
                ▼                                  ▼
       ┌─────────────────┐              ┌─────────────────┐
       │  Viewer          │              │  ViewerLite      │
       │  (full Babylon)  │              │  (Babylon Lite)  │
       └─────────────────┘              └─────────────────┘
                │                                  │
                └──────────┐      ┌────────────────┘
                           ▼      ▼
                   ┌──────────────────┐
                   │  viewerUtils.ts  │  (shared pure functions)
                   └──────────────────┘

─────────────────── Element Layer ───────────────────

              ┌───────────────────────────┐
              │  ViewerElementBase        │  (abstract, IViewer only,
              │  (viewerElementBase.ts)   │   no Babylon.js core imports)
              └─────────────┬─────────────┘
                            │
           ┌────────────────┼────────────────┐
           ▼                                  ▼
  ┌─────────────────────┐          ┌─────────────────────┐
  │  ViewerElement       │          │  ViewerElementLite   │
  │  + clearColor: Color4│          │  + clearColor:       │
  │  + viewerDetails     │          │    IColor4Like       │
  │  + engine property   │          │  (no viewerDetails)  │
  └─────────┬────────────┘          └─────────┬────────────┘
            ▼                                  ▼
  ┌─────────────────────┐          ┌─────────────────────┐
  │  HTML3DElement       │          │  HTML3DElement       │
  │  <babylon-viewer>    │          │  <babylon-viewer>    │
  │  @customElement      │          │  @customElement      │
  └─────────────────────┘          └─────────────────────┘

─────────────────── Entry Points (mutually exclusive) ───

  @babylonjs/viewer           @babylonjs/viewer/lite
  (index.ts)                  (lite/index.ts)
```

**Why this approach:**

- `IViewer` is ~30-40 members (the ViewerElement-facing API). Much smaller than the ~100+ internal APIs the Viewer uses.
- Each implementation uses its native APIs directly — no leaky abstractions.
- `ViewerElementBase` contains all shared Lit UI logic. Subclasses add backend-specific concerns (`clearColor` type, `viewerDetails`, `engine` selection).
- Separate entry points ensure `@babylonjs/viewer/lite` never pulls in `Viewer` or `@babylonjs/core` (the `@customElement` decorator triggers `customElements.define()` at module load time, so bundle isolation requires separate entry points).
- Both entry points register `<babylon-viewer>` as `HTML3DElement` — they are mutually exclusive. For side-by-side use, consumers manually call `customElements.define` or `ConfigureCustomViewerElement` with distinct tag names.
- Zero breaking changes — existing `Viewer`, `ViewerElement`, and `HTML3DElement` are unchanged.

## IViewer Interface

Scoped to exactly the Viewer API subset that ViewerElement uses. Uses existing Viewer names and signatures. `Viewer implements IViewer` requires only adding a few new wrapper members.

```typescript
export interface IViewer extends IDisposable {
    // ── Events ──
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
    readonly onAfterRenderObservable: Observable<void>;     // NEW
    readonly onClearColorChanged: Observable<void>;         // NEW

    // ── Clear Color (NEW) ──
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

    // ── State ──
    readonly isModelLoaded: boolean;
    readonly loadingProgress: boolean | number;
    reset(...flags: ResetFlag[]): void;
    dispose(): void;
}
```

### New members to add to `Viewer`

| Member | Implementation |
|---|---|
| `clearColor: IColor4Like` | Get/set wrapping `this._scene.clearColor` (Color4 satisfies IColor4Like) |
| `onClearColorChanged` | Forwards `this._scene.onClearColorChangedObservable` |
| `onAfterRenderObservable` | Forwards `this._scene.onAfterRenderCameraObservable` |
| `isModelLoaded: boolean` | Returns `this._activeModelBacking !== null` |

### Viewer-only API (not on IViewer)

`showDebugLogs`, `getHotSpotToRef` — not used by ViewerElement.

### `ViewerLoadModelOptions`

`LoadModelOptions` is aliased to `LoadAssetContainerOptions` from core, which has Babylon.js-specific types. IViewer uses a new `ViewerLoadModelOptions` with only the backend-agnostic subset (e.g. `{ pluginExtension }`). ViewerElement only passes `{ pluginExtension }` today, so this covers actual usage.

## ViewerElementBase

Abstract Lit-based base class with all shared UI logic. Depends only on IViewer and lightweight utilities.

**Contains:** Lit template (toolbar, animation controls, progress bar), all `@property` declarations that map to IViewer, property bindings, IViewer event subscriptions, `_createViewer` abstract method, CSS styles.

**Does NOT contain:** `clearColor` (subclass-specific type), `viewerDetails` (ViewerElement-only), `engine` property (ViewerElement-only — WebGL/WebGPU choice), any Scene/Camera/Color4 imports.

All shared types (`ViewerHotSpotResult`, `HotSpot`, `ShadowQuality`, `ToneMapping`, `CameraAutoOrbit`, `EnvironmentParams`, `ShadowParams`, `PostProcessing`, `ResetFlag`, validators like `IsShadowQuality`/`IsToneMapping`, etc.) live in `viewerInterface.ts` alongside `IViewer`. This keeps the Babylon-free type boundary in one file.

### clearColor handling

- **ViewerElementBase**: Declares `clearColor: Nullable<IColor4Like>` as a Lit `@property`.
- **ViewerElement**: Overrides as `Nullable<Color4>` — no breaking change (Color4 extends IColor4Like).
- **ViewerElementLite**: Inherits the base's `Nullable<IColor4Like>` directly. No Color4 dependency.

### viewerDetails

Stays on `ViewerElement` only. Not on IViewer or ViewerElementBase. `ViewerElementLite` does not have it. ViewerDetail-like APIs can be added to ViewerLite later as needed.

ViewerElementBase uses `viewer.isModelLoaded` instead of `details.model != null` for toolbar visibility.

### ViewerElementLite viewer property

`ViewerElementLite` exposes a `viewer` property that returns the underlying `ViewerLite` instance (or `undefined` if not yet initialized). This is the Lite equivalent of `ViewerElement.viewerDetails` — a direct escape hatch to the backend.

### viewerAnnotationElement.ts

`HTML3DAnnotationElement` currently checks `this.parentElement instanceof ViewerElement` and uses `queryHotSpot` + the `"viewerrender"` DOM event. Changes needed:

- Change the `instanceof` check to `ViewerElementBase` so annotations work as children of both `<babylon-viewer>` and `<babylon-viewer-lite>`.
- Import `ViewerElementBase` instead of `ViewerElement`.
- `ViewerHotSpotResult` import stays (it's a viewer-defined type, no core dependency).
- The `"viewerrender"` event is a standard DOM CustomEvent dispatched by ViewerElementBase, so it works for both backends.
- A separate `HTML3DAnnotationLiteElement` is NOT needed — the same annotation element works with both viewer elements.

## Shared Utility Code (`viewerUtils.ts`)

Pure functions extracted from `viewer.ts` that both implementations can share:

| Utility | Description |
|---|---|
| `computeModelsMaxExtents` | Bounding extents across models + animations |
| `reduceMeshesExtendsToBoundingInfo` | Extents → min/max/size/center |
| `adjustLightTargetDirection` | Shadow light direction |
| Camera orbit math | Framing, radius limits, minZ/maxZ |
| `parseColor` | CSS color string → `{ r, g, b, a }` |
| `WhenNext` | Promise wrapper for observable + abort signal |
| `observePromise` | Fire-and-forget async with error logging |
| Auto-rotation state machine | Enable/disable/speed/delay |
| Animation progress math | Frame ↔ progress normalization |

## Feature Gap Analysis

| Feature | Lite Status | ViewerLite Strategy |
|---|---|---|
| SSAO | ❌ | No-op |
| IBL Shadows (high) | ❌ | Only "none" and "normal" quality |
| Normal shadows | ✅ | Implement |
| Snapshot rendering | ❌ | N/A (internal to Viewer) |
| Scene optimizer | ❌ | N/A (internal to Viewer) |
| Picking | ✅ GPU only | Use Lite's GPU picker |
| Image processing | ✅ Partial | Implement (tone mapping type may be limited) |
| Skybox | ✅ | Implement |
| Environment IBL | ✅ | Implement |
| Auto-rotation | ❌ | Implement via shared utils + Lite's inertia |
| Camera interpolation | ❌ | Implement via shared interpolation math |
| Material variants | ✅ | Implement |
| Observable | ✅ | Both impls import from `core/Misc/observable` |

## Migration Strategy

### Phase 1: Extract IViewer + Shared Utilities

1. Define `IViewer` in `viewerInterface.ts` and `ViewerLoadModelOptions`.
2. Add new members to `Viewer` (`clearColor`, `onClearColorChanged`, `onAfterRenderObservable`, `isModelLoaded`).
3. Make `Viewer` implement `IViewer`.
4. Extract shared utilities into `viewerUtils.ts`.
5. All existing tests must pass unchanged.

### Phase 2: Factor out ViewerElementBase

1. Create `viewerElementBase.ts` with shared UI logic depending only on IViewer.
2. Refactor `viewerElement.ts`: `ViewerElement extends ViewerElementBase`, adds `clearColor: Color4` (overriding base's `IColor4Like`), `viewerDetails`, `engine`.
3. Update `viewerAnnotationElement.ts`: change `instanceof ViewerElement` to `instanceof ViewerElementBase`.
4. All existing tests must pass unchanged.

### Phase 3: Build ViewerLite + Lite Entry Point

1. Install Babylon Lite as a local dependency: `npm install --save ../../../../Babylon-Lite-1/packages/babylon-lite -w @tools/viewer`. Babylon Lite's package.json points `main`/`exports` at TypeScript source (`./src/index.ts`), so Vite/Rollup compile it directly — no build step needed on the Lite side.
2. Create `viewerLite.ts` implementing `IViewer` with Babylon Lite.
3. Create `viewerElementLite.ts`: `ViewerElementLite extends ViewerElementBase` + `HTML3DElement` (`<babylon-viewer>`, same tag name — mutually exclusive with full viewer). Includes `viewer` property returning the `ViewerLite` instance.
4. Create `lite/index.ts` entry point. Add `"./lite"` to package.json `exports`.
5. Log warnings for unimplemented features. Implement everything possible with current Lite state.

### Phase 4: Test + Polish

1. Tests for `ViewerLite` (model loading, environment, camera).
2. Tests for `<babylon-viewer>` with Lite backend end-to-end.
3. Verify bundle isolation (no Babylon.js core in Lite bundle).
4. Verify zero regressions on `@babylonjs/viewer`.

## Bundle Size Goal

The goal is not zero `@babylonjs/core` — it's a Viewer that is **much smaller** than the full Viewer built on core engines. Small core utilities like `Observable`, `AsyncLock`, `Deferred`, `AbortError`, `Logger`, `IColor4Like`, `Nullable`, and `IDisposable` are acceptable dependencies. The bulk of the size savings comes from not pulling in the full engine, scene graph, loaders, materials, post-processing, etc.

Peer deps on `@babylonjs/core` in the package will cause the package to be downloaded but unused code won't be bundled or used at runtime when using the Lite entry point.

## Notes

- Adding `"exports"` to package.json is needed for the `"./lite"` subpath. There are no supported deep imports — just the main bundle and unstable chunks not intended for direct import — so no permissive fallback is needed.



- **Where does ViewerLite live?** Same package (`packages/tools/viewer/src/viewerLite.ts`). Babylon Lite is brought in as an npm dependency. For local dev, use `npm install` with the local package source directory or `npm link`.
- **Feature degradation UX**: Log a warning for all unimplemented features.
- **Scope of first milestone**: Implement everything possible with the current state of Lite.

## Todos

- [ ] Define `IViewer` interface in `viewerInterface.ts`
- [ ] Define `ViewerLoadModelOptions` type
- [ ] Add `clearColor`, `onClearColorChanged`, `onAfterRenderObservable`, `isModelLoaded` to `Viewer`
- [ ] Make `Viewer` implement `IViewer`
- [ ] Extract shared utilities into `viewerUtils.ts`
- [ ] Create `viewerElementBase.ts` with shared UI logic (including `clearColor: IColor4Like`)
- [ ] Refactor `viewerElement.ts` to extend `ViewerElementBase` (override `clearColor` as `Color4`)
- [ ] Update `viewerAnnotationElement.ts` to use `ViewerElementBase` for `instanceof` check
- [ ] Install Babylon Lite as npm dependency
- [ ] Build `ViewerLite` implementing `IViewer`
- [ ] Create `viewerElementLite.ts` with `HTML3DElement` (same tag, mutually exclusive) and `viewer` property
- [ ] Create `lite/index.ts` entry point
- [ ] Add `"./lite"` export to package.json
- [ ] Tests for `ViewerLite`
- [ ] Tests for `<babylon-viewer>` with Lite backend end-to-end
- [ ] Verify bundle isolation
