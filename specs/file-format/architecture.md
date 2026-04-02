# Babylon Authoring Format — Architecture

**Last updated:** March 31, 2026
**Source:** [Goals](goals.md) · [Requirements](requirements.md) · [Design Decisions](../../babylon-authoring-format-decisions.md) · [Risks](../../babylon-authoring-format-risks.md)

---

## 1. Architecture Decision: Standalone SmartAsset Class (Not `asset://` Protocol)

### Decision

The smart asset system is implemented as a **standalone `SmartAssetManager` class** in `@dev/core`, not as an `asset://` protocol injected into `FileToolsOptions.PreprocessUrl`.

### Rationale

Codebase analysis reveals that `FileToolsOptions.PreprocessUrl` is **not a universal URL interception point**:

| Resource Type | Goes through PreprocessUrl? | Loading Path |
|---------------|:--:|---|
| Scene/model files (glTF, .babylon) | ✅ | `LoadAssetContainerAsync → RequestFile` |
| Standalone textures | ❌ | `Texture constructor → engine.createTexture()` (direct) |
| Images via `LoadImage` | ✅ | `FileTools.LoadImage` |
| Data URLs, Blob URLs | ❌ | Special handling, skipped |

Textures bypass `PreprocessUrl` entirely — they go through `engine.createTexture()` on a completely separate code path. An `asset://` protocol would work for mesh/model loading but silently fail for standalone textures, which are a core requirement (FR-1.5.2). Additionally, `BaseUrl` is prepended *after* `PreprocessUrl`, which would produce invalid URLs like `https://server.com/asset://key`.

A standalone class provides:
- Consistent handling across all asset types (meshes, textures, materials, animations)
- Full control over loading, caching, provenance, and lifecycle
- No modification to foundational `FileTools` class (backward compatibility)
- Clear API surface for consumers

### Alternatives Considered

| Approach | Pros | Cons |
|----------|------|------|
| `asset://` in FileTools | Transparent — any URL-based API works | Textures bypass PreprocessUrl; touches foundational class; BaseUrl interference |
| `asset://` in engine.createTexture too | Would cover textures | Invasive change to two foundational systems; fragile |
| **Standalone SmartAssetManager** ✅ | Complete coverage; additive; clear API | New API surface to learn; not transparent to existing code |

---

## 2. System Architecture

### 2.1 High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        @dev/core                                    │
│                                                                     │
│  ┌─────────────────────────────┐  ┌──────────────────────────────┐  │
│  │    SmartAssets/              │  │    Overrides/                │  │
│  │                             │  │                              │  │
│  │  smartAssetManager.ts       │  │  overrideManager.ts          │  │
│  │    SmartAssetManager        │  │    OverrideManager            │  │
│  │    ├─ asset table (Map)     │  │    ├─ override store (Map)   │  │
│  │    ├─ provenance tracking   │  │    ├─ original snapshots     │  │
│  │    ├─ load/unload/reload    │  │    ├─ apply/reset/query      │  │
│  │    └─ observables           │  │    └─ type conversion        │  │
│  │                             │  │                              │  │
│  │  smartAssetEntry.ts         │  │  overrideEntry.ts            │  │
│  │    SmartAssetEntry          │  │    OverrideEntry              │  │
│  │    ├─ key, url, metadata    │  │    ├─ target, property, value│  │
│  │    └─ load state, container │  │    └─ originalValue          │  │
│  │                             │  │                              │  │
│  │  smartAssetSerializer.ts    │  │  overrideSerializer.ts       │  │
│  │    serialize / deserialize  │  │    serialize / deserialize   │  │
│  │                             │  │                              │  │
│  │  smartAssetLoaders.ts       │  │  overrideTypeConverters.ts   │  │
│  │    type-specific loading    │  │    JSON ↔ Babylon types      │  │
│  └─────────────────────────────┘  └──────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │    ProjectFile/                                                 │ │
│  │                                                                 │ │
│  │  projectFile.ts                                                 │ │
│  │    ProjectFile — composes SmartAssetManager + OverrideManager   │ │
│  │    ├─ serialize/deserialize combined JSON                       │ │
│  │    ├─ load project (register assets + apply overrides)          │ │
│  │    └─ coordinate reload (reapply overrides after asset reload)  │ │
│  │                                                                 │ │
│  │  bundleManager.ts                                               │ │
│  │    BundleManager — zip packaging (M6)                           │ │
│  │    ├─ saveBundleAsync (project.json + assets/ → zip)            │ │
│  │    └─ loadBundleAsync (unzip → blob URLs → load project)        │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     @dev/inspector-v2                                │
│                                                                     │
│  services/                                                          │
│  ├─ smartAssetService.tsx     — Inspector service for SmartAssets    │
│  ├─ overrideService.tsx       — Inspector service for overrides     │
│  └─ panes/                                                          │
│     ├─ smartAssetPaneService.tsx  — Smart asset visualization pane  │
│     └─ scene/                                                       │
│        └─ smartAssetExplorerService.tsx  — Scene explorer entries   │
│                                                                     │
│  components/                                                        │
│  ├─ smartAssets/              — Smart asset pane UI components       │
│  └─ properties/              — Override indicator components        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     @tools/playground                               │
│                                                                     │
│  tools/                                                             │
│  └─ smartAssetPlayground.ts  — Playground-specific onAssetNotFound  │
│                                 + snippet serialization integration │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Package Placement

