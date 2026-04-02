# Babylon Authoring Format — Requirements

**Last updated:** March 31, 2026
**Source:** [Goals](goals.md) · [Milestones v2](../../babylon-authoring-format-milestones-v2.md) · [Design Decisions](../../babylon-authoring-format-decisions.md) · [Risks](../../babylon-authoring-format-risks.md) · [Technical Dev Doc](../../babylon-authoring-format-devdoc.md)

---

## 1. System Overview

The Babylon Authoring Format is a compositional authoring layer for Babylon.js composed of **two independent systems** — Smart Assets and Override Persistence — that can be used alone or together via a project file.

### System Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                    Babylon Authoring Layer                       │
│                                                                 │
│  ┌──────────────────────┐    ┌──────────────────────────────┐   │
│  │   Smart Assets (G1)  │    │  Override Persistence (G2)   │   │
│  │                      │    │                              │   │
│  │  • Asset table       │    │  • Override data model       │   │
│  │  • Key→URL mapping   │    │  • Property change tracking  │   │
│  │  • Load/unload/reload│    │  • Original value snapshots  │   │
│  │  • Provenance        │    │  • Override application      │   │
│  │  • Missing asset CB  │    │  • Save/load overrides       │   │
│  └──────────┬───────────┘    └──────────────┬───────────────┘   │
│             │                               │                   │
│             └───────────┬───────────────────┘                   │
│                         │                                       │
│              ┌──────────▼──────────┐                            │
│              │   Project File      │                            │
│              │                     │                            │
│              │  • assets section   │                            │
│              │  • overrides section│                            │
│              │  • Either can be ∅  │                            │
│              └──────────┬──────────┘                            │
│                         │                                       │
│              ┌──────────▼──────────┐                            │
│              │   Portable Bundle   │                            │
│              │   (.babylonzip)     │                            │
│              │                     │                            │
│              │  • Project file     │                            │
│              │  • All asset files  │                            │
│              └─────────────────────┘                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Inspector v2 Integration                   │    │
│  │                                                         │    │
│  │  • Smart asset visualization pane                       │    │
│  │  • Drag-and-drop to add assets                          │    │
│  │  • Override visual indicators                           │    │
│  │  • Save/load UI                                         │    │
│  │  • Asset composition UX                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Playground Integration (G5)                │    │
│  │                                                         │    │
│  │  • Asset table serialized with snippets                 │    │
│  │  • Missing asset prompt (modal file picker)             │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘

External Dependencies (unchanged):
  • SceneLoader / LoadAssetContainerAsync
  • AssetContainer (addAllToScene / removeAllFromScene)
  • SerializationHelper / @serialize decorators
  • Inspector v2 PropertyContext / BoundProperty / InterceptProperty
  • GLTF2Export (for bake-to-GLB)
  • Observable (event system)
  • FileToolsOptions (URL resolution)
  • Snippet server API (Playground integration)
  • JSZip (bundle packaging)
  • File System Access API (browser save/load)
