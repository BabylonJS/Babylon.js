# Babylon Authoring Format — Technical Dev Doc

## File Format

### Overview

The Babylon authoring file is a JSON document with its own file extension (TBD — `.bauthoring`, `.bscene`, etc.) that describes how to **compose** a scene from external assets. It does not contain scene data itself — no vertex buffers, no material definitions, no texture bytes. Instead, it contains:

1. **Links** — a table mapping logical keys to external asset files
2. **Overrides** — property diffs applied after loading
3. **Provenance** — a record of which scene objects each key produced

This is fundamentally different from a `.babylon` file, which contains the scene's actual data. The authoring file is more like a playlist — it points to assets and describes how to assemble them.

### Why a separate file extension (not extending `.babylon`)

A `.babylon` file today is **always self-contained and always runnable**. You can drop it into Sandbox and it renders. If we added links to `.babylon`, it would sometimes work and sometimes not depending on whether linked files are reachable. A separate extension sets clear expectations:

- `.babylon` = self-contained, always works
- `.bauthoring` = requires linked assets, designed for iteration

This mirrors the `.gltf` (external refs) vs `.glb` (self-contained) distinction that the ecosystem already understands.

### Schema

```json
{
  "version": 1,
  "links": { ... },
  "provenance": { ... },
  "overrides": [ ... ]
}
```

#### `version` (required)

Schema version number. Allows evolving the format without breaking old files.

```json
"version": 1
```

#### `links` (required)

Maps stable logical keys to external asset references. Each entry contains enough metadata for loader selection.

```json
"links": {
  "sodaCan": {
    "uri": "assets/soda_can.glb",
    "type": "gltf",
    "extension": ".glb"
  },
  "table": {
    "uri": "assets/wooden_table.glb",
    "extension": ".glb"
  },
  "skyTexture": {
    "uri": "textures/sky.env",
    "type": "texture"
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `uri` | Yes | Path to the asset, resolved relative to the authoring file's location |
| `type` | No | Loader type hint (e.g., `"gltf"`, `"babylon"`, `"obj"`, `"texture"`) |
| `extension` | No | File extension hint for loader selection (e.g., `".glb"`, `".gltf"`) |

At minimum, one of `type` or `extension` should be present so the SmartLoader knows which Babylon loader to use. If neither is provided, the loader is inferred from the URI's file extension.

#### `provenance` (optional, populated on save)

Records which scene objects were created when each key was loaded. This is generated at runtime and persisted on save — you don't hand-author this.

```json
"provenance": {
  "sodaCan": {
    "meshes": [
      { "name": "canBody", "index": 0 },
      { "name": "canTab", "index": 1 },
      { "name": "canLabel", "index": 2 }
    ],
    "materials": [
      { "name": "canPaint", "index": 0 },
      { "name": "canMetal", "index": 1 },
      { "name": "canLabelMat", "index": 2 }
    ],
    "textures": [
      { "name": "canPaint_albedo", "index": 0 },
      { "name": "canMetal_normal", "index": 1 }
    ],
    "transformNodes": [
      { "name": "canRoot", "index": 0 }
    ],
    "skeletons": [],
    "animationGroups": [
      { "name": "canOpenAnimation", "index": 0 }
    ]
  }
}
```

Each entry stores both `name` and `index` (position within the AssetContainer's array for that type). Name is the primary lookup; index is a fallback if the name doesn't match (e.g., artist renamed something upstream).

**Runtime vs. serialization:** At runtime, provenance tracks **direct object references** from the `AssetContainer` — no name fragility while the scene is active. Names and indices are only used when saving/loading the authoring file.

**What provenance enables:**
- **Inspector attribution** — clicking a mesh shows "Loaded from key: sodaCan"
- **Selective reload** — `reloadAsync("sodaCan")` knows to dispose exactly these objects and recreate them
- **Key-based selection** — "select all objects from sodaCan" in the scene explorer
- **Export** — bake pipeline knows which objects belong to which key

**Name collision handling:** Overrides and provenance look up objects **within the AssetContainer for that key**, not across the entire scene. This means two keys can both have a mesh named `"Cube"` without conflict — each key's overrides only search within its own container. Cross-key name collisions are not a problem.

#### `overrides` (optional)

Post-load property modifications stored as diffs. Each override targets a specific object loaded by a specific key and sets a single property. Overrides are applied in array order after loading.

```json
"overrides": [
  {
    "key": "sodaCan",
    "target": "materials.canPaint",
    "property": "albedoColor",
    "value": "#ff0000"
  },
  {
    "key": "sodaCan",
    "target": "materials.canPaint",
    "property": "roughness",
    "value": 0.3
  },
  {
    "key": "sodaCan",
    "target": "meshes.canBody",
    "property": "position",
    "value": [0, 1.2, 0]
  },
  {
    "key": "sodaCan",
    "target": "materials.canLabelMat",
    "property": "albedoTexture",
    "value": { "url": "textures/new_label.png" }
  }
]
```

| Field | Description |
|-------|-------------|
| `key` | Which linked asset this override applies to |
| `target` | Dot-path to the scene object: `"collection.objectName"` (e.g., `"materials.canPaint"`, `"meshes.canBody"`) |
| `property` | Property name on the target object (e.g., `"albedoColor"`, `"roughness"`, `"position"`) |
| `value` | The override value (see value resolution below) |

**Target collections:** `materials`, `meshes`, `textures`, `transformNodes`, `lights`, `cameras`

**Value resolution** — the SmartLoader converts shorthand JSON values to Babylon types:

| JSON Value | Babylon Type | Example |
|-----------|-------------|---------|
| `"#ff0000"` | `Color3` | Hex string starting with `#` |
| `[1, 0, 0]` on a color property | `Color3` | 3-number array where property name contains "color" |
| `[1, 2, 3]` on a non-color property | `Vector3` | 3-number array |
| `[1, 0, 0, 1]` | `Color4` | 4-number array |
| `{ "url": "path/to/file.png" }` | `Texture` | Object with `url` field |
| `0.5`, `true`, `"string"` | Scalar | Direct pass-through |