| Component | Package | Directory | Rationale |
|-----------|---------|-----------|-----------|
| `SmartAssetManager` | `@dev/core` | `src/SmartAssets/` | Core runtime API, must be available to all consumers |
| `OverrideManager` | `@dev/core` | `src/Overrides/` | Core runtime API, independent of Inspector |
| `ProjectFile` | `@dev/core` | `src/ProjectFile/` | Composes SmartAssets + Overrides; used by both Inspector and programmatic consumers |
| `BundleManager` | `@dev/core` | `src/ProjectFile/` | Zip packaging; uses JSZip (added as optional peer dependency) |
| Inspector services | `@dev/inspector-v2` | `src/services/` | UI layer; follows existing service pattern |
| Inspector components | `@dev/inspector-v2` | `src/components/smartAssets/` | UI components for the smart asset pane |
| Playground integration | `@tools/playground` | `src/tools/` | Playground-specific onAssetNotFound + snippet data |

### 2.3 Dependency Graph

```
@dev/core (no new external dependencies for M1-M5)
  ├── SmartAssets/ (uses: LoadAssetContainerAsync, AssetContainer, Observable, Texture, NodeMaterial)
  ├── Overrides/   (uses: Observable, SerializationHelper metadata, scene graph traversal)
  └── ProjectFile/ (uses: SmartAssets/, Overrides/, JSZip for M6 only)

@dev/inspector-v2 (depends on @dev/core — existing dependency)
  └── services/ (uses: SmartAssetManager, OverrideManager, PropertyContext, ISceneContext)

@tools/playground (depends on @dev/core — existing dependency)
  └── tools/ (uses: SmartAssetManager, snippet server API)
```

JSZip is needed only for M6 (bundle packaging). It is already available as a global in the Playground. For core usage, it should be loaded dynamically or declared as an optional peer dependency.

---

## 3. SmartAssetManager — Detailed Design (M1)

### 3.1 Class API

```typescript
// packages/dev/core/src/SmartAssets/smartAssetManager.ts

/**
 * The loaded objects produced by a smart asset load operation.
 * Provides direct access to meshes, materials, textures, etc. by category.
 */
export interface ISmartAssetLoadedObjects {
    readonly container: AssetContainer;
    readonly meshes: readonly AbstractMesh[];
    readonly materials: readonly Material[];
    readonly textures: readonly BaseTexture[];
    readonly animationGroups: readonly AnimationGroup[];
    readonly lights: readonly Light[];
    readonly cameras: readonly Camera[];
}

/**
 * Manages a table of smart assets — logical keys mapped to asset URLs.
 * Provides key-based loading, unloading, reloading, and provenance tracking.
 */
export class SmartAssetManager {
    // ── Construction ──
    constructor(scene: Scene);

    /** The scene this manager is attached to. */
    readonly scene: Scene;

    /**
     * Static callback invoked whenever a new SmartAssetManager is created.
     * Used by hosting environments (e.g., Playground) to install handlers
     * like onAssetNotFound before user code runs.
     */
    static OnInstanceCreated: ((manager: SmartAssetManager) => void) | null;

    // ── Asset Table ──
    /**
     * Registers a smart asset entry mapping a key to a URL.
     * @param key - Unique string identifier for this asset.
     * @param url - URL or path to the asset file.
     * @param options - Optional: type hint, extension hint, metadata.
     */
    registerAsset(key: string, url: string, options?: ISmartAssetOptions): void;

    /** Removes an entry from the table (unloads if loaded). */
    removeAsset(key: string): Promise<void>;

    /** Returns the entry for a key, or undefined. */
    getAsset(key: string): Readonly<ISmartAssetEntry> | undefined;

    /** Returns all registered entries. */
    getAllAssets(): ReadonlyMap<string, Readonly<ISmartAssetEntry>>;

    /** Changes the URL for an existing key. Triggers reload if loaded. */
    setUrl(key: string, newUrl: string): Promise<void>;

    // ── Loading ──
    /**
     * Loads a single asset by key. If a URL is provided and the key is not yet
     * registered, it will be registered automatically before loading.
     * Returns the loaded objects (meshes, textures, materials, etc.).
     *
     * Usage:
     *   // Register and load in one call
     *   const { meshes } = await sam.loadAsync("shark", "https://models.babylonjs.com/shark.glb");
     *
     *   // Load a texture
     *   const { textures } = await sam.loadAsync("env", "sky.env", { type: "texture" });
     *   scene.environmentTexture = textures[0];
     *
     *   // Load a previously registered key
     *   const result = await sam.loadAsync("shark");
     */
    loadAsync(key: string, url?: string, options?: ISmartAssetOptions): Promise<ISmartAssetLoadedObjects>;

    /** Loads all registered assets concurrently. */
    loadAllAsync(): Promise<ISmartAssetLoadedObjects[]>;

    /** Unloads a single asset (removes from scene, disposes container). */
    unloadAsync(key: string): Promise<void>;

    /** Unloads and re-loads a single asset. Reapplies overrides if OverrideManager is linked. */
    reloadAsync(key: string): Promise<AssetContainer>;

    // ── Provenance ──
    /** Returns which scene objects were produced by a key. */
    getProvenance(key: string): Readonly<ISmartAssetProvenance> | undefined;

    /** Returns the loaded objects for a key (meshes, textures, materials, etc.). */
    getLoadedObjects(key: string): ISmartAssetLoadedObjects | undefined;

    /** Finds which key (if any) owns a given scene object. */
    findKeyForObject(object: Node | Material | BaseTexture | AnimationGroup): string | undefined;

    // ── Events ──
    /** Fires when an asset finishes loading. */
    readonly onAssetLoadedObservable: Observable<ISmartAssetLoadedEvent>;

    /** Fires when a key's URL changes. */
    readonly onUrlChangedObservable: Observable<ISmartAssetUrlChangedEvent>;

    /** Fires when an asset fails to load. */
    readonly onAssetErrorObservable: Observable<ISmartAssetErrorEvent>;

    /** Fires when an asset is unloaded. */
    readonly onAssetUnloadedObservable: Observable<ISmartAssetUnloadedEvent>;

    // ── Missing Asset Resolution ──
    /** Callback invoked when an asset can't be found. Return a new URL/File or null to skip. */
    onAssetNotFound: ((key: string, expectedUrl: string) => Promise<string | File | null>) | null;

    // ── Override Integration ──
    /** Links an OverrideManager so overrides are reapplied after reload. */
    linkOverrideManager(overrideManager: OverrideManager): void;

    // ── Lifecycle ──
    /** Disposes the manager and all loaded assets. */
    dispose(): void;
}
```

