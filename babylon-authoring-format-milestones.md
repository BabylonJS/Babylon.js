# Babylon Authoring Format — Milestone Breakdown

**Assumptions:**
- ~85% time allocation to this project
- AI-assisted development throughout (Copilot CLI)
- Building from scratch
- All changes must be backward compatible — no breaking changes to existing Babylon.js public APIs (compile-time or runtime)

---

## Milestone 1 — Keyed Loading (Runtime API)

**Goal:** A production-ready `SmartLoader` API where application code loads assets by stable keys. Playground code uses the same key regardless of what file the key points to — code doesn't change when assets change.

**User-facing capability:** A developer writes `smartLoader.load("sodaCan")` and gets the asset, regardless of whether it's currently pointing to `v1/soda.glb` or `v2/soda_updated.glb`.

### Work items

1. **SmartLoader class** — core class with link table management (`addLink`, `removeLink`, `getLink`, `getLinks`). Maps logical keys to `ILinkEntry` (URI, loader type hint, file extension).
2. **`loadAsync(key)`** — resolve key via link table, load asset using `LoadAssetContainerAsync` from the existing SceneLoader plugin system (glTF, OBJ, Babylon, Draco, etc.). Returns an `AssetContainer` scoped to this key. Must handle shared resource disposal safely across containers (see devdoc for details).
3. **Provenance tracking** — record which scene objects (meshes, materials, textures, transforms, skeletons, animation groups) were created from each key. Enables Inspector attribution and selective reload.
4. **Override system** — post-load property modifications using dot-path targeting (e.g., `"materials.canPaint"` + `"albedoColor"`). Value resolution for common types: scalar, hex→Color3, array→Vector3/Color3/Color4, `{url}→Texture`, Quaternion.
5. **`addAllToScene()` convenience** — one-call `loadAndAddToSceneAsync(key)` that loads and adds to scene.
6. **Multi-key loading** — `loadAllAsync()` to load all registered keys in parallel.
7. **Reload support** — `reloadAsync(key)` that disposes the old container and loads fresh, preserving overrides.
8. **Individual unload** — `unloadAsync(key)` to dispose a single key's container and clean up provenance.
9. **Observables** — `onAssetLoadedObservable`, `onOverrideAppliedObservable`, `onLinkChangedObservable` (needed for Inspector integration later).
10. **Error handling** — try-catch in `loadAsync`, validation of override targets, graceful fallback for partial failures, meaningful error messages.
11. **Disposal** — `dispose()` to clear all containers, provenance, overrides, links.
12. **Types** — `ILinkEntry`, `IProvenance`, `IOverride`, `ISmartLoaderConfig` interfaces.
13. **Barrel exports** — export SmartLoader from `packages/dev/core/src/index.ts`.
14. **Doc comments** — all public APIs with complete JSDoc per Babylon conventions.
15. **Playground example** — demonstrating keyed loading with link swapping.
16. **Unit tests** — full coverage: link table, loading, provenance, overrides, value resolution, error handling, disposal.

### Estimate

| Task | Without AI | With AI |
|------|-----------|---------|
| SmartLoader class + link table + types | 1 day | 2 hours |
| `loadAsync` + SceneLoader integration | 1 day | 3 hours |
| Provenance tracking | 0.5 days | 1 hour |
| Override system + value resolution | 1.5 days | 3 hours |
| Convenience methods (addToScene, loadAll, reload, unload) | 1.5 days | 3 hours |
| Observables | 1 day | 1 hour |
| Error handling + disposal (incl. shared resource safety) | 1 day | 4 hours |
| Doc comments + barrel exports + build | 0.5 days | 30 min |
| Playground example | 0.5 days | 1 hour |
| Tests | 2 days | 2 hours |
| **Total** | **~10.5 days** | **~3 days** |

---

## Milestone 2 — Authoring File Save/Load

**Goal:** Persist the link table, provenance, and overrides to a JSON file. Reload a scene from the authoring file and get back exactly what you had.

**User-facing capability:** A developer builds a scene with SmartLoader, saves to `myscene.babylon-authoring` (or whatever the extension is), closes everything, opens it later, and the scene reconstructs — links resolve, overrides reapply, provenance is restored.

### Work items

1. **Define file extension and MIME type** — `.babylon-authoring`? `.bscene`? Needs a decision.
2. **Schema versioning** — add a `version` field to `IAuthoringFile` so we can evolve the format without breaking old files.
3. **Validate on load** — schema validation when loading an authoring file (required fields, type checks, unknown key warnings).
4. **Relative vs. absolute URI resolution** — ensure links resolve correctly relative to the authoring file's location, not the HTML page.
5. **Round-trip fidelity tests** — save → load → save and verify the files match.
6. **Integration with SceneLoader plugin system** — optionally register the authoring format as a loadable plugin so `SceneLoader.LoadAsync("scene.bscene")` just works.
7. **Error recovery** — what happens if a linked asset is missing? Load what you can, warn about the rest.