**Key design principle:** Overrides are diffs, not mutations. The source GLB is never modified. If the artist updates `soda_can.glb`, the overrides are reapplied on top of the new version automatically.

### Full Example

```json
{
  "version": 1,
  "links": {
    "sodaCan": {
      "uri": "assets/soda_can.glb",
      "extension": ".glb"
    },
    "table": {
      "uri": "assets/wooden_table.glb",
      "extension": ".glb"
    }
  },
  "provenance": {
    "sodaCan": {
      "meshes": [
        { "name": "canBody", "index": 0 },
        { "name": "canTab", "index": 1 },
        { "name": "canLabel", "index": 2 }
      ],
      "materials": [
        { "name": "canPaint", "index": 0 },
        { "name": "canMetal", "index": 1 },
        { "name": "canLabelMat", "index": 2 }
      ],
      "textures": [
        { "name": "canPaint_albedo", "index": 0 },
        { "name": "canMetal_normal", "index": 1 }
      ],
      "transformNodes": [
        { "name": "canRoot", "index": 0 }
      ],
      "skeletons": [],
      "animationGroups": [
        { "name": "canOpenAnimation", "index": 0 }
      ]
    },
    "table": {
      "meshes": [
        { "name": "tableTop", "index": 0 },
        { "name": "tableLeg1", "index": 1 },
        { "name": "tableLeg2", "index": 2 },
        { "name": "tableLeg3", "index": 3 },
        { "name": "tableLeg4", "index": 4 }
      ],
      "materials": [
        { "name": "woodMaterial", "index": 0 }
      ],
      "textures": [
        { "name": "wood_albedo", "index": 0 },
        { "name": "wood_roughness", "index": 1 }
      ],
      "transformNodes": [],
      "skeletons": [],
      "animationGroups": []
    }
  },
  "overrides": [
    {
      "key": "sodaCan",
      "target": "materials.canPaint",
      "property": "albedoColor",
      "value": "#ff0000"
    },
    {
      "key": "sodaCan",
      "target": "materials.canPaint",
      "property": "roughness",
      "value": 0.3
    },
    {
      "key": "sodaCan",
      "target": "meshes.canBody",
      "property": "position",
      "value": [0, 1.2, 0]
    },
    {
      "key": "sodaCan",
      "target": "materials.canLabelMat",
      "property": "albedoTexture",
      "value": { "url": "textures/new_label.png" }
    }
  ]
}
```