### 3.2 Supporting Types

```typescript
// packages/dev/core/src/SmartAssets/smartAssetEntry.ts

export interface ISmartAssetOptions {
    /** Loader type hint (e.g., "gltf", "texture", "nodeMaterial"). */
    type?: string;
    /** File extension hint for loader selection (e.g., ".glb", ".png"). */
    extension?: string;
    /** User-defined metadata. */
    metadata?: Record<string, unknown>;
}

export interface ISmartAssetEntry {
    readonly key: string;
    readonly url: string;
    readonly options: Readonly<ISmartAssetOptions>;
    readonly loadState: SmartAssetLoadState;
    readonly container: AssetContainer | null;
}

export enum SmartAssetLoadState {
    NotLoaded = 0,
    Loading = 1,
    Loaded = 2,
    Error = 3,
}

// packages/dev/core/src/SmartAssets/smartAssetProvenance.ts

export interface ISmartAssetProvenance {
    readonly key: string;
    readonly meshNames: readonly string[];
    readonly materialNames: readonly string[];
    readonly textureNames: readonly string[];
    readonly animationGroupNames: readonly string[];
    readonly lightNames: readonly string[];
    readonly cameraNames: readonly string[];
}

// packages/dev/core/src/SmartAssets/smartAssetEvents.ts

export interface ISmartAssetLoadedEvent {
    readonly key: string;
    readonly container: AssetContainer;
}

export interface ISmartAssetUrlChangedEvent {
    readonly key: string;
    readonly oldUrl: string;
    readonly newUrl: string;
}

export interface ISmartAssetErrorEvent {
    readonly key: string;
    readonly url: string;
    readonly error: unknown;
}

export interface ISmartAssetUnloadedEvent {
    readonly key: string;
}
```

### 3.3 Scene Discovery

The `SmartAssetManager` stores itself on the scene using a **Symbol key** on `scene.metadata` to avoid accidental collisions:

```typescript
// packages/dev/core/src/SmartAssets/smartAssetManager.ts

const SMART_ASSET_MANAGER_KEY = Symbol.for("babylonjs:smartAssetManager");

export class SmartAssetManager {
    constructor(scene: Scene) {
        this._scene = scene;
        // Store on metadata for Inspector discovery
        if (!scene.metadata) {
            scene.metadata = {};
        }
        scene.metadata[SMART_ASSET_MANAGER_KEY] = this;
    }

    /**
     * Returns the SmartAssetManager attached to a scene, or undefined.
     */
    static GetFromScene(scene: Scene): SmartAssetManager | undefined {
        return scene.metadata?.[SMART_ASSET_MANAGER_KEY];
    }
}
```

**Why Symbol key instead of `scene.metadata.smartAssetManager`:**
- Avoids accidental overwrite by user code writing to `scene.metadata`
- `Symbol.for()` ensures the same symbol across module boundaries
- Type-safe — users can't accidentally reference it as a plain string property

### 3.4 Asset Type Loading Strategy

Different asset types have different loading paths. The `SmartAssetManager` dispatches to type-specific loaders:

```typescript
// packages/dev/core/src/SmartAssets/smartAssetLoaders.ts

export interface ISmartAssetLoader {
    /** Loads the asset and returns objects to track in provenance. */
    loadAsync(url: string, scene: Scene, options?: ISmartAssetOptions): Promise<SmartAssetLoadResult>;
    /** Unloads/disposes the asset. */
    unloadAsync(result: SmartAssetLoadResult): Promise<void>;
}

export type SmartAssetLoadResult = {
    /** For scene-file types (glTF, .babylon), the AssetContainer. */
    container: AssetContainer | null;
    /** For non-container types (standalone texture), the loaded object. */
    objects: Array<Node | Material | BaseTexture | AnimationGroup>;
};
```

| Asset Type | Loader | Loading Mechanism |
|------------|--------|-------------------|
| GLB / glTF / .babylon / OBJ | `SceneFileLoader` | `LoadAssetContainerAsync` → `addAllToScene()` |
| Standalone texture (PNG/JPG/EXR/ENV/HDR) | `TextureLoader` | `new Texture(url, scene)` or `CubeTexture.CreateFromPrefilteredData(url, scene)` |
| Node material JSON | `NodeMaterialLoader` | `NodeMaterial.ParseFromSnippetAsync` or `NodeMaterial.Parse` + fetch |
| Animation file (glTF with only animations) | `AnimationLoader` | `LoadAssetContainerAsync` → extract `animationGroups` only |

For standalone textures, the `SmartAssetManager` creates the `Texture` directly (bypassing `LoadAssetContainerAsync`), wraps it in a synthetic `AssetContainer` for uniform provenance tracking, and adds it to the scene.

