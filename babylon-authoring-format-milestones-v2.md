# Babylon Authoring Format — Milestones

**Last updated:** March 30, 2026

---

## Project Overview

### What is this project?

Babylon.js has no native authoring layer. Today, artists author content in DCC tools (Maya, Blender, Substance), export to transmission formats (glTF/GLB), and load those into Babylon. Every small change — a texture tweak, a material color adjustment — requires a full round-trip back through the DCC tool and a re-export.

This project adds four capabilities to Babylon.js:

1. **Smart Assets** — reference external files by logical key instead of hardcoded paths. Swap, reload, and manage assets without code changes.
2. **Override Persistence** — save Inspector property edits so they survive reload and can be shared with others.
3. **Asset Composition** — assemble scenes from individual parts (meshes, textures, materials, animations), create and assign materials in Inspector, and persist the composed scene as a project.
4. **Portable Project Bundle** — package a project (asset map, overrides, and all referenced files) into a single shareable zip that anyone can open with zero setup.

### User Scenarios

**Scenario 1: Developer — Stable code, swappable assets**

A developer building a product configurator writes code that references assets by key: `load("chair")`, `load("table")`. The art team delivers updated models throughout the project. Each time, the developer updates the URL behind the key — the code never changes. Shared playground snippets reference the same keys; when a colleague opens the snippet and doesn't have the asset locally, the system prompts them to locate the file.

**Scenario 2: Artist — Tweak, save, share, pick up where you left off**

An artist loads a GLB in Inspector, changes material colors, adjusts the clear color, and repositions lights. She saves her changes. The next day, she loads the same GLB and her overrides file — the scene looks exactly as she left it. She sends both files to a teammate, who opens them and sees the same scene. The teammate adjusts a texture, saves a new version of the overrides, and sends it back.

**Scenario 3: Artist — Assemble a scene from individual parts and export**

An artist imports a character mesh, individual textures, and animation files as separate smart assets. She creates a PBR material in Inspector, assigns textures to its slots, assigns the material to the mesh, and wires up an idle animation. She saves the project as a portable bundle (zip) and sends it to a colleague — everything opens with no missing files. She duplicates the project, swaps the idle animation for a dance animation, and exports a second GLB. When a texture is updated on disk, both projects pick up the change automatically.

---

## Architecture Overview

Two independent systems, composed via a project file:

| System | Purpose | Standalone value |
|--------|---------|-----------------|
| **Smart Assets** | Map logical keys to asset URLs, load/unload/reload by key | Developers decouple code from concrete files; artists swap assets without code changes |
| **Override Persistence** | Persist Inspector property edits so they survive reload — works on ANY scene object | Users tweak a GLB in Inspector and keep their changes — no smart assets needed |

The systems are independent — either can ship and be useful alone. When used together, a project file composes both.

---

## Milestone Overview

```
Track A: Smart Assets              Track B: Overrides
    │                                   │
M1: SmartAsset Loading             M4: Inspector Overrides Tracking
    │                                   │
M2: SmartAsset Inspector UX        M5: Save/Load Inspector Overrides
    │                                   │
M3: Save/Load SmartAsset Map            │
    │                                   │
    └──────────── M6: Save/Load Babylon Zip ───────────┘
                         │
                  M7: Asset Composition
```

Tracks A and B are **parallel** — no shared code dependencies. M6 composes them. M7 builds on everything.

---

## M1 — SmartAsset Loading

> **"I can create a smartAsset in code."**

**Goal:** Assets are referenced by stable logical keys instead of file paths. Changing what a key points to requires zero code changes. Supports any file type Babylon can load (GLBs, glTFs, textures, node material JSON, animation files).

**User story:** *A developer builds a product configurator. She writes `smartAsset.load("chair")` pointing at `chair_v1.glb`. When the artist delivers `chair_v2.glb`, she updates the URL behind the key — her code doesn't change. She can also call `smartAsset.unload("chair")` and load a different model without manually tracking what to dispose.*

**Deliverables:**
- Architecture decision and implementation for asset resolution (e.g. `asset://` protocol in FileTools vs. standalone class vs. hybrid)
- Asset table management (add, remove, get, list keys)
- Key-based loading, unloading, reloading
- Support for non-GLB asset types (textures, node material JSON, animation files)
- Event notifications (asset load, link changed, load failed)
- Missing asset resolution callback:
  ```ts
  onAssetNotFound: (key: string, expectedUrl: string) => Promise<string | File | null>
  ```
  If no callback is registered, missing assets are skipped with a console warning. Different UIs provide their own implementations (Inspector in M2, Playground in M3).
- Local file handle persistence (File System API + IndexedDB so mappings survive page refresh)
- Playground example

---

## M2 — SmartAsset Inspector UX

> **"I can add / view / modify smart assets in Inspector."**