**What happens when this file is loaded:**

1. SmartLoader reads the JSON
2. Loads `assets/soda_can.glb` via the glTF loader → gets meshes, materials, textures → records provenance
3. Loads `assets/wooden_table.glb` → same process
4. Applies overrides in order:
   - `canPaint.albedoColor` → red
   - `canPaint.roughness` → 0.3
   - `canBody.position` → moved up
   - `canLabelMat.albedoTexture` → swapped to new texture
5. Scene is ready

---

## Technical Approach by Milestone

### M1 — Keyed Loading (Runtime API)

**Where it lives:** `packages/dev/core/src/Loading/SmartLoader/`

**Key classes:**
- `SmartLoader` — main class, instantiated per scene
- `ILinkEntry`, `IProvenance`, `IOverride`, `IAuthoringFile`, `ISmartLoaderConfig` — types

**How loading works:**

SmartLoader uses Babylon's existing `AssetContainer` (via `LoadAssetContainerAsync`) as the per-key object scope. Each key gets its own `AssetContainer` that tracks its meshes, materials, textures, etc. in isolated arrays. This gives us scoped object tracking, `addAllToScene()`/`removeAllFromScene()`, and compatibility with all loader plugins — for free.

```
smartLoader.loadAsync("sodaCan")
  → look up key in link table → { uri: "soda_can.glb", extension: ".glb" }
  → resolve URI relative to rootUrl → "assets/soda_can.glb"
  → call LoadAssetContainerAsync("assets/soda_can.glb", scene, { pluginExtension: ".glb" })
  → Babylon's existing SceneLoader picks the glTF plugin, loads the file
  → returns AssetContainer with meshes, materials, textures, etc.
  → record provenance (direct object references from container + name/index snapshot for serialization)
  → apply any registered overrides for this key (search within the container, not the scene)
  → store container reference for later disposal/reload
  → return container to caller
```

**⚠️ Shared resource disposal caveat:**
`AssetContainer.dispose()` disposes all objects in its arrays without checking if they're referenced by other containers. If two keys reference the same texture and you unload one key, `dispose()` will destroy the shared texture and break the other key. SmartLoader must handle this by either:
- Reference-counting shared resources across containers before disposing
- Skipping disposal of resources that are referenced by other loaded containers
- Cloning shared resources at load time to ensure full isolation

This is a known issue to solve in M1.

**Observable pattern** (following Babylon conventions):
```typescript
public readonly onAssetLoadedObservable: Observable<{ key: string; container: AssetContainer }>;
public readonly onLinkChangedObservable: Observable<{ key: string; entry: ILinkEntry }>;
```

**Barrel export:** Add `export * from "./Loading/SmartLoader/index"` to `packages/dev/core/src/index.ts`.

---

### M2 — Inspector: Assembly Tool

**Pane type:** Separate side pane in Inspector — distinct from the scene explorer.

**Key UI components:**