### 3.5 Internal Data Flow: loadAsync

```
loadAsync("sodaCan")
  │
  ├─ 1. Look up entry in asset table
  │     → { key: "sodaCan", url: "assets/soda_can.glb", options: { extension: ".glb" } }
  │
  ├─ 2. Check loadState — if Loaded, return existing container
  │
  ├─ 3. Set loadState = Loading
  │
  ├─ 4. Select loader based on type/extension
  │     → SceneFileLoader (for .glb)
  │
  ├─ 5. Call loader.loadAsync(url, scene, options)
  │     → LoadAssetContainerAsync(url, scene, { pluginExtension: ".glb" })
  │     → container = await result
  │     → container.addAllToScene()
  │
  ├─ 6. Build provenance snapshot
  │     → { meshNames: [...], materialNames: [...], ... }
  │
  ├─ 7. Store container + provenance on entry
  │     → entry.container = container
  │     → entry.loadState = Loaded
  │
  ├─ 8. If OverrideManager is linked, reapply overrides for this key
  │     → overrideManager.applyOverridesForKey("sodaCan")
  │
  ├─ 9. Fire onAssetLoadedObservable
  │
  └─ 10. Return container
  
  On error:
  ├─ 11. Set loadState = Error
  ├─ 12. Call onAssetNotFound (if registered)
  │     → If returns new URL: retry from step 4 with new URL
  │     → If returns File: retry with File object
  │     → If returns null: skip, log warning
  └─ 13. Fire onAssetErrorObservable
```

---

## 4. OverrideManager — Detailed Design (M4)

### 4.1 Class API

```typescript
// packages/dev/core/src/Overrides/overrideManager.ts

/**
 * Manages non-destructive property overrides on scene objects.
 * Tracks changes, stores original values, and supports save/load.
 */
export class OverrideManager {
    constructor(scene: Scene);

    readonly scene: Scene;

    // ── Override CRUD ──
    /** Adds or updates an override. Captures original value on first override per target+property. */
    setOverride(target: string, property: string, value: unknown): void;

    /** Removes a single override and optionally resets to original value. */
    removeOverride(target: string, property: string, resetToOriginal?: boolean): void;

    /** Returns the override for a target+property, or undefined. */
    getOverride(target: string, property: string): Readonly<IOverrideEntry> | undefined;

    /** Returns all overrides for a target. */
    getOverridesForTarget(target: string): ReadonlyArray<Readonly<IOverrideEntry>>;

    /** Returns all overrides for a smart asset key (targets starting with "key/"). */
    getOverridesForKey(key: string): ReadonlyArray<Readonly<IOverrideEntry>>;

    /** Returns all overrides. */
    getAllOverrides(): ReadonlyArray<Readonly<IOverrideEntry>>;

    /** Clears all overrides. If resetToOriginal, restores all original values. */
    clearAll(resetToOriginal?: boolean): void;

    // ── Apply ──
    /** Applies all overrides to the scene. */
    applyAllOverrides(): void;

    /** Applies overrides for a specific smart asset key. */
    applyOverridesForKey(key: string): void;

    /** Resets a single property to its original value. */
    resetToOriginal(target: string, property: string): void;

    // ── Serialization ──
    /** Serializes all overrides to a JSON-compatible object. */
    serialize(): IOverrideDocument;

    /** Loads overrides from a serialized document and applies them. */
    loadFromSerialized(data: IOverrideDocument): void;

    // ── Events ──
    /** Fires when an override is added, updated, or removed. */
    readonly onOverrideChangedObservable: Observable<IOverrideChangedEvent>;

    // ── Lifecycle ──
    dispose(): void;
}
```

### 4.2 Override Data Model

```typescript
// packages/dev/core/src/Overrides/overrideEntry.ts

export interface IOverrideEntry {
    /** Target identifier. Format: "<key>/<collection>.<name>" or "scene". */
    readonly target: string;
    /** Property path (dot-separated). E.g., "albedoColor", "subSurface.thickness". */
    readonly property: string;
    /** Override value in JSON-serializable form. */
    readonly value: unknown;
    /** Original value before any override was applied (lazy-captured). */
    readonly originalValue: unknown;
}

export interface IOverrideDocument {
    readonly version: 1;
    readonly overrides: ReadonlyArray<{
        target: string;
        property: string;
        value: unknown;
    }>;
}

export interface IOverrideChangedEvent {
    readonly target: string;
    readonly property: string;
    readonly type: "added" | "updated" | "removed";
}
```

### 4.3 Target Resolution

The override system must resolve a string target identifier to a live scene object. This is the mapping layer between serialized overrides and runtime objects.

```typescript
// packages/dev/core/src/Overrides/overrideTargetResolver.ts

/**
 * Resolves an override target string to a live scene object.
 *
 * Target format:
 *   "scene"                          → scene object itself
 *   "<key>/meshes.<name>"            → mesh loaded by smart asset key
 *   "<key>/materials.<name>"         → material loaded by smart asset key
 *   "<key>/textures.<name>"          → texture loaded by smart asset key
 *   "<key>/animationGroups.<name>"   → animation group loaded by smart asset key
 *   "<key>/lights.<name>"            → light loaded by smart asset key
 *   "<key>/cameras.<name>"           → camera loaded by smart asset key
 *   "meshes.<name>"                  → scene-level mesh (no smart asset key)
 *   "materials.<name>"               → scene-level material (no smart asset key)
 *
 * For smart-loaded objects, resolution searches within the AssetContainer
 * for the key (container-scoped lookup), avoiding cross-key name collisions.
 *
 * For scene-level objects (no key prefix), resolution searches the scene's
 * global collections by name.
 */
export class OverrideTargetResolver {
    constructor(scene: Scene, smartAssetManager?: SmartAssetManager);

    /** Resolves a target string to a live object, or null if not found. */
    resolve(target: string): object | null;

    /** Builds a target string for a given scene object. */
    buildTarget(object: object): string | null;
}
```