### Dependencies

- Milestone 1 (runtime API)

### Estimate

| Task | Without AI | With AI |
|------|-----------|---------|
| Authoring file schema + types + versioning | 1 day | 1 hour |
| `saveAuthoringFile()` serialization | 1 day | 1 hour |
| `FromAuthoringFile()` + `LoadAuthoringFileAsync()` deserialization | 1 day | 2 hours |
| Load validation + error recovery | 1 day | 2 hours |
| URI resolution logic | 1 day | 2 hours |
| SceneLoader plugin registration | 1.5 days | 4 hours |
| Round-trip fidelity tests | 1.5 days | 2 hours |
| **Total** | **~8 days** | **~2 days** |

---

## Milestone 3 — Inspector Integration: Scene Explorer

**Goal:** Inspector v2 shows SmartLoader keys in the scene explorer. Users can see which objects were loaded from which key, and interact with keys as first-class entities.

**User-facing capability:** Open Inspector and see a "Linked Assets" section in the scene explorer showing `sodaCan → soda_can.glb (3 meshes, 2 materials)`. Click a key to select all objects loaded from it. Right-click for context menu (reload, unlink, etc.).

### How Inspector v2 extensions work (from codebase analysis)

Inspector v2 uses a **service-based architecture**:
- Define a `ServiceDefinition` that consumes `IShellService`, `ISceneContext`, `ISelectionService`
- Call `shellService.addSidePane()` to add a pane, or `sceneExplorerService.addSection()` to add a tree section
- Register in `defaultInspectorExtensionFeed.ts`
- UI components use shared `BoundProperty`, `NumberInputPropertyLine`, `TextInputPropertyLine`, etc.

### Work items

1. **Create SmartLoader service definition** — `smartLoaderService.tsx` consuming `IShellService`, `ISceneContext`.
2. **Register in Inspector extension feed** — add to `defaultInspectorExtensionFeed.ts`.
3. **Scene explorer section** — "Linked Assets" section with key → resolved URI display, child nodes showing meshes/materials loaded from that key (using provenance data).
4. **Selection integration** — clicking a key selects all objects from that key's provenance.
5. **Context menu commands** — reload key, remove key, copy key name.
6. **Visual indicators** — icon/badge on scene objects that were loaded via SmartLoader keys (so users can tell SmartLoader-loaded objects from manually-added ones).

### Dependencies

- Milestone 1 (runtime API with observables)

### Estimate

| Task | Without AI | With AI |
|------|-----------|---------|
| Service definition + Inspector registration | 1 day | 2 hours |
| Scene explorer section (tree UI) | 2.5 days | 4 hours |
| Selection integration | 0.5 days | 1 hour |
| Context menu commands | 1 day | 2 hours |
| Visual indicators | 0.5 days | 1 hour |
| Testing + polish | 1.5 days | 3 hours |
| **Total** | **~7 days** | **~2 days** |

---

## Milestone 4 — Inspector Integration: Assembly Tool

**Goal:** A dedicated Inspector pane for composing scenes from linked assets — drag-and-drop files, browse and select assets, add/remove/swap keys, and visually arrange the scene.

**User-facing capability:** Open the Assembly pane in Inspector. Drag a `.glb` file onto it — a new key is created and the asset loads into the scene. Browse a folder of assets and click to add them. Select an existing key and swap its file via a file picker or URL input. Remove a key and its objects disappear from the scene.

This is the "assembly tool" Patrick described:
> "Ideally, we would have some sort of tool where I can take mesh, textures, maybe even node materials, and pull it into one scene and then assemble from there."

### How this differs from M3 (scene explorer) and M5 (override editing)

| Concern | Milestone | What you're doing |
|---------|-----------|-------------------|
| **See** linked assets and provenance | M3 — Scene Explorer | Read-only visibility into what's loaded and where it came from |
| **Compose** the scene from assets | **M4 — Assembly Tool** | Add/remove/swap linked assets, create new keys, drag-and-drop |
| **Tweak** properties on loaded objects | M5 — Override Editing | Edit material colors, roughness, position — saved as diffs |

### Work items