1. **Link list** — table showing all keys, their resolved URIs, and object counts.
2. **Add key** — button that opens a dialog: enter key name + pick a file (URL input or file picker).
3. **Swap file** — click a key's URI → opens file picker or URL input → updates the link and triggers a reload.
4. **Remove key** — context menu action → unloads the key's objects, removes from link table.
5. **Drag-and-drop** — drop a `.glb`/`.gltf` onto the pane or the viewport → auto-generates a key name from the filename → registers link → loads asset.

**How drag-and-drop works technically:**
- Attach `dragover` and `drop` event listeners to the pane element and optionally the canvas
- On drop, read `event.dataTransfer.files` or `event.dataTransfer.getData("text/uri-list")`
- For files: create an object URL via `URL.createObjectURL(file)`, register as link, load
- For URIs: register the URI directly as a link, load
- Auto-generate key name from filename (e.g., `soda_can.glb` → `"sodaCan"`) with collision avoidance

---

### M3 — Authoring File Save/Load

**Serialization** (`saveAuthoringFile()`):
- Iterate the link table → write to plain object
- Iterate the provenance → snapshot name+index from runtime object references → write to plain object
- Copy the overrides array
- Wrap in `{ version: 1, links, provenance, overrides }`
- Return as JSON-serializable object (caller handles `JSON.stringify` and file I/O)

**Deserialization** (`FromAuthoringFile(data)` / `LoadAuthoringFileAsync(url)`):
- Parse JSON
- Validate version field
- Validate required `links` object
- Create SmartLoader instance, populate link table from parsed links
- Restore overrides array
- Provenance is NOT restored from file — it's regenerated when assets are loaded (the saved provenance is informational / for tooling)

**SceneLoader plugin registration:**
- Register a new plugin so `SceneLoader.LoadAsync("scene.bauthoring")` works
- The plugin's `loadAsync` creates a SmartLoader, loads the authoring file, loads all linked assets, and returns the scene
- Extension: TBD (see decisions doc)
- This is additive — no changes to existing plugins

**URI resolution:**
- All `uri` values in the link table are resolved relative to the authoring file's URL, not the HTML page
- `LoadAuthoringFileAsync(url)` derives `rootUrl` from the authoring file URL (everything before the last `/`)
- Each linked asset's URI is then: `rootUrl + link.uri`

---

### M4 — Override System

**Override data model:** `IOverride` — key, target (dot-path `"collection.objectName"`), property, value.

**Value resolution** — converts JSON shorthand to Babylon types:
- `"#ff0000"` → `Color3.FromHexString()`
- `[1, 0, 0]` on a color property → `Color3`
- `[1, 2, 3]` on a non-color property → `Vector3`
- `[1, 0, 0, 1]` → `Color4`
- `{ url: "path.png" }` → `new Texture()`
- Scalars, booleans, strings → pass-through

**Application:** After loading a key's AssetContainer, iterate registered overrides for that key. Resolve the target within the container (not the scene). Apply the value.

**Original value snapshots:** Before applying overrides, snapshot the current value of each overridden property. Store in memory (not in authoring file). Used by M6's "reset to source" feature.

**Observable:**
```typescript
public readonly onOverrideAppliedObservable: Observable<{ override: IOverride; target: unknown }>;
```

---

### M5 — Inspector: Scene Explorer

**Where it lives:** `packages/dev/inspector-v2/src/extensions/smartLoader/`

**How Inspector v2 extensions work:**

Inspector v2 uses a service-based architecture. Adding a new section requires:
1. Define a `ServiceDefinition` that consumes Inspector services (shell, scene context, selection)
2. Register it in the extension feed
3. The service factory adds a tree section to the scene explorer

**Scene explorer section structure:**

```
📁 Linked Assets
  📦 sodaCan → soda_can.glb
    🔷 canBody (Mesh)
    🔷 canTab (Mesh)
    🔷 canLabel (Mesh)
    🎨 canPaint (Material)
    🎨 canMetal (Material)
  📦 table → wooden_table.glb
    🔷 tableTop (Mesh)
    🔷 tableLeg1 (Mesh)
    ...
```