**Resolution algorithm:**

```
resolve("sodaCan/materials.canPaint")
  │
  ├─ 1. Split on first "/" → key = "sodaCan", remainder = "materials.canPaint"
  │
  ├─ 2. Split remainder on "." → collection = "materials", name = "canPaint"
  │
  ├─ 3. If SmartAssetManager is available:
  │     → Get container for key "sodaCan"
  │     → Search container.materials for name "canPaint"
  │     → Return the material object
  │
  └─ 4. If not found: return null, log warning
```

For **non-smart-loaded objects** (override system used standalone without smart assets):

```
resolve("materials.canPaint")
  │
  ├─ 1. No "/" → no key prefix, search scene-level
  │
  ├─ 2. Split on "." → collection = "materials", name = "canPaint"
  │
  ├─ 3. Search scene.materials for name "canPaint"
  │
  └─ 4. Return the material object (or null)
```

For **scene-level properties**:

```
resolve("scene")
  │
  └─ Return the Scene object itself
```

### 4.4 Type Conversion System

Override values are stored as JSON-serializable primitives. The type conversion system transforms between JSON and Babylon runtime types using the `@serialize` decorator metadata.

```typescript
// packages/dev/core/src/Overrides/overrideTypeConverters.ts

/**
 * Converts between JSON-serializable override values and Babylon runtime types.
 *
 * Strategy: Use @serialize decorator type codes (0-12) as the primary source
 * of truth for how to interpret values. Fall back to runtime type inspection
 * for properties without decorators.
 */
export class OverrideTypeConverter {
    /**
     * Converts a JSON value to a Babylon runtime value.
     * Uses @serialize metadata from the target class to determine type.
     *
     * @param target - The object whose property is being set
     * @param propertyPath - Dot-separated property path
     * @param jsonValue - The JSON-serializable value from the override
     * @param scene - The scene (needed for texture loading)
     * @returns The converted Babylon value
     */
    static toRuntimeValue(
        target: object,
        propertyPath: string,
        jsonValue: unknown,
        scene: Scene
    ): unknown;

    /**
     * Converts a Babylon runtime value to a JSON-serializable value.
     *
     * @param value - The Babylon runtime value
     * @returns JSON-serializable representation
     */
    static toJsonValue(value: unknown): unknown;
}
```

**Type conversion table:**

| @serialize Type Code | JSON Form | Babylon Type | Conversion |
|:---:|---|---|---|
| 0 | `42`, `true`, `"hello"` | Scalar | Pass through |
| 1 | `{ "url": "path/tex.png" }` | `Texture` | `new Texture(url, scene)` |
| 2 | `"#ff0000"` or `[1, 0, 0]` | `Color3` | `Color3.FromHexString()` or `Color3.FromArray()` |
| 4 | `[0.5, 0.5]` | `Vector2` | `Vector2.FromArray()` |
| 5 | `[0, 1, 0]` | `Vector3` | `Vector3.FromArray()` |
| 8 | `[1, 0, 0, 1]` or `"#ff0000ff"` | `Color4` | `Color4.FromArray()` or `Color4.FromHexString()` |
| 10 | `[0, 0, 0, 1]` | `Quaternion` | `Quaternion.FromArray()` |
| 12 | `[16 numbers]` | `Matrix` | `Matrix.FromArray()` |

**Metadata lookup:**
The `@serialize*` decorators store type codes in a class-level metadata store (via `generateSerializableMember` in `decorators.ts`). The type converter reads this metadata to determine the correct conversion without heuristics.

For properties **without** `@serialize` metadata (rare for public properties, more common for nested sub-properties), the converter falls back to runtime type inspection of the current value:
- If current value is `Color3` → treat array as Color3
- If current value is `Vector3` → treat array as Vector3
- If current value is `null` and property name contains "color" → Color3
- If ambiguous → store with explicit `_type` hint in the JSON

### 4.5 Original Value Snapshots (Lazy)

Original values are captured **lazily** — only when the first override is set for a property:

```typescript
// Inside OverrideManager.setOverride():

setOverride(target: string, property: string, value: unknown): void {
    const existing = this._overrides.get(this._makeKey(target, property));

    if (!existing) {
        // First override for this target+property — snapshot original
        const targetObj = this._resolver.resolve(target);
        if (targetObj) {
            const currentValue = this._getNestedProperty(targetObj, property);
            const originalJson = OverrideTypeConverter.toJsonValue(currentValue);

            this._overrides.set(this._makeKey(target, property), {
                target,
                property,
                value,
                originalValue: originalJson,
            });
        }
    } else {
        // Subsequent override — update value, keep original snapshot
        existing.value = value;
    }

    // Apply the override to the live object
    this._applyOverride(target, property, value);

    this.onOverrideChangedObservable.notifyObservers({
        target, property, type: existing ? "updated" : "added"
    });
}
```

This avoids snapshotting all properties upfront (which would be memory-intensive for complex scenes).

---

## 5. ProjectFile — Composition Layer (M3, M5, M6)

### 5.1 Project File Schema

