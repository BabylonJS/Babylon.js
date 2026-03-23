# Babylon Authoring Format — Risks & Unknowns by Milestone

## Severity Summary

| Risk | Milestone | Severity | Why |
|------|-----------|----------|-----|
| **Override tracking from Inspector edits** | M5 | 🔴 High | Hardest technical problem — no existing hook for intercepting property changes and distinguishing original values from override values. Could force changes to Inspector v2's core binding system. |
| **Browser file I/O (no "just save")** | M2, M4 | 🔴 High | Browsers can't write files without user interaction. File System Access API is Chrome/Edge only. Affects save UX and drag-and-drop persistence. |
| **Name collisions across linked assets** | M1 | 🟢 Low | Mitigated by container-scoped lookup — each key's overrides search within its own AssetContainer, not the whole scene. Index fallback for within-key duplicates. |
| **Drag-and-drop gives blobs, not URIs** | M4 | 🟡 Medium | File drops don't give persistent paths. Solvable with URL input as primary method, file picker as progressive enhancement. |
| **glTF export fidelity** | M6 | 🟡 Medium | Some Babylon features don't survive GLB export. Known limitation — mitigated by offering .babylon export as alternative. |
| **URI resolution ambiguity** | M2 | 🟡 Medium | Relative paths resolve differently in dev vs. deployed. Standard web problem — solvable with clear documentation. |
| **API surface lock-in** | All | 🟡 Medium | Public APIs are permanent. Mitigated by API review before shipping M1 and possibly shipping as `@beta`. |
| Everything else | Various | 🟢 Low | Normal engineering work — parallel loading, schema versioning, round-trip testing. Handled during implementation. |

**Bottom line:** Two risks worth flagging to the team — override tracking (M5) and browser save UX (M2/M4). Everything else is either a design decision to make or standard engineering work.

---

## M1 — Keyed Loading (Runtime API)

### Risks

**Name collisions across linked assets**
Two GLBs might both have a mesh called "Cube" or a material called "Material." This is handled by **container-scoped lookup** — overrides and provenance search within the `AssetContainer` for each key, not across the entire scene. Two keys can both have `"Cube"` without conflict. The remaining edge case is duplicate names *within a single GLB* (rare in well-authored assets) — handled by storing both name and index in provenance, with index as fallback.

*Severity: Low (mitigated by design). Remaining risk: duplicate names within a single source asset.*

**AssetContainer lifecycle complexity**
Each key produces an `AssetContainer`. When you call `addAllToScene()`, objects move to the scene. When you `unloadAsync(key)`, you need to find and remove exactly those objects. If the user has reparented meshes, added children, or created references between objects from different keys, disposal gets messy.

*Severity: Medium. Mitigation: provenance tracking helps, but cross-key references (e.g., a mesh from key A using a material from key B) need clear rules.*

**Parallel loading race conditions**
`loadAllAsync()` loads multiple keys concurrently. If two GLBs reference the same texture URL, Babylon may create duplicate textures or share them unpredictably. Overrides targeting textures could apply to the wrong instance.

*Severity: Low-Medium. Mitigation: test parallel loading thoroughly, document behavior.*

### Unknowns

- How should SmartLoader handle keys whose linked assets fail to load (404, CORS, parse error)? Skip and warn? Throw? Partial scene?
- Should SmartLoader support loading the same key twice (instancing)? Or is one key = one load?
- What's the right API naming — `loadAsync` vs `loadAndAddToSceneAsync` vs both?

---

## M2 — Authoring File Save/Load

### Risks

**URI resolution ambiguity**
Link URIs are resolved relative to the authoring file's location. But in a dev server setup, the "location" of the authoring file might differ from where assets actually live. Relative paths like `"../assets/model.glb"` may resolve differently in local dev vs. deployed environments.

*Severity: Medium. Mitigation: support both relative and absolute URIs, document the resolution rules clearly.*

**Schema evolution**
The `version` field is supposed to handle format changes, but if we make breaking schema changes between v1 and v2, old files won't load. We need migration logic.