**Goal:** Let users add new assets to a scene via drag-and-drop (today you can only replace files), and visualize what's been smart-loaded. Inspector already handles property editing — this milestone fills the two actual gaps.

**User story:** *An artist opens Inspector and drags three GLB files onto the viewport — a table, a lamp, and a vase. Each appears in the scene and shows up in a smart assets pane with an auto-generated key. She renames the keys to "table," "lamp," and "vase." The lamp model looks wrong, so she clicks it in the asset pane and swaps its URL to a different GLB. The old lamp is removed and the new one loads in its place — no code needed.*

**Deliverables:**
- **Drag-and-drop to ADD assets** — drop a .glb/.gltf/texture/material/animation file onto Inspector or viewport → added to scene as a new smart asset with auto-generated key
- File/URL picker as alternative to drag-and-drop
- Key management (rename, remove, swap URL for an existing key)
- **Smart asset visualization** — an Inspector extension or pane showing:
  - All smart-loaded keys with resolved URLs
  - Which scene objects came from each key
  - Missing/broken assets shown as warning entries with "Locate" / "Re-link" action (implements M1's `onAssetNotFound` callback)
  - Click a key → select its objects in the scene
  - Context menu: reload, remove, copy key

**Depends on:** M1

---

## M3 — Save/Load Babylon SmartAsset Map

> **"I can save a file and load it elsewhere. If the file exists on disk all runs smoothly; if the file doesn't exist it prompts for new assets."**

**Goal:** Persist the smart asset table to a JSON file and reload it. When loaded, assets that can be found are loaded automatically; assets that can't be found trigger a prompt so the user can locate them.

**User story:** *An artist has composed a scene with five smart assets in Inspector. She saves the asset map to a JSON file. The next day she reopens it — all five assets load and the scene looks exactly as she left it. She sends the file to a colleague. He opens it; three assets load fine (they're on a shared server), but two were from her local disk. Inspector prompts: "Asset 'vase' not found — locate it?" He picks the file and the scene completes.*

**Deliverables:**
- JSON schema for smart asset map (versioned, key→URL mappings)
- Save and load APIs
- Schema validation with error recovery for missing assets (uses M1's `onAssetNotFound` callback)
- Relative URI resolution (links resolve relative to the asset map file)
- Playground snippet integration — asset table serialized as part of Playground JSON payload; Playground provides its own missing-asset prompt (modal file picker)

**Depends on:** M1

---

## M4 — Inspector Overrides Tracking

> **"I can make Inspector changes and they are tracked in the override system."**

**Goal:** When a user edits any property in Inspector, the change is automatically captured as an override that can be reapplied after reload. General-purpose — works on ANY scene object, not limited to smart-loaded assets. No new editing UX — Inspector already edits every property; this adds the tracking layer underneath.

**User story:** *An artist loads a soda can GLB and selects its material in Inspector. She changes the albedo color from silver to red. A small badge appears next to the color property indicating it's been overridden. She clicks "Reset to original" and it snaps back to silver. She changes it to blue instead. Later she reloads the smart asset (the artist shipped a new mesh) — her blue override is automatically reapplied to the new version's material.*

**Deliverables:**
- Override data model (target object identifier, property path, value)
- Value resolution (hex→Color3, arrays→Vector3/Color4, `{url}`→Texture, scalars)
- Override application after scene load (or after smart asset reload)
- Add, remove, query overrides
- Original value snapshots (for "reset to source")
- Scene-level settings — clearColor, environment texture, fog, etc. are overrides on the scene object
- Visual indicator in Inspector for overridden properties
- "Reset to original" per overridden property

**Depends on:** Nothing — independent of Track A. Can start immediately.

---

## M5 — Save/Load Inspector Overrides

> **"I can make Inspector changes, save and load overrides elsewhere to return to the same state."**

**Goal:** Persist the override set from M4 to a file so it can be reloaded later or shared with someone else.

**User story:** *An artist has spent an hour tweaking material colors, adjusting the scene's clearColor, and repositioning lights — all through Inspector. She saves the overrides to a file. She closes the browser, comes back tomorrow, loads the same GLB, loads her overrides file — everything is exactly as she left it. She sends the overrides file to a teammate along with the asset map. He loads both and sees exactly the same scene, with all her tweaks applied.*

**Deliverables:**
- Override persistence to a standalone JSON file
- Load overrides and apply to current scene
- Round-trip fidelity (save → load → save produces identical output)
- Integration with M4's tracking system

**Depends on:** M4

---

## M6 — Save/Load Babylon Zip

> **"I can save a .babylonZip that includes smartAssets and overrides, load it elsewhere, and it validates / runs smoothly."**

**Goal:** Package the smart asset map (M3), overrides (M5), and all referenced files into a single portable zip so you can send it to someone and they open it with zero setup.

**User story:** *An artist has built a full scene — five smart assets with overrides on materials and scene settings. She clicks "Export as .babylonZip." It packages the asset map JSON, the overrides JSON, and copies of all five GLB files into a single zip. She emails it to a client. The client opens the zip in Babylon — no missing file prompts, no server dependencies, everything just works. They see exactly what she sees.*

**Deliverables:**
- Bundle save — pack asset map JSON + overrides JSON + all referenced files into a standard zip with well-known internal structure:
  ```
  my-scene.babylonzip
  ├── project.json        (asset map + overrides)
  ├── assets/
  │   ├── soda_can.glb
  │   ├── table.glb
  │   └── textures/
  │       └── label.png
  ```
- Bundle load — unpack, rewrite URLs to relative paths, load via M1 + M4
- Validation on load (all referenced files present, schema valid)
- Inspector UI for save/load

**Depends on:** M3 + M5

---

## M7 — Asset Composition

> **"I can assemble a scene from individual parts — meshes, textures, materials, animations — and export to GLB."**

**Goal:** Enable a compositional workflow where individual assets (mesh, texture, material, animation) are the atoms — not GLBs. Users import parts separately, create materials in Babylon, wire up relationships (texture→material→mesh→animations), save the assembly as a project, and export to GLB when ready.

This is primarily integration work on top of M1–M6, not new infrastructure. The key technical insight: once AssetContainer objects are added to the scene via `addAllToScene()`, SceneSerializer already captures them — materials, meshes, assignments, animations, transforms. The existing serialization handles the scene graph. What M7 adds is:
- Smart asset loading of individual file types (not just whole GLBs) — M1 should already support this
- The project file schema extended with an `inlineObjects` section for things created in-tool (new materials, lights, cameras) that don't come from any smart asset
- Wiring up the existing Inspector UX (material creation already exists, material assignment dropdown already exists) with the smart asset + override systems

**What already works today:**
- Inspector can create PBR, Standard, and Node materials (Quick Create UI)
- Inspector can reassign materials to meshes (dropdown in mesh properties)
- SceneSerializer captures material assignments (stores uniqueId)
- Textures can be serialized as URL references (not just base64)
- Animation groups are serialized

**What this milestone adds:**
- Import of individual file types as smart assets (standalone textures, animation files, material files — not just GLBs/glTFs)
- Project file extended with optional `inlineObjects` section for in-tool-created objects
- Inspector UX for assigning imported smart asset textures to material slots
- Inspector UX for assigning imported animations to meshes/skeletons
- Export composed scene to GLB via the existing GLTF2Export pipeline

**User story:** *An artist imports a character mesh, a set of textures, and several animation files as individual smart assets. She creates a new PBR material in Inspector, assigns the imported textures to the material's albedo/normal/roughness slots, assigns the material to the mesh, and assigns the idle animation. She saves this as a project. She then duplicates the project, swaps idle for dance animation, and exports a second GLB. She updates one texture on disk; both projects pick up the change automatically through their smart asset references.*

**Depends on:** M1–M6

---

## Timeline

| Milestone | Track | Estimate (AI-assisted) |
|-----------|-------|----------------------|
| **M1** — SmartAsset Loading | Track A | ~3 days |
| **M2** — SmartAsset Inspector UX | Track A | ~3 days |
| **M3** — Save/Load SmartAsset Map | Track A | ~2 days |
| **M4** — Inspector Overrides Tracking | Track B | ~3 days |
| **M5** — Save/Load Inspector Overrides | Track B | ~2 days |
| **M6** — Save/Load Babylon Zip | Composition | ~2.5 days |
| **M7** — Asset Composition | Composition | ~3 days |
| **Total** | | **~18.5 days** |

With Tracks A and B in parallel:

```
Track A:  M1 ─── M2 ─── M3 ───┐
Track B:  M4 ─── M5 ───────────┤
                                M6 ─── M7
```

**Critical path: ~3.5 weeks** (Track A: M1→M2→M3→M6→M7)

---

## Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | `asset://` protocol in FileTools vs. standalone class vs. hybrid? | Decided during M1 |
| 2 | New format vs. GLTF extensions? | v1 uses simple JSON; revisit post-v1 |
| 3 | File extension for bundle? | `.babylonzip`? Standard zip; extension TBD |
| 4 | Is Playground integration a v1 requirement? | Likely yes — confirm with David |
| 5 | What does M7 (Asset Composition) actually look like in detail? | Needs further design after M1–M6 |

---

## Related Documents

- [Goals & Scenarios](babylon-authoring-format-goals.md)
- [Original Plan](babylon-authoring-format-plan.md)
- [Revised Plan (full history)](babylon-authoring-format-newPlan.md)
- [Patrick Discussion — Mar 24](babylon-authoring-format-patrick.md)
- [Ryan Discussion — Mar 24](babylon-authoring-format-ryan.md)
- [Technical Dev Doc](babylon-authoring-format-devdoc.md)
- [Design Decisions](babylon-authoring-format-decisions.md)
- [Risks](babylon-authoring-format-risks.md)