```typescript
// packages/dev/core/src/ProjectFile/projectFileSchema.ts

export interface IProjectFileDocument {
    /** Schema version. */
    version: 1;

    /** Smart asset entries (M3). Optional — file is valid without assets. */
    assets?: Record<string, ISerializedSmartAssetEntry>;

    /** Property overrides (M5). Optional — file is valid without overrides. */
    overrides?: IOverrideDocument["overrides"];

    /** Provenance snapshot (informational, regenerated on load). */
    provenance?: Record<string, ISmartAssetProvenance>;

    /** Inline objects created in-tool — new materials, lights, etc. (M7). */
    inlineObjects?: ISerializedInlineObject[];
}

export interface ISerializedSmartAssetEntry {
    url: string;
    type?: string;
    extension?: string;
    metadata?: Record<string, unknown>;
}

export interface ISerializedInlineObject {
    /** Object class name for Parse() dispatch. E.g., "PBRMaterial", "PointLight". */
    className: string;
    /** Serialized object data (from SerializationHelper.Serialize). */
    data: Record<string, unknown>;
}
```

**Example project file:**

```json
{
    "version": 1,
    "assets": {
        "sodaCan": { "url": "./assets/soda_can.glb" },
        "table": { "url": "./assets/wooden_table.glb" },
        "skyTexture": { "url": "./textures/sky.env", "type": "texture" }
    },
    "overrides": [
        { "target": "sodaCan/materials.canPaint", "property": "albedoColor", "value": "#ff0000" },
        { "target": "scene", "property": "clearColor", "value": [0.2, 0.2, 0.2, 1.0] }
    ]
}
```

### 5.2 Project File API

```typescript
// packages/dev/core/src/ProjectFile/projectFile.ts

export class ProjectFile {
    constructor(scene: Scene);

    readonly smartAssetManager: SmartAssetManager;
    readonly overrideManager: OverrideManager;

    /** Serializes the current state to a project file document. */
    serialize(): IProjectFileDocument;

    /** Loads a project file, registers all assets, loads them, and applies overrides. */
    loadAsync(source: string | File | IProjectFileDocument, rootUrl?: string): Promise<void>;

    /** Saves the project file to disk (File System Access API with download fallback). */
    saveAsync(filename?: string): Promise<void>;

    dispose(): void;
}
```

### 5.3 Bundle Manager (M6)

```typescript
// packages/dev/core/src/ProjectFile/bundleManager.ts

export class BundleManager {
    constructor(projectFile: ProjectFile);

    /**
     * Packages the project into a .babylonzip archive.
     * Fetches all asset files and bundles them alongside project.json.
     */
    saveBundleAsync(filename?: string): Promise<Blob>;

    /**
     * Loads a .babylonzip archive, unpacks it, and loads the project.
     * Asset URLs are rewritten to blob: URLs pointing at unpacked data.
     */
    loadBundleAsync(source: File | ArrayBuffer): Promise<void>;
}
```

**Bundle internal structure:**
```
my-scene.babylonzip (standard ZIP)
├── project.json        ← IProjectFileDocument with URLs rewritten to assets/
├── assets/
│   ├── soda_can.glb
│   ├── wooden_table.glb
│   └── textures/
│       └── sky.env
```

---

## 6. Inspector v2 Integration (M2, M4)

### 6.1 Service Architecture

Two new Inspector v2 services, following the existing `ServiceDefinition` pattern:

```typescript
// packages/dev/inspector-v2/src/services/smartAssetService.tsx

export const SmartAssetServiceIdentity = Symbol("SmartAssetService");

export interface ISmartAssetService extends IService<typeof SmartAssetServiceIdentity> {
    /** The SmartAssetManager from the current scene, or null. */
    readonly manager: SmartAssetManager | null;
    /** Observable that fires when the manager changes (e.g., new scene loaded). */
    readonly onManagerChangedObservable: IReadonlyObservable<SmartAssetManager | null>;
}

export const SmartAssetServiceDefinition: ServiceDefinition<
    [ISmartAssetService],
    [ISceneContext]
> = {
    friendlyName: "Smart Assets",
    produces: [SmartAssetServiceIdentity],
    consumes: [SceneContextIdentity],
    factory: (sceneContext) => {
        // Watch for scene changes, discover SmartAssetManager via Symbol key
        // If no manager exists on the scene, expose null (pane hidden)
        // ...
    },
};
```

```typescript
// packages/dev/inspector-v2/src/services/overrideService.tsx

export const OverrideServiceIdentity = Symbol("OverrideService");

export interface IOverrideService extends IService<typeof OverrideServiceIdentity> {
    /** The OverrideManager from the current scene, or null. */
    readonly manager: OverrideManager | null;
    /** Whether a given target+property has an active override. */
    hasOverride(entity: object, propertyKey: PropertyKey): boolean;
    /** Reset a property to its original value. */
    resetToOriginal(entity: object, propertyKey: PropertyKey): void;
}
```

### 6.2 Override Tracking from Inspector Edits

The override service subscribes to `PropertyContext.onPropertyChanged` to automatically capture Inspector edits as overrides:

```
Inspector user edits material.albedoColor
  │
  ├─ BoundProperty component sets target[propertyKey] = newValue
  │
  ├─ BoundProperty calls notifyPropertyChanged(entity, "albedoColor", oldValue, newValue)
  │
  ├─ PropertyContext.onPropertyChanged fires with PropertyChangeInfo
  │
  ├─ OverrideService listener receives the event:
  │   ├─ 1. Find which smart asset key owns this entity
  │   │     → smartAssetManager.findKeyForObject(entity) → "sodaCan"
  │   │
  │   ├─ 2. Build target string
  │   │     → "sodaCan/materials.canPaint"
  │   │
  │   ├─ 3. Convert newValue to JSON-serializable form
  │   │     → OverrideTypeConverter.toJsonValue(newValue) → "#ff0000"
  │   │
  │   └─ 4. Call overrideManager.setOverride(target, "albedoColor", "#ff0000")
  │         → Lazy-snapshots original value on first override
  │         → Stores override in the override map
  │
  └─ UI updates: override indicator appears next to the property
```