*Severity: Low (early stage — few files will exist). Mitigation: keep v1 schema minimal so there's less to migrate.*

**Browser file I/O**
"Saving" in a browser means either:
- `URL.createObjectURL()` + download link (user picks location every time)
- File System Access API (`showSaveFilePicker`) — Chrome/Edge only, not Firefox/Safari
- Dev server endpoint that writes to disk

There's no "just save to the same file" in a browser.

*Severity: High for UX. Mitigation: support File System Access API where available, fall back to download. For dev workflows, provide a dev server integration pattern.*

### Unknowns

- What file extension? (`.bauthoring`, `.bscene`, `.bab`, other?)
- Should the authoring file be registered as a SceneLoader plugin from the start, or is that a later addition?
- How large can an authoring file reasonably get? With hundreds of overrides, does JSON parsing become a bottleneck?

---

## M3 — Inspector: Scene Explorer

### Risks

**Inspector discovering SmartLoader**
Current plan: SmartLoader stores itself on `scene.metadata.smartLoader`. This is fragile — any code could overwrite `scene.metadata`, and there's no type safety. But adding a first-class `scene.smartLoader` property means modifying the `Scene` class, which conflicts with the "no changes to existing APIs" constraint.

*Severity: Medium. Mitigation: use a Symbol key on metadata to avoid accidental collisions, or use a WeakMap keyed by scene.*

**Reactive updates when assets change**
The scene explorer tree needs to update when keys are added/removed/reloaded. This requires the SmartLoader's observables (from M1) to reliably fire and the tree to re-render. If observables fire before the container is fully processed, the tree may show stale data.

*Severity: Low-Medium. Mitigation: ensure observables fire after provenance is updated, not just after loading starts.*

### Unknowns

- Should the "Linked Assets" section replace or coexist with the normal mesh/material tree? Users may want to see both views.
- What icon/visual treatment distinguishes SmartLoader-loaded objects from regular scene objects?
- How does the tree handle a key that failed to load? Show it as an error node?

---

## M4 — Inspector: Assembly Tool

### Risks

**Drag-and-drop in browser is unreliable**
Browser drag-and-drop APIs have inconsistent behavior across browsers (especially for local files vs. URLs). File drops give `File` objects but no path information — you get a blob, not a URI you can persist in the authoring file.

*Severity: High. Mitigation: for local files, use `URL.createObjectURL()` as a temporary URI during the session, but the user must provide a real URI (or copy the file to a known location) before saving. This is an awkward UX.*

**File picker limitations**
The File System Access API (`showOpenFilePicker`) works in Chrome/Edge but not Firefox/Safari. Without it, file selection is limited to `<input type="file">` which doesn't give you a persistent path.

*Severity: High for cross-browser. Mitigation: accept URL input as the primary method, file picker as a progressive enhancement. For local dev, recommend a dev server that serves assets from a known directory.*

**Undo complexity**
Adding undo for assembly operations (add/remove/swap keys) requires tracking state changes in a reversible way. If adding a key triggers asset loading, undo means unloading. If swapping a key means the old container was disposed, undo means re-loading the old asset (slow, network-dependent).

*Severity: Medium. Mitigation: for v1, undo may just mean "reload the last saved authoring file" rather than a granular undo stack.*

### Unknowns

- When dragging a file, how do we auto-generate a key name? Filename minus extension? Prompt the user?
- Should the assembly tool support reordering keys (does order matter)?
- Can you drag a `.babylon` or `.obj` file, or only `.glb`/`.gltf`?

---

## M5 — Inspector: Override Editing

### Risks

**🔴 Intercepting Inspector property edits (HIGHEST RISK IN THE PROJECT)**
Inspector's `BoundProperty` component directly mutates objects (`target[propertyKey] = newValue`). To track this as an override, we need to know:
1. That a property changed
2. What the old (original, pre-override) value was
3. Which SmartLoader key owns this object