```

### Actors

| Actor | Description |
|-------|-------------|
| **Developer** | Uses the SmartAsset API in code to reference assets by key. Consumes the runtime API. |
| **Artist** | Uses Inspector to compose scenes, tweak properties, and save/load projects. Primarily uses UI. |
| **Recipient** | Opens a shared project bundle or snippet. May need to locate missing assets. |

---

## 2. Functional Requirements — M1: SmartAsset Loading

### FR-1.1: Asset Table Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1.1 | The system SHALL provide an API to register a smart asset entry mapping a string key to a URL. | Must |
| FR-1.1.2 | Each key SHALL be unique within the asset table. Registering a duplicate key SHALL throw or replace based on a configurable policy. | Must |
| FR-1.1.3 | The system SHALL provide APIs to remove an entry by key, retrieve an entry by key, and list all entries. | Must |
| FR-1.1.4 | Keys SHALL be case-sensitive strings. Valid key characters: alphanumeric, hyphens, underscores, dots. | Must |
| FR-1.1.5 | Each entry SHALL store at minimum: `key`, `url`. Optional metadata: `type` (loader hint), `extension` (file extension hint). | Must |

### FR-1.2: Key-Based Loading

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.2.1 | The system SHALL provide `loadAsync(key): Promise<AssetContainer>` to load an asset by key. | Must |
| FR-1.2.2 | Loading SHALL use `LoadAssetContainerAsync` internally and call `addAllToScene()` on the resulting container. | Must |
| FR-1.2.3 | The system SHALL track which `AssetContainer` was produced by which key (provenance). | Must |
| FR-1.2.4 | The system SHALL provide `loadAllAsync(): Promise<AssetContainer[]>` to load all registered entries concurrently. | Must |
| FR-1.2.5 | If an asset is already loaded for a key, `loadAsync` SHALL skip loading and return the existing container. | Must |

### FR-1.3: Key-Based Unloading

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.3.1 | The system SHALL provide `unloadAsync(key): Promise<void>` to remove all scene objects produced by a key. | Must |
| FR-1.3.2 | Unloading SHALL call `removeAllFromScene()` followed by `dispose()` on the key's `AssetContainer`. | Must |
| FR-1.3.3 | After unloading, the key SHALL remain in the asset table (entry is not removed, just unloaded). | Must |

### FR-1.4: Key-Based Reloading

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.4.1 | The system SHALL provide `reloadAsync(key): Promise<AssetContainer>` that unloads and re-loads an asset. | Must |
| FR-1.4.2 | After reload, any overrides associated with the key (if override system is active) SHALL be reapplied automatically. | Must |

### FR-1.5: Asset Type Support

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.5.1 | The system SHALL support loading GLB and glTF files as `AssetContainer` objects. | Must |
| FR-1.5.2 | The system SHALL support loading standalone texture files (PNG, JPG, EXR, ENV, HDR) as `Texture` objects. | Must |
| FR-1.5.3 | The system SHALL support loading node material JSON files as `NodeMaterial` objects. | Should |
| FR-1.5.4 | The system SHALL support loading animation files (standalone glTF animations) as `AnimationGroup` objects. | Should |
| FR-1.5.5 | The system SHALL support loading OBJ files via SceneLoader's plugin system. | Should |
| FR-1.5.6 | Loader selection SHALL be inferred from the entry's `extension` field, `type` field, or the URL's file extension, in that order. | Must |

### FR-1.6: Event Notifications

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.6.1 | The system SHALL expose an `Observable` that fires when an asset finishes loading (with key and container). | Must |
| FR-1.6.2 | The system SHALL expose an `Observable` that fires when an asset's URL is changed (with key, old URL, new URL). | Must |
| FR-1.6.3 | The system SHALL expose an `Observable` that fires when an asset fails to load (with key, URL, and error). | Must |
| FR-1.6.4 | The system SHALL expose an `Observable` that fires when an asset is unloaded (with key). | Should |

### FR-1.7: Missing Asset Resolution

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.7.1 | The system SHALL accept an optional callback `onAssetNotFound: (key: string, expectedUrl: string) => Promise<string \| File \| null>`. | Must |
| FR-1.7.2 | When an asset fails to load (404, CORS, parse error), the system SHALL invoke `onAssetNotFound` if registered. | Must |
| FR-1.7.3 | If `onAssetNotFound` returns a new URL or `File`, the system SHALL retry loading with the new source. | Must |
| FR-1.7.4 | If `onAssetNotFound` returns `null` or is not registered, the asset SHALL be skipped with a console warning. | Must |
| FR-1.7.5 | Different consumers (Inspector, Playground) SHALL provide their own `onAssetNotFound` implementations. | Must |

### FR-1.8: URL Swapping

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.8.1 | The system SHALL provide `setUrl(key, newUrl)` to change the URL behind an existing key. | Must |
| FR-1.8.2 | If the key's asset is currently loaded, `setUrl` SHALL trigger an automatic reload with the new URL. | Must |
| FR-1.8.3 | `setUrl` SHALL fire the URL change observable (FR-1.6.2). | Must |

### FR-1.9: Local File Persistence

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.9.1 | When a local `File` object is used (from drag-and-drop or file picker), the system SHALL persist a file handle reference (via File System Access API + IndexedDB) so the mapping survives page refresh. | Should |
| FR-1.9.2 | On page load, if persisted handles exist, the system SHALL attempt to re-acquire permissions and restore mappings. | Should |
| FR-1.9.3 | If permission re-acquisition fails, the system SHALL treat the asset as missing and invoke `onAssetNotFound`. | Should |

---

## 3. Functional Requirements — M2: SmartAsset Inspector UX

### FR-2.1: Drag-and-Drop to Add Assets

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1.1 | Inspector SHALL accept drag-and-drop of files (.glb, .gltf, .obj, textures, material JSON, animation files) onto the viewport or Inspector pane. | Must |
| FR-2.1.2 | Dropped files SHALL be added to the scene as new smart asset entries with auto-generated keys. | Must |
| FR-2.1.3 | Auto-generated keys SHALL be derived from the filename (minus extension, sanitized to valid key characters). | Must |
| FR-2.1.4 | If a key collision occurs during drag-and-drop, the system SHALL append a numeric suffix (e.g., `chair_2`). | Must |

### FR-2.2: File/URL Input

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.2.1 | Inspector SHALL provide a URL input field as an alternative to drag-and-drop for adding assets. | Must |
| FR-2.2.2 | Inspector SHALL provide a file picker button (using File System Access API where available, `<input type="file">` as fallback). | Should |

### FR-2.3: Key Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.3.1 | Inspector SHALL allow renaming a key (updates the entry, preserves loaded state and overrides). | Must |
| FR-2.3.2 | Inspector SHALL allow removing a key (unloads the asset and removes the entry). | Must |
| FR-2.3.3 | Inspector SHALL allow swapping the URL for an existing key (triggers reload). | Must |

### FR-2.4: Smart Asset Visualization Pane

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.4.1 | Inspector SHALL display a dedicated pane showing all smart asset entries. | Must |
| FR-2.4.2 | Each entry SHALL display: key name, resolved URL, load status (loaded/loading/error/not loaded). | Must |
| FR-2.4.3 | Each entry SHALL display which scene objects came from it (provenance: mesh names, material names, etc.). | Should |
| FR-2.4.4 | Missing or broken assets SHALL be shown as warning entries with "Locate" / "Re-link" action buttons. | Must |
| FR-2.4.5 | Clicking a key in the pane SHALL select its scene objects in the scene explorer. | Should |
| FR-2.4.6 | Each entry SHALL have a context menu with: Reload, Remove, Copy Key, Swap URL. | Should |

### FR-2.5: Inspector v2 Integration

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.5.1 | The smart asset pane SHALL be implemented as an Inspector v2 service extension following the `ServiceDefinition` pattern. | Must |
| FR-2.5.2 | The pane SHALL consume `ISceneContext` to access the scene and discover the SmartAsset system. | Must |
| FR-2.5.3 | The pane SHALL use shared-ui-components wrappers for form elements (per Inspector v2 guidelines). | Must |
| FR-2.5.4 | The pane SHALL use `makeStyles` for styling (no inline styles except truly dynamic values). | Must |

---

## 4. Functional Requirements — M3: Save/Load SmartAsset Map

### FR-3.1: JSON Schema

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1.1 | The smart asset map SHALL be serialized as a versioned JSON document. | Must |
| FR-3.1.2 | The schema SHALL include: `version` (integer), `assets` (key→entry map). | Must |
| FR-3.1.3 | Each entry SHALL include: `url` (string, required), `type` (string, optional), `extension` (string, optional). | Must |
| FR-3.1.4 | The schema SHALL include a `provenance` section (optional, populated on save) recording which objects each key produced. | Should |

### FR-3.2: Save API

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.2.1 | The system SHALL provide `serializeAssetMap(): object` returning the asset table as a JSON-serializable object. | Must |
| FR-3.2.2 | The system SHALL provide `saveAssetMapAsync(filename?: string): Promise<void>` using File System Access API (with `<a download>` fallback). | Should |
| FR-3.2.3 | URIs in the saved file SHALL be resolved relative to the asset map file's location. | Must |

### FR-3.3: Load API

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.3.1 | The system SHALL provide `loadAssetMapAsync(source: string \| File \| object): Promise<void>` to load an asset map from URL, File, or parsed JSON. | Must |
| FR-3.3.2 | On load, the system SHALL validate the schema (version number, required fields). | Must |
| FR-3.3.3 | On load, the system SHALL register all entries in the asset table and begin loading assets. | Must |
| FR-3.3.4 | Assets that fail to load SHALL trigger `onAssetNotFound` (FR-1.7). | Must |

### FR-3.4: URI Resolution

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.4.1 | Relative URIs SHALL be resolved relative to the asset map file's location. | Must |
| FR-3.4.2 | Absolute URIs (http://, https://) SHALL be used as-is. | Must |
| FR-3.4.3 | Data URIs (data:) SHALL be supported for embedded assets. | Should |

### FR-3.5: Playground Integration (G5)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.5.1 | The asset table SHALL be serializable as part of a Playground snippet's JSON payload (via the snippet server's data envelope). | Must |
| FR-3.5.2 | Playground SHALL provide its own `onAssetNotFound` implementation that shows a modal file picker. | Must |
| FR-3.5.3 | When sharing a snippet that uses smart assets, the recipient SHALL see a prompt for any assets that can't be resolved from the snippet data. | Must |

---

## 5. Functional Requirements — M4: Inspector Overrides Tracking

### FR-4.1: Override Data Model

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1.1 | An override SHALL consist of: `target` (object identifier), `property` (property path string), `value` (JSON-serializable value). | Must |
| FR-4.1.2 | The `target` identifier SHALL uniquely identify a scene object. For smart-loaded objects: `"<key>/<collection>.<name>"` (e.g., `"sodaCan/materials.canPaint"`). For scene-level: `"scene"`. | Must |
| FR-4.1.3 | The `property` path SHALL support dot-separated nested paths (e.g., `"subSurface.thickness"`, `"albedoColor"`). | Must |
| FR-4.1.4 | Override values SHALL support: scalars (number, boolean, string), hex color strings, numeric arrays (→ Vector2/3/4, Color3/4, Quaternion, Matrix), and texture references (`{ url: string }`). | Must |

### FR-4.2: Override Tracking from Inspector

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.2.1 | When a property is edited in Inspector and the override system is active, the change SHALL be automatically captured as an override. | Must |
| FR-4.2.2 | The system SHALL subscribe to `PropertyContext.onPropertyChanged` to intercept all Inspector property edits. | Must |
| FR-4.2.3 | The system SHALL distinguish between the original value (from the source asset at load time) and subsequent override values. | Must |
| FR-4.2.4 | If a property is edited multiple times, only the latest value SHALL be stored (not a history). | Must |

### FR-4.3: Original Value Snapshots

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.3.1 | When an asset is loaded (or when the override system is first attached to a scene), the system SHALL snapshot the values of all properties that later receive overrides. | Must |
| FR-4.3.2 | Snapshots SHALL be taken lazily — only when the first override is recorded for a property, not upfront for all properties. | Must |
| FR-4.3.3 | The snapshot SHALL store the value in a JSON-serializable form. | Must |

### FR-4.4: Override Application

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.4.1 | The system SHALL provide `applyOverrides()` to apply all stored overrides to the current scene. | Must |
| FR-4.4.2 | Override application SHALL handle type conversion: hex string → `Color3`, numeric array → `Vector3`/`Color4`/etc., `{ url }` → `Texture`. | Must |
| FR-4.4.3 | After a smart asset reload (FR-1.4), overrides for that key SHALL be automatically reapplied. | Must |
| FR-4.4.4 | Override application order SHALL be deterministic (order of the overrides array). | Must |
| FR-4.4.5 | If an override target is not found in the scene (e.g., object was renamed upstream), the system SHALL log a warning and skip that override. | Must |

### FR-4.5: Override Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.5.1 | The system SHALL provide APIs to: add an override, remove an override (by target+property), query overrides (by target, by key, all), and clear all overrides. | Must |
| FR-4.5.2 | The system SHALL provide `resetToOriginal(target, property)` to restore the original value from the snapshot and remove the override. | Must |
| FR-4.5.3 | The system SHALL provide `resetAllToOriginal()` to restore all overridden properties and clear all overrides. | Should |

### FR-4.6: Inspector Visual Indicators

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.6.1 | Inspector SHALL display a visual indicator (badge, icon, or color) next to any property that has an active override. | Must |
| FR-4.6.2 | Inspector SHALL provide a "Reset to original" action per overridden property. | Must |
| FR-4.6.3 | Inspector SHALL provide a way to view the original value alongside the current overridden value. | Should |

### FR-4.7: Scene-Level Overrides

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.7.1 | The override system SHALL support overrides on scene-level properties: `clearColor`, `ambientColor`, `fogMode`, `fogColor`, `fogDensity`, `fogStart`, `fogEnd`, `environmentTexture`. | Must |
| FR-4.7.2 | Scene-level overrides SHALL use `"scene"` as the target identifier. | Must |

---

## 6. Functional Requirements — M5: Save/Load Inspector Overrides

### FR-5.1: Override Persistence

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1.1 | The system SHALL provide `serializeOverrides(): object` returning all overrides as a JSON-serializable object. | Must |
| FR-5.1.2 | The system SHALL provide `saveOverridesAsync(filename?: string): Promise<void>` to save overrides to a standalone JSON file. | Should |
| FR-5.1.3 | The system SHALL provide `loadOverridesAsync(source: string \| File \| object): Promise<void>` to load overrides and apply them to the current scene. | Must |

### FR-5.2: Round-Trip Fidelity

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.2.1 | Save → Load → Save SHALL produce identical JSON output (no silent data loss or mutation). | Must |
| FR-5.2.2 | All supported value types (scalars, colors, vectors, textures) SHALL round-trip correctly. | Must |

---

## 7. Functional Requirements — M6: Save/Load Babylon Zip

### FR-6.1: Bundle Save

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.1.1 | The system SHALL provide `saveBundleAsync(filename?: string): Promise<void>` to create a `.babylonzip` archive. | Must |
| FR-6.1.2 | The archive SHALL be a standard ZIP file containing: `project.json` (asset map + overrides), and an `assets/` directory with all referenced files. | Must |
| FR-6.1.3 | URIs in `project.json` SHALL be rewritten to reference the local `assets/` directory paths. | Must |
| FR-6.1.4 | The system SHALL fetch all referenced asset files and include them in the zip. | Must |
| FR-6.1.5 | The system SHALL use JSZip (already available in the codebase) for zip creation. | Must |

### FR-6.2: Bundle Load

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.2.1 | The system SHALL provide `loadBundleAsync(source: File \| ArrayBuffer): Promise<void>` to load a `.babylonzip` archive. | Must |
| FR-6.2.2 | On load, the system SHALL unpack the zip, parse `project.json`, and resolve asset URLs to the unpacked data (using blob URLs or in-memory). | Must |
| FR-6.2.3 | On load, the system SHALL validate that all referenced files are present in the archive. | Must |
| FR-6.2.4 | Missing files SHALL be reported as errors (not silently skipped). | Must |

### FR-6.3: Bundle Structure

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.3.1 | The bundle SHALL follow a well-known internal structure: | Must |

```
my-scene.babylonzip
├── project.json        (asset map + overrides, combined)
├── assets/
│   ├── model.glb
│   ├── texture.png
│   └── ...
```

### FR-6.4: Inspector UI

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.4.1 | Inspector SHALL provide a "Save as Bundle" action in the smart asset pane or tools pane. | Must |
| FR-6.4.2 | Inspector SHALL provide a "Load Bundle" action that accepts a `.babylonzip` file. | Must |

---

## 8. Functional Requirements — M7: Asset Composition

### FR-7.1: Individual Asset Import

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.1.1 | Smart assets SHALL support loading standalone texture files as individual smart asset entries. | Must |
| FR-7.1.2 | Smart assets SHALL support loading standalone animation files as individual smart asset entries. | Must |
| FR-7.1.3 | Smart assets SHALL support loading node material JSON files as individual smart asset entries. | Must |

### FR-7.2: Inline Objects

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.2.1 | The project file schema SHALL support an `inlineObjects` section for objects created in-tool (new materials, lights, cameras) that don't come from any smart asset. | Must |
| FR-7.2.2 | Inline objects SHALL be serialized using Babylon's existing `serialize()` / `SerializationHelper.Serialize()` system. | Must |
| FR-7.2.3 | On project load, inline objects SHALL be reconstructed via their static `Parse()` methods. | Must |

### FR-7.3: Material-Texture Wiring

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.3.1 | Inspector SHALL allow assigning a smart-asset-loaded texture to a material's texture slot (albedo, normal, roughness, etc.). | Must |
| FR-7.3.2 | The assignment SHALL be persisted as an override (texture reference in the override value). | Must |

### FR-7.4: Animation Wiring

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.4.1 | Inspector SHALL allow assigning imported animation groups to meshes or skeletons. | Must |
| FR-7.4.2 | Animation assignments SHALL be persisted in the project file. | Must |

### FR-7.5: GLB Export

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.5.1 | The system SHALL provide an "Export to GLB" action that bakes the composed scene (all smart assets + overrides + inline objects) into a single GLB file via `GLTF2Export.GLBAsync`. | Must |
| FR-7.5.2 | Before export, all overrides SHALL be applied to the scene objects. | Must |
| FR-7.5.3 | The system SHALL warn if the scene contains non-exportable elements (node materials, custom shaders). | Should |

### FR-7.6: Animation Assembly (M7 Stakeholder Goal)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.6.1 | The system SHALL support importing animation files and assigning them to meshes/skeletons. | Should |
| FR-7.6.2 | Animation groups SHALL be manageable in Inspector (list, assign, unassign, reorder). | Should |

### FR-7.7: Integrated Compression (M7 Stakeholder Goal)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.7.1 | GLB export SHALL support Draco geometry compression via `GLTF2Export`'s `meshCompressionMethod: "Draco"` option. | Should |
| FR-7.7.2 | The system SHOULD support Basis texture compression for exported textures. | Could |

---

## 9. Non-Functional Requirements

### NFR-1: Backward Compatibility

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1.1 | The system SHALL NOT modify any existing public APIs on Scene, SceneLoader, AssetContainer, Material, or any other existing class. | Must |
| NFR-1.2 | Existing `.babylon` files, glTF loading, and Inspector behavior SHALL be completely unaffected. | Must |
| NFR-1.3 | The smart asset system SHALL be opt-in — scenes that don't use it SHALL work exactly as before. | Must |

### NFR-2: Performance

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-2.1 | Smart asset loading SHALL NOT introduce allocations in the render loop. | Must |
| NFR-2.2 | Override application SHALL be a one-time operation at load time, not per-frame. | Must |
| NFR-2.3 | `loadAllAsync` SHALL load assets concurrently (not sequentially). | Must |
| NFR-2.4 | Override snapshots SHALL be lazy (FR-4.3.2) to minimize memory overhead. | Must |

### NFR-3: API Design

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-3.1 | All public APIs SHALL have complete multi-line doc comments per Babylon conventions. | Must |
| NFR-3.2 | `Function.bind` SHALL NOT be used (use arrow functions instead, per Babylon conventions). | Must |
| NFR-3.3 | The API surface SHOULD be reviewed by core team before shipping M1. Consider marking as `@beta` via doc comments until stable. | Should |
| NFR-3.4 | The API SHALL use `Observable<T>` for all event notifications (per Babylon conventions). | Must |

### NFR-4: Browser Compatibility

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-4.1 | Core smart asset loading (M1) SHALL work in all browsers supported by Babylon.js. | Must |
| NFR-4.2 | File save operations SHALL use File System Access API where available (Chrome/Edge) with `<a download>` fallback for other browsers. | Must |
| NFR-4.3 | Local file handle persistence (FR-1.9) is permitted to be Chrome/Edge only (progressive enhancement). | May |

### NFR-5: Testability

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-5.1 | M1 (SmartAsset loading) SHALL have comprehensive unit tests covering: registration, load/unload/reload, concurrent loading, missing assets, URL swapping, event notifications. | Must |
| NFR-5.2 | M4 (Override tracking) SHALL have unit tests covering: override creation, application, type conversion, original value snapshots, reset, round-trip serialization. | Must |
| NFR-5.3 | M2/M6 (Inspector integration) SHOULD have Playwright integration tests for critical UI flows. | Should |
| NFR-5.4 | M6 (Babylon zip) SHALL have round-trip tests: save bundle → load bundle → verify scene matches. | Must |

### NFR-6: Schema Evolution

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-6.1 | All JSON schemas (asset map, overrides, project file, bundle) SHALL include a `version` field. | Must |
| NFR-6.2 | Loaders SHALL validate the version field and reject unsupported versions with a clear error message. | Must |
| NFR-6.3 | Future versions SHALL provide migration logic for older schemas. | Should |

---

## 10. Integration Points with Existing Babylon.js Systems

### IP-1: SceneLoader / LoadAssetContainerAsync

- Smart asset loading wraps `LoadAssetContainerAsync` — does not replace it.
- Loader plugin selection uses the existing plugin registry (glTF, OBJ, .babylon, etc.).
- The `pluginExtension` option on `LoadAssetContainerOptions` is used when the entry has an `extension` field.

### IP-2: AssetContainer Lifecycle

- Each smart asset key produces exactly one `AssetContainer`.
- `addAllToScene()` adds objects to the scene; `removeAllFromScene()` removes them.
- Provenance is tracked by associating the container's contents with the key.
- Cross-key references (mesh from key A using material from key B) are the user's responsibility — the system does not prevent or manage them.

### IP-3: Inspector v2 PropertyContext

- Override tracking subscribes to `PropertyContext.onPropertyChanged` Observable.
- The `PropertyChangeInfo` event provides `entity`, `propertyKey`, `oldValue`, `newValue`.
- The system must map `entity` back to a target identifier (find which key's container owns this object).
- `InterceptProperty` hooks can be used for property-level interception if needed.

### IP-4: SerializationHelper / @serialize Decorators

- The `@serialize*` type codes (0-12) inform how override values should be converted between JSON and Babylon types.
- `SerializationHelper.Serialize()` is used for serializing inline objects (M7).
- `SerializationHelper.Parse()` is used for deserializing inline objects (M7).

### IP-5: FileToolsOptions

- The open architecture question (standalone class vs `asset://` in FileTools) determines whether URL interception happens at the `PreprocessUrl` level or at a higher abstraction.
- If `asset://` is chosen, `FileToolsOptions.PreprocessUrl` would transform `asset://key` → resolved URL.
- If standalone class is chosen, URL resolution is internal to the SmartAsset class.

