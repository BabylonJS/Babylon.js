# Babylon Authoring Format — Plan

**Allocation:** ~85% time · **Approach:** AI-assisted development · **Compatibility:** All changes backward compatible, no modifications to existing APIs

---

## Milestone 1 — Keyed Loading

**What we're delivering:** A runtime API where application code loads assets by stable logical keys instead of file paths. A developer writes `smartLoader.load("sodaCan")` and gets the asset — regardless of whether the key currently points to `v1/soda.glb` or `v2/soda_updated.glb`. Changing the underlying file never requires code changes.

**What this unlocks:**
- Code is decoupled from concrete assets
- Artists can swap files without developer involvement
- Foundation for everything else in this project

**Deliverables:**
- SmartLoader class with link table management (add, remove, get keys)
- Key-based loading, unloading, and reloading
- Provenance tracking (which scene objects came from which key)
- Event notifications for asset load, link changed
- Playground example demonstrating the API
- Full test coverage

| | Without AI | With AI |
|--|-----------|---------|
| **Estimate** | ~7 days | ~2 days |

---

## Milestone 2 — Inspector: Assembly Tool

**What we're delivering:** A dedicated Inspector pane for composing scenes from linked assets. Drag-and-drop files to add them, browse and select assets, swap what a key points to, add and remove keys — all without writing code.

**What this unlocks:**
- Scene composition without code — the "assembly tool" Patrick described
- Artists and developers can build scenes visually in the Babylon renderer
- Preview assets in the actual target renderer instead of Maya/Blender
- Rapid iteration — swap an asset by clicking, not re-exporting

**Deliverables:**
- Assembly pane in Inspector with key list, object counts, and actions
- Drag-and-drop support (drop a .glb/.gltf onto the pane or viewport → new key created, asset loaded)
- File/URL picker for adding or swapping assets
- Add, remove, and swap key operations
- Scene graph integration (added/removed keys reflected in scene explorer)
- Basic undo support

**Depends on:** M1

| | Without AI | With AI |
|--|-----------|---------|
| **Estimate** | ~12 days | ~3 days |

---

## Milestone 3 — Authoring File Save/Load

**What we're delivering:** The ability to save a SmartLoader scene to a file and reload it later. The file captures links, overrides, and provenance — not baked asset data. Opening the file reconstructs the scene exactly as it was.

**What this unlocks:**
- Session persistence — close and reopen without losing work
- Shareable scene descriptions (small JSON file, not massive GLB)
- Foundation for Inspector integration (need something to save to)

**Deliverables:**
- Authoring file JSON schema with versioning (schema accommodates overrides as an empty array even though the Override System is a separate milestone)
- Save and load APIs
- Schema validation on load with error recovery for missing assets
- Relative URI resolution (links resolve relative to the authoring file, not the page)
- Registration as a SceneLoader plugin so standard loading APIs work
- Round-trip fidelity tests

**Depends on:** M1

| | Without AI | With AI |
|--|-----------|---------|
| **Estimate** | ~8 days | ~2 days |

---

## Milestone 4 — Override System

**What we're delivering:** The ability to define property diffs (overrides) that are applied to loaded objects after loading. An override says "on the material named canPaint from the sodaCan key, set albedoColor to red." The source asset is never modified — overrides are layered on top at load time.

**What this unlocks:**
- Non-destructive property changes on linked assets
- Foundation for Inspector override editing (M6) and export/bake (M7)
- Overrides survive asset updates — reload the source and diffs reapply automatically