1. **Assembly pane** — new side pane in Inspector (`shellService.addSidePane()`) with dedicated UI for managing the link table.
2. **Drag-and-drop support** — drop `.glb`, `.gltf`, texture files onto the pane or the viewport. Create a new key automatically (or prompt for a key name), register the link, and load the asset.
3. **Asset browser** — file/URL picker for selecting assets to add or swap. If running in a local dev environment, optionally browse a directory of assets.
4. **Key management UI** — list of all keys with: current file, object count, actions (swap file, reload, remove). Inline editing of key names.
5. **Swap file for existing key** — change what a key points to via file picker or URL input. Triggers unload → reload with overrides preserved.
6. **Add/remove keys** — add a new empty key and assign a file, or remove a key and dispose its loaded objects.
7. **Scene graph integration** — when a new key is added, its objects appear in the scene and in the M3 scene explorer section. When removed, they disappear cleanly.
8. **Undo support** — at minimum, undo the last add/remove/swap operation.

### Dependencies

- Milestone 1 (runtime API)
- Milestone 3 (scene explorer, so new keys appear in the tree)

### Estimate

| Task | Without AI | With AI |
|------|-----------|---------|
| Assembly pane (service + shell registration) | 1 day | 2 hours |
| Drag-and-drop support | 2 days | 4 hours |
| Asset browser / file picker | 2 days | 4 hours |
| Key management UI (list, inline edit, actions) | 2 days | 3 hours |
| Swap / add / remove logic | 1.5 days | 2 hours |
| Scene graph integration | 1 day | 2 hours |
| Undo support | 1 day | 3 hours |
| Testing + polish | 1.5 days | 3 hours |
| **Total** | **~12 days** | **~3 days** |

---

## Milestone 5 — Inspector Integration: Properties & Override Editing

**Goal:** When a SmartLoader-loaded object is selected, the Properties pane shows its linked asset info and lets you edit overrides visually. Changes are tracked as overrides, not baked into the source.

**User-facing capability:** Select a mesh loaded from `"sodaCan"`. Properties pane shows:
- **Asset section:** "Loaded from key: sodaCan → soda_can.glb"
- **Override section:** Edit material color, roughness, position. Changes appear as overrides with a "reset" button to revert to the source asset's value.

This is the scenario David described: "run inspector, `getObjByKey(foo)`, if you change `glb.material.red`, then save — save the change as an override."

### Work items

1. **Properties service registration** — `propertiesService.addSectionContent()` with predicate checking for SmartLoader provenance metadata.
2. **Asset info component** — read-only display of key, resolved URI, load time, object count.
3. **Override editor component** — for each overridable property, show current value with diff indicator (modified vs. original). Use existing `ColorPropertyLine`, `NumberInputPropertyLine`, `TextInputPropertyLine` etc.
4. **Override tracking from Inspector edits** — when a user changes a property on a SmartLoader-loaded object in Inspector, intercept the change and record it as an override in the SmartLoader instead of (or in addition to) modifying the object directly.
5. **Reset to source** — button to remove an override and reload the original value from the linked asset.

### Dependencies

- Milestone 3 (Inspector scene explorer integration)
- Milestone 2 (authoring file save, so overrides can be persisted)

### Estimate

| Task | Without AI | With AI |
|------|-----------|---------|
| Properties service + asset info | 1.5 days | 2 hours |
| Override editor UI | 3 days | 4 hours |
| Override tracking from Inspector edits | 2.5 days | 1.5 days |
| Reset to source | 1 day | 2 hours |
| Testing + polish | 1.5 days | 3 hours |
| **Total** | **~9.5 days** | **~3 days** |

*Note: Override tracking (1.5 days with AI) is the hardest piece — requires understanding Inspector's property binding internals and designing the interception hook. AI writes the code fast but the debugging/integration is genuinely time-consuming.*

---

## Milestone 6 — Export / Bake to Delivery Format

**Goal:** Take an authoring file and produce a self-contained delivery file (GLB or .babylon) with all links resolved and overrides baked in.

**User-facing capability:** Click "Export" in Inspector (or call an API). SmartLoader loads all linked assets, applies all overrides, and produces a single `.glb` file ready to ship — no external dependencies, no authoring metadata.

### Two export paths

| Path | Output | Portability | Complexity |
|------|--------|-------------|------------|
| **GLB** | Single binary, universal 3D format | Any 3D viewer/engine | Higher — uses `GLTF2Export`, material conversion, coordinate transforms |
| **.babylon** | JSON scene file | Babylon.js only | Lower — uses `SceneSerializer`, full fidelity |

Both should be supported. GLB for portability, .babylon for maximum Babylon.js fidelity.

### Gotchas (from codebase analysis)

- **Material sharing:** If two meshes reference the same material but only one has an override, the material must be cloned before overriding to avoid affecting both.
- **Coordinate system:** Babylon is left-handed, glTF is right-handed — `GLTF2Export` handles this automatically but adds a root transform node.
- **Custom shader materials** can't export to glTF — only Standard/PBR materials.
- **Textures must be loaded** before export — need `scene.whenReadyAsync()`.
- **Animation baking** — glTF export samples animations at 60fps by default, which can increase file size.