For **non-smart-loaded objects** (override system standalone), the target string omits the key prefix:
- `overrideTargetResolver.buildTarget(material)` → `"materials.canPaint"` (searched by name in scene collections)

### 6.3 Smart Asset Pane Component

A new pane added to Inspector's left panel (alongside Scene Explorer):

```typescript
// packages/dev/inspector-v2/src/services/panes/smartAssetPaneService.tsx

export const SmartAssetPaneServiceDefinition: ServiceDefinition<
    [],
    [ISmartAssetService, IShellService, ISelectionService]
> = {
    friendlyName: "Smart Asset Pane",
    consumes: [SmartAssetServiceIdentity, ShellServiceIdentity, SelectionServiceIdentity],
    factory: (smartAssetService, shellService, selectionService) => {
        // Only register pane if a SmartAssetManager exists on the scene
        if (smartAssetService.manager) {
            shellService.addPane({
                key: "Smart Assets",
                icon: /* Fluent icon */,
                component: SmartAssetPaneComponent,
            });
        }
    },
};
```

The pane shows:
- List of all registered smart asset entries
- Per-entry: key, URL, load status indicator, provenance summary
- Actions: Reload, Remove, Swap URL, Copy Key
- Missing asset warnings with "Locate" button
- Drag-and-drop zone for adding new assets

### 6.4 Override Visual Indicator

A small modification to the existing `BoundProperty` component or its wrapper to show an override badge:

```typescript
// In the property rendering pipeline:

// The OverrideService exposes a hook:
function useOverrideState(entity: object, propertyKey: PropertyKey) {
    const overrideService = useService(OverrideServiceIdentity);
    return {
        isOverridden: overrideService?.hasOverride(entity, propertyKey) ?? false,
        resetToOriginal: () => overrideService?.resetToOriginal(entity, propertyKey),
    };
}

// Property components use this to render an indicator:
// ┌──────────────────────────────────┐
// │ Albedo Color  [■ red]  [●] [↩]  │
// │                         ^    ^   │
// │                  override  reset │
// │                  indicator       │
// └──────────────────────────────────┘
```

---

## 7. Playground Integration (G5, M3)

### 7.1 Snippet Data Payload

The smart asset table is serialized into the Playground snippet's data payload using the existing `BuildDataPayload` mechanism:

```typescript
// packages/tools/playground/src/tools/smartAssetPlayground.ts

/**
 * Serializes the smart asset table into the Playground snippet payload.
 * Called when saving a snippet that uses smart assets.
 */
function serializeSmartAssetsForSnippet(
    smartAssetManager: SmartAssetManager
): Record<string, ISerializedSmartAssetEntry> {
    const serialized: Record<string, ISerializedSmartAssetEntry> = {};
    for (const [key, entry] of smartAssetManager.getAllAssets()) {
        serialized[key] = {
            url: entry.url,
            type: entry.options.type,
            extension: entry.options.extension,
        };
    }
    return serialized;
}
```

The snippet payload structure extends:
```json
{
    "code": "...",
    "smartAssets": {
        "sodaCan": { "url": "https://example.com/soda_can.glb" },
        "table": { "url": "https://example.com/table.glb" }
    }
}
```

### 7.2 Missing Asset Prompt

Playground provides its own `onAssetNotFound` implementation:

```typescript
smartAssetManager.onAssetNotFound = async (key, expectedUrl) => {
    // Show modal dialog: "Asset 'key' not found at 'expectedUrl'. Locate file?"
    // If user picks a file via file picker → return File object
    // If user cancels → return null
    const file = await showPlaygroundMissingAssetDialog(key, expectedUrl);
    return file;
};
```

---

## 8. File Structure Summary

```
packages/dev/core/src/
├── SmartAssets/
│   ├── index.ts                    ← barrel exports
│   ├── smartAssetManager.ts        ← SmartAssetManager class
│   ├── smartAssetEntry.ts          ← ISmartAssetEntry, ISmartAssetOptions, SmartAssetLoadState
│   ├── smartAssetProvenance.ts     ← ISmartAssetProvenance
│   ├── smartAssetEvents.ts         ← event interfaces
│   ├── smartAssetLoaders.ts        ← ISmartAssetLoader + type-specific loaders
│   └── smartAssetSerializer.ts     ← serialize/deserialize asset map JSON
│
├── Overrides/
│   ├── index.ts                    ← barrel exports
│   ├── overrideManager.ts          ← OverrideManager class
│   ├── overrideEntry.ts            ← IOverrideEntry, IOverrideDocument
│   ├── overrideTargetResolver.ts   ← target string ↔ live object resolution
│   ├── overrideTypeConverters.ts   ← JSON ↔ Babylon type conversion
│   └── overrideSerializer.ts       ← serialize/deserialize override JSON
│
├── ProjectFile/
│   ├── index.ts                    ← barrel exports
│   ├── projectFile.ts              ← ProjectFile class (composes both systems)
│   ├── projectFileSchema.ts        ← IProjectFileDocument schema
│   └── bundleManager.ts            ← BundleManager (zip packaging, M6)
│
└── index.ts                        ← add: export * from "./SmartAssets/index"
                                           export * from "./Overrides/index"
                                           export * from "./ProjectFile/index"

packages/dev/inspector-v2/src/
├── services/
│   ├── smartAssetService.tsx        ← ISmartAssetService + discovery
│   ├── overrideService.tsx          ← IOverrideService + PropertyContext listener
│   └── panes/
│       └── smartAssetPaneService.tsx ← Smart asset visualization pane
│
└── components/
    └── smartAssets/
        ├── smartAssetPane.tsx        ← Pane UI component
        ├── smartAssetEntry.tsx       ← Individual entry row component
        └── smartAssetDragDrop.tsx    ← Drag-and-drop handler

packages/tools/playground/src/
└── tools/
    └── smartAssetPlayground.ts      ← Snippet integration + missing asset prompt
```