### IP-6: Snippet Server

- Playground integration (G5) uses `FetchSnippet` and `SaveSnippet` from `packages/tools/snippetLoader/src/`.
- The smart asset table would be included in the snippet's data payload (using `BuildDataPayload`).
- The snippet format already supports arbitrary JSON data payloads.

### IP-7: GLTF2Export

- GLB export (M7) uses `GLTF2Export.GLBAsync(scene, filename, options)`.
- Export options support Draco compression via `meshCompressionMethod: "Draco"`.
- Known limitations: node materials and custom shaders have limited export support.

### IP-8: JSZip

- Bundle packaging (M6) uses JSZip (already a global dependency in the Playground).
- May need to add JSZip as a dependency in the core or tools package where the bundle logic lives.

---

## 11. Open Architecture Questions (for Architecture Phase)

| # | Question | Impact |
|---|----------|--------|
| 1 | **Standalone class vs. `asset://` protocol in FileTools** — determines the integration point for asset resolution and whether existing URL-based APIs automatically support smart assets. | M1 API surface, all downstream |
| 2 | **Where does the SmartAsset system live?** — `packages/dev/core/` (available everywhere) vs. a new package vs. `packages/tools/` (tools only). | Package structure, dependency graph |
| 3 | **How does Inspector discover the SmartAsset system?** — `scene.metadata.smartLoader` (fragile) vs. Symbol key on metadata vs. WeakMap keyed by scene vs. first-class scene property. | M2, Inspector integration |
| 4 | **Override target identification for non-smart-loaded objects** — When there's no key, how is the target identified? By name? By uniqueId? By scene path? | M4, G2 (overrides on ANY object) |
| 5 | **Type conversion heuristics vs. explicit type hints** — How does the override system know if `[1, 0, 0]` is a Vector3 or Color3? Use property metadata from `@serialize` decorators? Use explicit type field in override? | M4, correctness |
| 6 | **File extension for the authoring format** — `.bauthoring`, `.bscene`, `.bab`, or something else. | M3, M6, user-facing |
| 7 | **JSZip packaging** — Should JSZip be a core dependency or a tools-only dependency? Does the bundle system belong in core or tools? | M6, package structure |

---

## 12. Traceability Matrix

| Goal | Milestones | Key Requirements |
|------|-----------|------------------|
| G1 — Smart Assets | M1, M2, M3 | FR-1.*, FR-2.*, FR-3.1–3.4 |
| G2 — Override Persistence | M4, M5 | FR-4.*, FR-5.* |
| G3 — Asset Composition | M7 | FR-7.* |
| G4 — Portable Bundle | M6 | FR-6.* |
| G5 — Playground Integration | M3 | FR-3.5.* |