**Deliverables:**
- Override data model (key, target, property, value)
- Value resolution (hex→Color3, arrays→Vector3/Color4, `{url}`→Texture, scalars)
- Override application after loading (scoped to the key's container)
- Add, remove, and query overrides per key
- Original value snapshots (for later "reset to source" in M6)
- Event notification for override applied
- Tests for all value types and edge cases

**Depends on:** M1

| | Without AI | With AI |
|--|-----------|---------|
| **Estimate** | ~3.5 days | ~1 day |

---

## Milestone 5 — Inspector: Scene Explorer

**What we're delivering:** A "Linked Assets" section in Inspector v2's scene explorer that shows all SmartLoader keys, what files they resolve to, and which scene objects were loaded from each key.

**What this unlocks:**
- Visual understanding of scene composition — see at a glance what's linked and where objects came from
- Click a key to select all its objects
- Context menu to reload, remove, or copy a key
- Foundation for override editing

**Deliverables:**
- Scene explorer tree section showing keys → child objects (meshes, materials, etc.)
- Selection integration (click key → select its objects)
- Context menu commands (reload, remove, copy key name)
- Visual indicators distinguishing SmartLoader-loaded objects from manually-added ones

**Depends on:** M1

| | Without AI | With AI |
|--|-----------|---------|
| **Estimate** | ~7 days | ~2 days |

---

## Milestone 6 — Inspector: Override Editing

**What we're delivering:** When you select a SmartLoader-loaded object in Inspector and change a property (e.g., material color), the change is automatically tracked as an override and persisted in the authoring file. The source asset is never modified.

**What this unlocks:**
- David's core scenario: "change `glb.material.red` in Inspector, save it as an override"
- Visual diff indicators showing which properties have been overridden
- Reset to original — revert any override back to the source asset's value
- Take a new version of a source asset and your overrides survive

**Deliverables:**
- "Asset Info" section in properties pane (shows key, resolved URI, "loaded from SmartLoader" badge)
- Override tracking — Inspector edits on SmartLoader objects are captured as overrides via M4's system
- Visual diff indicators on overridden properties
- "Reset to original" button per overridden property
- Integration with M3 save (overrides persist to authoring file)

**Depends on:** M4, M3, M5

*Note: Override tracking from Inspector edits is the highest-risk item in the project — requires intercepting property changes in Inspector's binding system.*

| | Without AI | With AI |
|--|-----------|---------|
| **Estimate** | ~9.5 days | ~3 days |

---

## Milestone 7 — Export / Bake to Delivery Format

**What we're delivering:** The ability to take an authoring file and produce a single self-contained file (GLB or .babylon) with all links resolved, overrides baked in, and authoring metadata stripped. The output is a normal scene file — no SmartLoader needed to load it.

**What this unlocks:**
- Ship composed scenes to end users as standard GLB or .babylon files
- No external dependencies in the output — everything is embedded
- Source paths and authoring metadata stripped for security/PII
- Two format options: GLB (universal, portable) or .babylon (full Babylon fidelity)

**Deliverables:**
- Bake pipeline (load all keys → apply overrides → merge → serialize)
- Material isolation (clone shared materials before applying overrides)
- GLB export with optional Draco compression
- .babylon export for full fidelity
- Metadata stripping
- Inspector export button with format selector
- Programmatic export API

**Depends on:** M1, M4, M6

| | Without AI | With AI |
|--|-----------|---------|
| **Estimate** | ~10 days | ~2.5 days |

---

## Timeline

| Milestone | Without AI | With AI | Cumulative |
|-----------|-----------|---------|------------|
| M1 — Keyed Loading | 7 days | 2 days | 2 days |
| M2 — Assembly Tool | 12 days | 3 days | 5 days |
| M3 — Save/Load | 8 days | 2 days | 7 days |
| M4 — Override System | 3.5 days | 1 day | 8 days |
| M5 — Scene Explorer | 7 days | 2 days | 10 days |
| M6 — Override Editing | 9.5 days | 3 days | 13 days |
| M7 — Export / Bake | 10 days | 2.5 days | 15.5 days |
| **Total** | **~57 days (~11.5 weeks)** | **~15.5 days (~3 weeks)** | |

With parallelization (M2/M3/M4/M5 all start after M1, in parallel): **~2 weeks.**

*Note: Manual reload is available via the assembly tool context menu (M2) and the `reloadAsync(key)` API (M1). Automatic file watching (smart reload) was considered but deferred — teams can wire up their own file watchers that call `reloadAsync` if they want automation.*

---

## Progressive Capability

What the user can do after each milestone:

| After | What's possible |
|-------|----------------|
| **M1** — Keyed Loading | Developer loads assets by key in code. Foundation works. |
| **M2** — Assembly Tool | Artist drags GLBs into Inspector, swaps assets, composes a scene visually. **First demo-able moment.** |
| **M3** — Save/Load | Save the composed scene to a file, share it, reopen it later. Links and layout persist. |
| **M4** — Override System | Define property diffs programmatically (e.g., "set this material to red"). Overrides reapply on reload. |
| **M5** — Scene Explorer | See which objects came from which key in Inspector. Visual attribution of SmartLoader-loaded objects. |
| **M6** — Override Editing | Tweak a material color in Inspector → automatically saved as an override. Reset to original. David's core scenario. |
| **M7** — Export / Bake | Produce a single GLB or .babylon with everything flattened — ready to ship. |
---

## Related Documents

- **[Goals & Scenarios](babylon-authoring-format-goals.md)** — the problem, stakeholder input, and what this project unlocks
- **[Technical Dev Doc](babylon-authoring-format-devdoc.md)** — file format spec and *how* each milestone is built
- **[Detailed Milestones](babylon-authoring-format-milestones.md)** — work item breakdowns with implementation details
- **[Design Decisions](babylon-authoring-format-decisions.md)** — decisions made and open questions for team review
- **[Inspector Save Discussion](babylon-authoring-format-inspector-save-discussion.md)** — should Inspector save generalize beyond SmartLoader?
- **[Risks & Unknowns](babylon-authoring-format-risks.md)** — risks per milestone with severity ratings