### Work items

1. **Bake pipeline** — load all linked assets into a temporary scene → apply overrides → merge containers.
2. **Material clone-on-override** — detect shared materials and clone before applying overrides so unaffected meshes keep originals.
3. **GLB export path** — `GLTF2Export.GLBAsync()` with options (Draco compression, animation sample rate, texture format).
4. **.babylon export path** — `SceneSerializer.SerializeAsync()` for full-fidelity Babylon output.
5. **Strip authoring metadata** — ensure the output file has no SmartLoader keys, provenance, or source URIs (Patrick's PII/security concern).
6. **Inspector export button** — add to the SmartLoader pane with format selector (GLB / .babylon) and compression options.
7. **CLI/API export** — `smartLoader.exportAsync("output.glb", { format: "glb", compression: "draco" })` for scripted pipelines.

### Dependencies

- Milestone 1 (runtime API)
- Milestone 5 (overrides, so there's something meaningful to bake)

### Estimate

| Task | Without AI | With AI |
|------|-----------|---------|
| Bake pipeline (load + merge) | 2 days | 3 hours |
| Material clone-on-override | 1.5 days | 3 hours |
| GLB export path | 1.5 days | 2 hours |
| .babylon export path | 1 day | 1 hour |
| Metadata stripping | 0.5 days | 30 min |
| Inspector export UI | 1 day | 2 hours |
| CLI/API export | 0.5 days | 1 hour |
| Edge cases + testing | 2 days | 4 hours |
| **Total** | **~10 days** | **~2.5 days** |

---

## Timeline Summary

| Milestone | Scope | Without AI | With AI | Cumulative (With AI) |
|-----------|-------|-----------|---------|---------------------|
| **M1** — Keyed Loading API | Runtime API, playground example | ~10.5 days | ~3 days | 3 days |
| **M2** — Authoring File Save/Load | Persist + reload scenes | ~8 days | ~2 days | 5 days |
| **M3** — Inspector: Scene Explorer | See linked assets in Inspector | ~7 days | ~2 days | 7 days |
| **M4** — Inspector: Assembly Tool | Drag-and-drop, add/remove/swap keys | ~12 days | ~3 days | 10 days |
| **M5** — Inspector: Override Editing | Edit overrides visually, David's scenario | ~9.5 days | ~3 days | 13 days |
| **M6** — Export / Bake | Ship as GLB or .babylon | ~10 days | ~2.5 days | 15.5 days |

**Without AI: ~11.5 weeks.** With AI: **~15.5 working days (~3 weeks) at 85% allocation.**

The "With AI" column reflects that AI generates boilerplate, tests, types, and UI components in minutes. The remaining time is design decisions, integration debugging, build/verify cycles, and the genuinely hard problems (M5 override tracking, shared resource disposal).

*Note: Manual reload is available via the assembly tool context menu (M4) and the `reloadAsync(key)` API (M1). Automatic file watching (smart reload) was considered but deferred — teams can wire up their own file watchers that call `reloadAsync` if they want automation.*

### Parallelization opportunities

- M3 (Inspector scene explorer) can start as soon as M1 is done, in parallel with M2
- M6 (export) depends on M1 but not strictly on M3–M5 — could be started earlier if needed

With parallelization, the critical path could compress to **~2.5 weeks**.

### Backward compatibility considerations

SmartLoader is entirely **new API surface** — it doesn't modify existing classes (Scene, SceneLoader, AssetContainer, etc.). This means:
- **No breaking changes** to existing loading, serialization, or Inspector behavior
- Existing `.babylon` files and glTF loading are unaffected
- SmartLoader is opt-in — scenes that don't use it work exactly as before
- The SceneLoader plugin registration (M2) must be additive — a new plugin, not a modification of existing ones
- Inspector panes (M3/M4) are extensions, not modifications of existing panes
- Export (M6) uses existing `GLTF2Export` and `SceneSerializer` as-is — no changes needed to those APIs

The only risk area is **M5 (override tracking from Inspector edits)** — if intercepting property changes requires modifying Inspector's core property binding system, that could touch existing behavior. Design this as an opt-in hook that only activates when a SmartLoader is present on the scene.

### Risk factors

- **Inspector integration complexity** — the service-based architecture is well-documented but has a learning curve. First pane will be slower; subsequent work will be faster.
- **Override tracking from Inspector edits** (M5) — intercepting property changes in Inspector and routing them through SmartLoader is the most architecturally complex piece. May require changes to Inspector's property binding system.
- **GLB re-export fidelity** (M6) — re-exporting loaded glTF content through `GLTF2Export` may have edge cases with extensions, custom materials, or complex hierarchies.
