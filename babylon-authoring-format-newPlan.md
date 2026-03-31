# Babylon Authoring Format — Revised Plan

**Updated:** March 25, 2026 · Incorporates feedback from Patrick Ryan (Mar 24), Ryan Tremblay (Mar 24), and David Catuhe (Mar 25)

---

## What Changed

The original plan (7 milestones, SmartLoader-centric) is directionally correct, but the conversations with Patrick and Ryan surfaced architectural alternatives, new requirements, and scope questions that reshape the milestones. This document is the updated plan.

### Key shifts

| Area | Original plan | After Patrick & Ryan |
|------|--------------|---------------------|
| **Asset resolution architecture** | Standalone `SmartLoader` class wrapping `LoadAssetContainerAsync` | Ryan proposes `asset://` protocol integrated into `FileTools` — any existing URL-based API works without changes |
| **Override system coupling** | Overrides are part of SmartLoader, stored in the authoring file | Ryan argues overrides are independent of asset mapping — two separate systems that can share a file but don't have to |
| **Assembly UX** | Panes within full Inspector | Patrick wants a **streamlined, assembly-focused UX** — pared down from Inspector's full surface |
| **Animation** | Not in scope | Patrick identified animation assembly (import, assign to meshes, manage groups) as a **major gap** |
| **File format** | New separate format (`.bauthoring` / `.bscene`) | Ryan is hesitant about new formats — suggests GLTF extensions or keeping it as simple key→URL JSON. GLX mentioned as future consideration |
| **Asset table complexity** | Key → URL + provenance + overrides | Ryan's model: just key → URL. Provenance and overrides are separate concerns |
| **Playground integration** | Not in scope | David (via Ryan) considers it a core requirement — asset table serialized with Playground snippets, prompt for missing assets |
| **Local file persistence** | Not addressed | Ryan raised File System API handles persisted in localStorage/IndexedDB so mappings survive page refresh |
| **Compression** | Draco mentioned in M7 | Patrick wants integrated Draco + Basis compression without CLI dependencies |
| **Scene settings** | Open question (#12) | Patrick confirmed: authoring file should store lights, cameras, ground, environment |
| **Override scope** | Limited to SmartLoader-loaded objects | David: overrides should work on ALL properties on ANY object — don't artificially limit |
| **Override UX** | New override editing UI in Inspector | David: Inspector already lets you edit clearColor, material textures, etc. — no new UX needed, just persistence |
| **Assembly UX** | Full streamlined assembly pane | David: don't build new UX — use Inspector with an **artist mode** that pares down complexity, plus drag-and-drop to add assets |
| **Smart asset visualization** | Embedded in assembly tool | David: a lightweight way to see what's smart-loaded — Inspector extension or pane |
| **Portable bundle** | Not discussed | David: authoring format should be like a zip — includes asset map AND the files, so you send it to someone and they just open it |

---

## Core Architecture: Two Independent Systems

The original plan treated everything as one coupled system (SmartLoader owns asset mapping, overrides, provenance, and the file format). After all three conversations, the architecture splits into **two independent systems** that can be used separately or composed together:

### System 1 — Smart Asset Resolution
**What it does:** Map logical keys to asset URLs, resolve `asset://` references, track which scene objects came from which key (provenance), handle loading/unloading/reloading.

**Used alone:** A developer wants keyed loading without overrides. They set up an asset table, load by key, swap assets by changing the URL behind a key.

### System 2 — Override Persistence
**What it does:** Persist property changes made on ANY scene object (not just smart-loaded ones). Inspector edits survive reload. Works on clearColor, material textures, transforms — everything.

**Used alone:** A user loads a single GLB in Sandbox, tweaks material colors in Inspector, and wants those tweaks to persist. No smart assets involved.

### Composition — Project File
When both systems are used together, a thin **project file** references both:

```json
{
  "version": 1,
  "assets": { "sodaCan": { "url": "./soda.glb" } },
  "overrides": [
    { "target": "sodaCan/materials/canPaint", "property": "albedoColor", "value": "#ff0000" },
    { "target": "scene", "property": "clearColor", "value": [0.2, 0.2, 0.2, 1] }
  ]
}
```

But architecturally, `assets` and `overrides` are independent modules that don't import each other. The project file is just a container that holds both. Either section can be empty. Either system can be used with its own standalone file.

This means:
- Override persistence can ship and be useful **without any smart asset work**
- Smart asset loading can ship and be useful **without any override work**
- The two systems can be built and tested in parallel
- The project file is a thin composition layer, not a monolithic format

### Asset Resolution: SmartLoader vs. `asset://` in FileTools

One remaining architectural question within System 1:

| | SmartLoader (current plan) | `asset://` in FileTools (Ryan's proposal) |
|--|--------------------------|------------------------------------------|
| **Integration point** | New class, new API surface | Existing `FileTools` — minimal new API |
| **How code references assets** | `smartLoader.load("sodaCan")` | `asset://sodaCan` anywhere a URL string is accepted |
| **Scope of change** | Additive, self-contained | Touches `FileTools`, a foundational class |
| **Provenance/disposal** | Built into SmartLoader | Not built-in — would need separate tracking |
| **Playground compatibility** | Needs explicit integration | Works automatically — any API that takes a URL works with `asset://` |

**Recommendation:** Hybrid — `asset://` protocol as the resolution layer in FileTools, with a higher-level orchestration class for provenance, key management, and disposal. M0 spike validates this.

---

## Goals (Combined from Patrick, Ryan & David)

### From Patrick
1. **Eliminate DCC round-tripping for small changes** — texture tweaks, UV adjustments, material parameter changes should not require Maya/Blender
2. **Assembly-focused, no-code UX** — streamlined tool for composing scenes from meshes, materials, textures, lights, cameras, animations
3. **Persistent, shareable project file** — save assembly decisions, reopen later, hand to a teammate
4. **Parameter-level overrides** — change a single material color, persist it, survive reloads
5. **Animation assembly** — drag-and-drop animation import, assignment to meshes, animation group management
6. **Integrated compression on export** — Draco mesh + Basis texture compression without CLI tools
7. **Scene-level settings** — lights, cameras, ground, environment stored in the project file

### From Ryan
1. **`asset://` protocol** — asset references are URL strings, resolved through FileTools, work everywhere strings are used for URLs
2. **Decoupled override system** — overrides are independent of asset mapping; can be built separately
3. **Playground integration** — asset table serialized with snippets; prompt user for missing assets
4. **Local file persistence** — File System API handles persisted in localStorage/IndexedDB; mappings survive page refresh
5. **Minimal new format** — avoid introducing new file formats if possible; consider GLTF extensions, keep the mapping simple (key→URL)
6. **GLX awareness** — design decisions should be compatible with GLX (emerging scene-level GLTF standard) where possible

### From David
1. **General-purpose override system** — don't limit overrides to smart-loaded assets; if we build override persistence, it should work for ALL properties on ANY scene object
2. **No new property-editing UX** — Inspector already lets users edit clearColor, material textures, transforms, etc. The gap is persistence, not editing. Don't rebuild what exists.
3. **Drag-and-drop to ADD assets** — today's Inspector drag-and-drop only replaces existing files; the real gap is adding new GLBs/glTFs/files to a scene
4. **Helper utility for adding objects** — a focused tool for bringing new assets into the scene, not a full assembly app
5. **Smart asset visualization** — some way to see what's been smart-loaded in the scene, either as an Inspector extension or a built-in pane
6. **Playground portability** — snippets with asset references should be shareable and work for recipients
7. **Portable authoring bundle** — the authoring format should work like a zip file: it includes the asset mapping AND the local files needed to fully view the scene, so you can send it to a partner and they unzip / load / see everything without chasing missing assets

---

## Three Deployment Modes

The two systems can be packaged for different deployment needs:

| Mode | What it contains | When to use | Analogy |
|------|-----------------|-------------|---------|
| **Loose project file** | JSON referencing external assets + overrides | Active development — assets on disk or a shared server | `.gltf` + separate files |
| **Project bundle** | Zip containing project JSON + all referenced files | Sharing with a collaborator — they open it and see everything | `.docx` (zip of XML + media) |
| **Baked export** | Self-contained `.glb` or `.babylon` with overrides pre-applied, no authoring metadata | Shipping to end users — lean, no editability | `.glb` |

Note: The bundle is just a standard zip with a well-known internal structure — not a custom file format. The "format" is the JSON schema, not the container.

```
my-scene.zip
├── project.json        (asset map + overrides)
├── assets/
│   ├── soda_can.glb
│   ├── table.glb
│   └── textures/
│       └── label.png
```

---

## Revised Milestones

The milestones are organized into two parallel tracks reflecting the two independent systems, plus shared milestones at the start and end.

```
M0 (Architecture Spike)
    │
    ├──── Track A: Smart Assets ──────────── Track B: Override Persistence ────
    │         │                                       │
    │     M1: Asset Resolution                   M2: Override System
    │     & Keyed Loading                        (general-purpose)
    │         │                                       │
    │     M3: Inspector Drag-and-Drop            (Inspector already has
    │     & Asset Visualization                   editing UX — M2 just
    │         │                                   adds persistence)
    │         └──────────── M4: Save/Load & Project Bundle ───────────────
    │                       (composes both systems)
    │                              │
    │                       M5: Export / Bake
    │                       (flattened delivery)
```

Track A and Track B can be built **in parallel** — they share no code dependencies. M4 composes them. M5 builds on M4.

---

### Milestone 0 — Architecture Spike
**Goal:** Resolve the SmartLoader vs. `asset://` question with a working prototype.

**Deliverables:**
- Prototype `asset://` protocol resolution in FileTools
- Prototype SmartLoader orchestration layer on top (provenance, key management)
- Test that `asset://sodaCan` works in `SceneLoader.LoadAssetContainerAsync`, `Texture` constructor, and other URL-accepting APIs
- Write-up with recommendation for David

**Why this is new:** Ryan's FileTools integration is a fundamentally different architecture than the current plan. We need to validate it before committing to either approach.

**Outcome:** Decision on architecture → all subsequent milestones build on this.

---

### Milestone 1 — Smart Asset Resolution & Keyed Loading *(Track A)*
**Goal:** Assets are referenced by stable logical keys. Resolution works through whatever architecture M0 selects.

**Deliverables:**
- Asset table management (add, remove, get, list keys)
- Key-based loading, unloading, reloading
- Provenance tracking (which scene objects came from which key)
- Event notifications (asset load, link changed, load failed)
- **Missing asset resolution callback** — an async hook that fires when a key's URL can't be resolved:
  ```ts
  onAssetNotFound: (key: string, expectedUrl: string) => Promise<string | File | null>
  ```
  If no callback is registered, missing assets are skipped with a console warning. Different UIs plug into this:
  - **Playground** → modal file picker dialog ("Asset 'sodaCan' not found — locate it?")
  - **Inspector** → error state in the asset visualization pane (M3) with inline "Locate" button
  - **Programmatic** → app developer provides their own logic
- **Local file handle persistence** (File System API + IndexedDB — Ryan's requirement)
- Playground example

**Depends on:** M0

---

### Milestone 2 — Override Persistence *(Track B — parallel with M1)*
**Goal:** Persist property changes made in Inspector so they survive reload. General-purpose — works on ANY scene object, not just smart-loaded ones.

This is a **standalone system** that can ship independently of smart assets. A user can load a GLB in Sandbox, tweak colors, and have those tweaks persist — no smart asset system required.

David's key insight: Inspector already has full UX for editing every property (clearColor, material textures, transforms, etc.). The missing piece is **persistence** — edits are lost on reload. No new editing UX needed.

**Deliverables:**
- Override data model (target object identifier, property path, value) — works on any scene object
- Value resolution (hex→Color3, arrays→Vector3/Color4, `{url}`→Texture, scalars)
- Override application after scene load
- Add, remove, query overrides
- Original value snapshots (for "reset to source")
- Override persistence to a standalone JSON file (can later be composed into a project file in M4)
- **Scene-level settings** — clearColor, environment texture, fog, etc. are just overrides on the scene object
- Visual indicator in Inspector for overridden properties (subtle badge or highlight)
- "Reset to original" per overridden property

**Depends on:** Nothing (independent of Track A). Can start immediately after M0 or even before.

---

### Milestone 3 — Inspector: Artist Mode, Drag-and-Drop & Smart Asset Visualization *(Track A)*
**Goal:** Make Inspector work for artists — not by building a new app, but by paring down the existing Inspector into an **artist mode** that hides developer-facing complexity, plus adding drag-and-drop for loading new smart assets and a visualization pane for what's loaded.

David's framing: don't introduce new UX where Inspector already handles it. Instead, give artists a simplified view of what Inspector already does, and fill the two actual gaps: (a) adding new assets to the scene without code, and (b) seeing what's been smart-loaded.

This also addresses Patrick's request for a "streamlined, assembly-focused UX" — it's not a separate app, it's Inspector in artist mode.

**Deliverables:**
- **Artist mode** — a toggle or mode in Inspector that pares down the UI to assembly-relevant functionality:
  - Hides developer-facing panels/options (e.g., raw shader inspection, engine internals, debug overlays)
  - Surfaces asset management, material editing, transform controls, animation assignment, scene settings
  - Still uses the same underlying Inspector components — no new property-editing UX
  - Patrick's "no-code" requirement is met: artists use the same Inspector, just with less noise
- **Drag-and-drop to ADD assets** — drop a .glb/.gltf/file onto Inspector or the viewport → it gets added to the scene as a new smart-loaded asset with an auto-generated key
- File/URL picker as alternative to drag-and-drop
- Key management (rename, remove, swap URL for an existing key)
- **Smart asset visualization** — an Inspector extension or pane that shows:
  - All smart-loaded keys
  - What URL each key resolves to
  - Which scene objects came from each key (provenance)
  - **Missing/broken assets** shown as warning entries with expected URL greyed out and a "Locate" / "Re-link" action (implements the M1 `onAssetNotFound` callback for Inspector)
  - Click a key → select its objects in the scene
  - Context menu: reload, remove, copy key
- **Animation import** — drag animation files onto meshes, manage animation groups (Patrick's gap)
- Basic undo (reload last saved state)

**Depends on:** M1

---

### Milestone 4 — Save/Load & Project Bundle *(Composition — brings both tracks together)*
**Goal:** Persist the full project state (asset map from Track A + overrides from Track B) to a file. Support both loose JSON and zip bundle modes.

This is the composition milestone — it takes the two independent systems and packages them together into a shareable project format.

**Deliverables:**
- **Project file JSON schema** — a thin container that holds both an asset map section and an overrides section. Either section can be empty (overrides-only file is valid, asset-map-only file is valid).
- Save and load APIs for loose project file
- **Project bundle (zip) save/load** — pack the project JSON + all referenced local files into a standard zip; load by unpacking and resolving relative paths (David's requirement)
- Schema validation with error recovery for missing assets (uses M1's `onAssetNotFound` callback)
- Relative URI resolution (links resolve relative to the project file or bundle root)
- **Playground snippet integration** — project state serialized as part of Playground JSON payload (David's requirement via Ryan); Playground provides its own `onAssetNotFound` implementation (modal file picker)

**Depends on:** M1 (for asset map), M2 (for overrides) — but either can be partial

---

### Milestone 5 — Export / Bake
**Goal:** Produce a self-contained **flattened** delivery file — distinct from the project bundle (M4). The bundle preserves editability; the baked export is a final, lean output with no authoring metadata.

The three modes in context:
- **M4 loose file** = project JSON with external references (for active development)
- **M4 bundle** = project JSON + files zipped together (for sharing with collaborators — still editable)
- **M5 baked export** = everything flattened into a single GLB or .babylon (for shipping to end users — NOT editable)

**Deliverables:**
- Bake pipeline (load all keys → apply overrides → merge → serialize)
- Material isolation (clone shared materials before applying overrides)
- GLB export with **integrated Draco mesh compression** (Patrick)
- **Integrated Basis texture compression** (Patrick — no CLI dependency)
- `.babylon` export for full Babylon fidelity
- Metadata stripping (source paths, authoring data removed)
- Inspector export button with format selector and compression options
- Programmatic export API

**What changed from original M7:**
- Integrated compression (Draco + Basis) is now a first-class deliverable, not optional (Patrick)
- Now M5 (was M7/M6) — milestones consolidated since override editing folded into M3 and scene explorer folded into M4

---

## Deferred / Out of Scope for v1

| Item | Source | Why deferred |
|------|--------|-------------|
| **Smart reload (file watching)** | Original plan | Browser can't watch filesystem. Teams can wire up their own watchers calling `reloadAsync`. |
| **GLTF extensions as format** | Ryan | Good long-term direction but premature — need to validate the simpler JSON approach first |
| **GLX compatibility** | Ryan | Emerging standard, not finalized. Keep design decisions compatible where possible. |
| **Full GLTF round-trip fidelity** | Gary | Not a product goal (confirmed) |
| **Separate "Babylon Assembly" app** | Patrick (implied) | Clarify with David — is this a mode within Inspector or a standalone app? v1 builds within Inspector. |

---

## Open Questions (Carry Forward)

Some questions from the original plan are now resolved; others remain.

| # | Question | Status |
|---|----------|--------|
| 1 | **SmartLoader class vs. FileTools integration vs. hybrid?** | Open → M0 spike resolves this |
| 2 | **Are overrides coupled to the asset system or independent?** | **Resolved** — independent (Ryan + David agree). Architecture B: two separate systems composed via a thin project file. |
| 3 | **New format vs. GLTF extensions?** | Open → v1 uses simple JSON; revisit post-v1 (Ryan) |
| 4 | **Assembly tool: Inspector pane or separate app?** | **Resolved** — David: no new UX; Inspector gets an "artist mode" that pares down complexity + drag-and-drop for adding assets |
| 5 | **File extension name?** | Open → defer until format stabilizes |
| 6 | **Is Playground integration a v1 requirement?** | Likely yes (David via Ryan) → confirm |
| 7 | **Provenance: flat key→URL (Ryan) or key→objects-created (original)?** | Open → depends on M0 architecture decision |
| 8 | **Should override persistence be limited to smart assets or truly general?** | **Resolved** — general (David). Any Inspector edit can be persisted. |
| 9 | **What properties are overridable?** | **Resolved** — all of them (David). Don't artificially limit. |
| 10 | **Authoring bundle file extension / format?** | Open → `.bab`? `.babylonproject`? `.bscene`? Zip-based with well-known internal structure. Needs team input. |
| 11 | **Does the bundle use standard zip or a custom container?** | Open → standard zip is simplest and has native browser support via libraries. Custom container adds complexity for unclear benefit. |

---

## Revised Timeline

| Milestone | Track | Scope | Estimate (AI-assisted) |
|-----------|-------|-------|----------------------|
| **M0** — Architecture Spike | Shared | FileTools prototype, decision write-up | ~1 day |
| **M1** — Asset Resolution & Keyed Loading | Track A | Core runtime + local file persistence | ~2 days |
| **M2** — Override Persistence | Track B | General-purpose override system + Inspector integration | ~3 days |
| **M3** — Artist Mode, Drag-and-Drop & Asset Viz | Track A | Inspector artist mode + add-assets UX + smart asset pane + animation import | ~3.5 days |
| **M4** — Save/Load & Project Bundle | Composition | Project file schema + zip bundle + Playground integration | ~2.5 days |
| **M5** — Export / Bake | Composition | GLB/Babylon export + Draco + Basis compression | ~3 days |
| **Total** | | | **~15 days (~3 weeks)** |

**With parallelization:** M1 and M2 run in parallel (independent tracks). M3 starts when M1 finishes. M4 starts when both M1 and M2 finish. **Critical path: ~2.5 weeks.**

```
Week 1:  M0 ──┬── M1 (Track A) ──── M3 (Track A) ──┐
               └── M2 (Track B) ─────────────────────┤
Week 2-3:                                            M4 ── M5
```

---

## Summary: What This Plan Prioritizes

1. **Two independent systems** — smart asset resolution (Track A) and override persistence (Track B) are architecturally decoupled; either can ship and be useful alone
2. **Override persistence benefits everyone** — not just smart asset users; load a GLB in Sandbox, tweak, persist
3. **No new property-editing UX** (David) — Inspector already does this; we add persistence, not UI
4. **Drag-and-drop to ADD assets is the real UX gap** (David) — the only truly new interaction needed
5. **Artist mode, not a new app** — Inspector gets a simplified mode that hides dev complexity, satisfying Patrick's "streamlined" request without building separate UX
6. **Resolve the `asset://` architecture first** (M0) — spike before committing
7. **Animation assembly is in scope** (Patrick) — addressed in M3
8. **Compression is in scope** (Patrick) — addressed in M5
9. **Playground integration is in scope** (David via Ryan) — addressed in M4
10. **Keep format decisions open** — simple JSON now, revisit GLTF extensions / GLX post-v1
11. **Parallel execution** — Tracks A and B can be built simultaneously, shortening the overall timeline

---

## Related Documents

- **[Goals & Scenarios](babylon-authoring-format-goals.md)** — problem statement and stakeholder input
- **[Original Plan](babylon-authoring-format-plan.md)** — the pre-Patrick/Ryan milestone plan
- **[Patrick Discussion](babylon-authoring-format-patrick.md)** — March 24 conversation summary
- **[Ryan Discussion](babylon-authoring-format-ryan.md)** — March 24 conversation summary
- **[Technical Dev Doc](babylon-authoring-format-devdoc.md)** — file format spec and implementation details
- **[Design Decisions](babylon-authoring-format-decisions.md)** — decisions made and open questions
- **[Risks](babylon-authoring-format-risks.md)** — risks per milestone with severity ratings