Inspector fires `PropertyChangeInfo` (with `oldValue` and `newValue`) via `notifyPropertyChanged()`, which is good. But:
- We need to distinguish "original value from the GLB" vs. "previous override value" — `oldValue` only gives us the latter
- We need to store the original values at load time, before any overrides are applied
- If multiple overrides chain on the same property, "reset to original" needs the very first value, not the last-but-one

*Severity: High. Mitigation: snapshot all property values on load (before overrides) and store as "original state." This could be memory-intensive for complex scenes.*

**Knowing WHICH properties are overridable**
Not every property should be an override. Some are computed, some are internal, some would break the object if set. We need a whitelist or heuristic for which properties can be overridden.

*Severity: Medium. Mitigation: start with a conservative whitelist (transform, material scalars, material colors, material textures). Expand over time.*

**Type round-tripping in overrides**
An override stores a value as JSON (e.g., `[1, 0, 0]`). When loaded, it's converted to a `Vector3`. When the user edits it in Inspector, it's a `Vector3`. When saved again, it must go back to `[1, 0, 0]`. If the serialization/deserialization isn't perfectly symmetric, values drift.

*Severity: Medium. Mitigation: rigorous round-trip tests for every supported value type.*

### Unknowns

- Should ALL Inspector edits on SmartLoader objects become overrides, or should the user explicitly "mark as override"?
- How does reset-to-original work for texture overrides? The original texture may have been disposed when the override was applied.
- What happens if the user edits a property that's already an override — update the existing override or create a new one?

---

## M6 — Export / Bake

### Risks

**Material clone-on-override correctness**
When two meshes share a material but only one has an override, we clone the material. But materials have bidirectional references — textures reference the material's shader, the mesh references the material, the scene tracks materials. Cloning must preserve all these relationships.

*Severity: Medium. Mitigation: use Babylon's existing `material.clone()` which handles most of this, but test edge cases (shared textures, node materials, multi-materials).*

**glTF export fidelity**
`GLTF2Export` converts Babylon materials to glTF PBR. Not everything survives:
- Node materials → can't export
- Custom shader materials → can't export  
- Babylon-specific material properties (e.g., `subSurface`, `clearCoat`) → require glTF extensions
- Coordinate system flip → adds a root transform node

If the user's overrides use Babylon-specific features, the GLB output may not match what they saw in Inspector.

*Severity: Medium-High. Mitigation: warn when exporting scenes with non-exportable materials. Recommend .babylon format for full fidelity.*

**Large scene bake performance**
Loading all linked assets into a temporary scene, applying overrides, merging, and then serializing could be very slow for scenes with many keys or large assets.

*Severity: Low-Medium. Mitigation: show a progress indicator, consider streaming export.*

### Unknowns

- Should the bake strip ALL metadata, or preserve some (e.g., mesh names, animation names)?
- Should the exported GLB include the SmartLoader key names as glTF extras for traceability?
- Can we re-export a GLB that was loaded via the glTF loader without losing data? (Known issue: multi-primitive meshes get split)

---

## Cross-Cutting Risks

### API surface lock-in
Once SmartLoader ships as a public API, it must maintain backward compatibility forever (per Babylon conventions). If we get the API shape wrong in M1, we're stuck with it. 

*Mitigation: get API review from Gary/Sebastien before shipping M1. Consider shipping as `@beta` initially.*

### Inspector v2 is relatively new
Inspector v2's service-based architecture is still evolving. Building SmartLoader extensions (M3-M5) against it means our code could break if Inspector v2 refactors its service interfaces.

*Mitigation: stay close to established patterns (statsService, materialProperties). Don't depend on internal APIs.*

### Testing complexity
SmartLoader integrates with: SceneLoader, AssetContainer, Inspector v2, GLTF2Export, SceneSerializer, and the browser File API. End-to-end testing across all of these is hard to automate.

*Mitigation: heavy unit testing with mocks for M1-M2. Integration testing for M3-M5 requires Inspector running in a browser (Playwright). Export testing (M6) needs asset comparison tools.*