---

## 9. Milestone-to-File Mapping

| Milestone | New Files | Modified Files |
|-----------|-----------|----------------|
| **M1** | `SmartAssets/*` (all 6 files) | `core/src/index.ts` (add export) |
| **M2** | `inspector-v2: smartAssetService.tsx, smartAssetPaneService.tsx, smartAssetPane.tsx, smartAssetEntry.tsx, smartAssetDragDrop.tsx` | None |
| **M3** | `SmartAssets/smartAssetSerializer.ts` (if not done in M1) | `playground: smartAssetPlayground.ts` |
| **M4** | `Overrides/*` (all 5 files) | `core/src/index.ts` (add export) |
| **M5** | `Overrides/overrideSerializer.ts` (if not done in M4) | None |
| **M6** | `ProjectFile/*` (all 4 files) | `core/src/index.ts` (add export) |
| **M7** | Updates to `SmartAssets/smartAssetLoaders.ts`, `ProjectFile/projectFileSchema.ts` | Inspector components for texture/animation wiring |

---

## 10. Risk Mitigations

### 🔴 Override Tracking from Inspector Edits

**Risk:** Inspector's `BoundProperty` directly mutates objects. We need to intercept changes to build a diff layer.

**Mitigation:** Subscribe to `PropertyContext.onPropertyChanged` Observable — this already fires for every Inspector edit with `entity`, `propertyKey`, `oldValue`, `newValue`. No modification to Inspector's core property binding needed. The override service listens passively.

**Remaining challenge:** Building the target string from an entity reference requires reverse-lookup through the SmartAssetManager's provenance. This is O(n) over all containers but can be cached with a `WeakMap<object, string>` mapping objects to their target strings.

### 🔴 Browser File I/O

**Risk:** No "just save to the same file" in browsers.

**Mitigation:** Three-tier save strategy:
1. **File System Access API** (`showSaveFilePicker`) — Chrome/Edge, best UX
2. **`<a download>` fallback** — all browsers, triggers download dialog
3. **In-memory** — `serialize()` returns JSON object, caller handles persistence

The Playground already uses this exact pattern in `saveManager.ts`.

### 🟡 API Surface Lock-in

**Mitigation:** Mark all public APIs with `@beta` in doc comments for initial release. Minimal API surface — only the classes and methods listed in sections 3.1 and 4.1 are public. Internal helpers are private/unexported.

---

## 11. Testing Strategy

| Component | Test Type | Framework | Location |
|-----------|-----------|-----------|----------|
| `SmartAssetManager` (registration, load/unload/reload, events) | Unit | Vitest | `packages/dev/core/test/unit/SmartAssets/` |
| `OverrideManager` (CRUD, apply, reset, type conversion) | Unit | Vitest | `packages/dev/core/test/unit/Overrides/` |
| `OverrideTypeConverter` (all type codes, round-trip) | Unit | Vitest | `packages/dev/core/test/unit/Overrides/` |
| `OverrideTargetResolver` (target string ↔ object) | Unit | Vitest | `packages/dev/core/test/unit/Overrides/` |
| `ProjectFile` (serialize/deserialize, round-trip) | Unit | Vitest | `packages/dev/core/test/unit/ProjectFile/` |
| `BundleManager` (zip round-trip) | Integration | Vitest | `packages/dev/core/test/unit/ProjectFile/` |
| Inspector smart asset pane | Integration | Playwright | `packages/dev/inspector-v2/test/integration/` |
| Override indicators in Inspector | Integration | Playwright | `packages/dev/inspector-v2/test/integration/` |
| Playground snippet round-trip | Integration | Playwright | `packages/tools/tests/` |

---

## 12. USD-Inspired Design Principles Applied

| USD Concept | Our Implementation | Where |
|-------------|-------------------|-------|
| **ArResolver** (asset resolution) | `SmartAssetManager` key→URL table + `onAssetNotFound` | M1 |
| **References** (external asset links) | Smart asset entries pointing to external files | M1, M3 |
| **Composition arcs** (non-destructive layering) | Overrides as diffs layered on source assets | M4, M5 |
| **Layer stack** (opinion strength) | Single-layer overrides (v1); architecture permits multi-layer via override document ordering | M4 |
| **Payload deferral** | Explicit `loadAsync` / `unloadAsync` per key (not auto-loaded) | M1 |
| **Variant sets** | URL swapping per key (`setUrl`) | M1 |
| **Stage composition** | ProjectFile composes assets + overrides; BundleManager packages everything | M6 |

**Future multi-layer extension:** The `IProjectFileDocument.overrides` array is ordered. A future version could support multiple named override layers by adding a `layer` field to each entry and a `layers` section defining layer order and visibility. The `OverrideManager.applyAllOverrides()` would apply layers bottom-to-top, matching USD's "strongest opinion wins" model.