**How the tree populates:** The SmartLoader's provenance data provides the key → object mapping. At runtime, provenance holds direct object references — no name lookup needed for the tree.

**How Inspector discovers the SmartLoader:** The SmartLoader needs to be discoverable from the scene. Options include storing on `scene.metadata`, using a WeakMap, or a dedicated registry. This is an open design question (see decisions doc #9).

**Selection:** Clicking a key node selects all objects from that key's provenance. Clicking a child node selects that individual object.

---

### M6 — Inspector: Override Editing

**The core challenge:** When a user edits a property in Inspector (e.g., changes a material's color), Inspector directly mutates the object. We need to intercept this mutation and also record it as an override in the SmartLoader.

**Requirements:**
1. Detect when a property changes on a SmartLoader-loaded object
2. Distinguish the **original value** (from the source asset, before any overrides) from the current value
3. Record the change as an override in the SmartLoader
4. Allow resetting to the original value

**Approach — observer-based tracking:**

1. When a SmartLoader-loaded object is selected in Inspector, the SmartLoader service activates property watching on that object.
2. Inspector v2 already fires `PropertyChangeInfo` notifications (with `oldValue` and `newValue`) via `notifyPropertyChanged()`. This is the hook we need.
3. When a watched property changes, compare the new value to the **original value** (snapshotted in M4, before any overrides were applied). If different, create or update an override entry via M4's override system.
4. The override is immediately reflected in `getOverrides()` and will be persisted on the next `saveAuthoringFile()`.

**Original value snapshots:**
- At load time, before applying overrides, SmartLoader snapshots the values of all overridable properties on each loaded object
- These snapshots are stored in memory (not in the authoring file)
- "Reset to source" reads from this snapshot and restores the value

**Properties pane additions:**
- When a SmartLoader-loaded object is selected, add an "Asset Info" section at the top: key name, resolved URI, "loaded from SmartLoader" badge
- For each property that has an override, show a visual diff indicator (e.g., dot, highlight, or "(modified)" label) and a "reset to original" button

---

### M7 — Export / Bake

**Requirements:**
1. Load all linked assets into a single scene
2. Apply all overrides
3. Produce a self-contained output file (GLB or .babylon) with no external dependencies
4. Strip all SmartLoader metadata from the output

**Bake pipeline:**

```
smartLoader.exportAsync("output.glb", { format: "glb" })
  → create a temporary Scene
  → for each key in the link table:
      → load the asset into the temp scene via LoadAssetContainerAsync
      → apply overrides for this key
      → call container.addAllToScene() to merge into the temp scene
  → handle material sharing conflicts (clone overridden materials if shared across keys)
  → wait for all textures to finish loading (scene.whenReadyAsync())
  → serialize the temp scene to the target format
  → strip any SmartLoader metadata from the output
  → clean up temp scene
  → return the output data
```

**Material isolation on override:**
- Before applying overrides, check if a material is referenced by objects from multiple keys
- If so, clone the material and assign the clone to the objects that have overrides
- This prevents overrides on one key's objects from bleeding into another key's objects

**Metadata stripping:**
- Before export, remove any SmartLoader-specific metadata from scene objects
- The output file should have no trace of SmartLoader — it's a clean, portable file

**Two export formats:**
- **GLB** — universal, portable, supports compression. Uses `GLTF2Export.GLBAsync()`. Note: some Babylon-specific material features may not survive conversion to glTF PBR.
- **.babylon** — Babylon.js only, full fidelity. Uses `SceneSerializer.SerializeAsync()`.

Both use the same bake pipeline — only the final serialization step differs.

---

*Note: Automatic file watching (smart reload) was considered but deferred. Manual reload is available via the assembly tool context menu (M2) and the `reloadAsync(key)` API (M1). Teams can wire up their own file watchers that call `reloadAsync` if they want automation.*
