# Babylon Authoring Format — Project Goals & Scenarios

## The Problem We're Solving

### What exists today

Babylon.js has two categories of file formats:

- **DCC-native formats** (Maya `.ma`, Blender `.blend`, Max `.3ds`) — where artists author content
- **Transmission formats** (`.gltf`, `.glb`, `.babylon`) — optimized last-mile delivery to the browser

Both GLTF and the current `.babylon` format are **transmission formats**. As Patrick put it:

> "Think of the Babylon file that we have currently and GLTF as basically the same thing… they're both last mile files."

There is **no Babylon-native authoring or assembly layer** between the DCC tools and the final export. This is the gap.

### Why this is painful

**1. Constant round-tripping through DCC tools for small changes**

To change a few pixels on a texture, the current workflow is:

1. Open the texture in Substance/Photoshop and make the edit
2. Open Maya/Blender
3. Re-export from Maya to GLTF/GLB
4. Manually replace the file in the project
5. Reload the scene in Babylon

> "If I want to change a few pixels on a texture… I have to go back to the texture tool… open up Maya… export from Maya to GLTF… and then manually replace." — Patrick

> "There's a lot of lost time in just going through, making a change, exporting the change, importing the change, exporting a GLB." — Patrick

**2. Renderer mismatch — what you see in the DCC tool ≠ what you see in Babylon**

Artists iterate in Maya or Blender, but those are different renderers. The only way to see what something actually looks like in Babylon is to export and load it — which brings you back to the round-trip problem.

> "Whatever renders in Blender or Maya… does not look like Babylon. That's not the same renderer." — Patrick

**3. Binary replacement problem with GLB**

GLB packs everything (JSON, geometry, textures) into a single binary. Any change — even a single texture — means replacing the entire binary.

> "If I make a change… I have to export again. So I'm replacing a binary, the entire binary every time I do it." — Patrick

**4. Round-tripping is inherently lossy**

Even with GLTF (the text-based variant), round-tripping through Babylon loses structural information:

- UV seams cause vertex splits that explode vertex counts on export
- GLTF meshes with multiple primitives get split into separate Babylon meshes
- Exporting back cannot preserve the original structure

> "Whenever I have a UV seam… once we go to GLTF, that UV seam will split the vertices… we basically explode the vertex count." — Patrick

> "Babylon does not guarantee GLTF round-trip fidelity, and this is not a current product goal." — Gary

**5. Collaboration failures on JSON-based assets**

Node materials and other Babylon JSON artifacts can't be meaningfully diffed or merged — IDs are renumbered on every save.

> "Any JSON created by one of our tools is a binary… we renumber every ID… you can't diff them." — Patrick

> "Whoever checks in second nukes the work of the first person." — Patrick

**6. No compositional scene building**

The current Babylon format serializes everything into a single file. There's no way to compose a scene from independently evolving external assets.

> "What we are trying to have is more like some links… this is really what this project is about — how do you compose something." — Sebastien

---

## What We're Building (and What We're Not)

### The core idea: a compositional authoring layer

David laid out the vision in two phases:

1. **Keyed loading** — a SmartLoader extension in Inspector where `smartLoader.load("foo")` loads an asset by a stable key. The key could resolve to a texture, a GLTF, etc. Playground code uses the same key regardless of what file it points to — **code doesn't change when assets change.**

2. **Save as a new Babylon authoring file** — persist the keyed scene so it can be reopened. Inspector lets you `getObjByKey("foo")` to find objects loaded by a GLB. If you change `glb.material.red` in Inspector and save, the change is stored as an override — not baked into the source asset.

This creates a **scene-level compositor** — a format and runtime API where a Babylon scene is built from **linked external assets** rather than baked-in data. The scene file stores:

- **Links** to external assets (GLBs, textures, etc.) — not copies of the data
- **Overrides** applied as diffs after loading — not baked into the source files
- **Provenance** — which scene objects came from which linked asset

SmartLoader is **format-agnostic** — linked assets can be in any format Babylon's SceneLoader supports (`.glb`, `.gltf`, `.babylon`, `.obj`, etc.). You can even mix formats in the same authoring file.

Patrick described this as a **"fat Babylon"** format — the working file you use during authoring — vs the existing **"thin Babylon"** or GLB that you ship.

> "There might be like a fat Babylon format versus a transmission Babylon format." — Patrick

> "Where the fat one is the one that you're using when you're actively making changes." — Georgina

> "They should stay as a link… instead of being mashed into your file." — Sebastien

### A separate file format, not an extension of `.babylon`

The authoring file is its own format with its own file extension (name TBD), not an extension of the existing `.babylon` format. A `.babylon` file today is always self-contained and always runnable — you can drop it into Sandbox and it renders. Adding links would mean `.babylon` files sometimes work and sometimes don't depending on whether linked assets are reachable. A separate extension sets clear expectations:

- `.babylon` = self-contained, always works
- authoring file = requires linked assets, designed for iteration

This mirrors the `.gltf` (external refs) vs `.glb` (self-contained) distinction that the ecosystem already understands. See `babylon-authoring-format-decisions.md` for the full reasoning and alternatives considered.

### What this is NOT

- **Not a replacement for DCC tools** — Maya/Blender/Substance remain the source of truth for meshes and textures
- **Not full state serialization** — we're persisting intent (links + overrides), not the entire runtime scene
- **Not a new rendering pipeline** — this uses existing Babylon loaders and the existing scene graph

> "Don't take me saying we need this tool as you should go make this tool." — Patrick (re: investment decisions being David's call)

---

## Concrete Scenarios This Unlocks

### Scenario 1: Artist updates a texture → scene reflects it without re-export

**Today:** Artist edits a texture in Substance → opens Maya → re-exports the entire GLB → replaces the file in the project → developer reloads the scene and hopes nothing broke.

**After:** The Babylon authoring file has a link `"canLabel" → "textures/soda_label.png"`. The artist updates `soda_label.png` directly. The developer opens the authoring file in Babylon — the updated texture is loaded via the link. No re-export, no Maya, no GLB repacking.

### Scenario 2: Scene composition from multiple independent assets

**Today:** Building a scene with a house, car, and trees requires importing each asset into a single GLB or Babylon file. If the house model gets updated upstream, the entire scene must be rebuilt.

**After:** The authoring file references `house.glb`, `car.glb`, `trees.glb` as linked assets with transforms and overrides. Each asset is its own file, maintained by its own artist. Update the house? The scene picks it up on next load.

> Sebastien described this verbally: "Scene references house.glb, car.glb, tree.glb — scene controls transform, materials, parameters — assets can be updated independently without breaking the scene."

### Scenario 3: Material tweaking in Inspector without DCC tools

**Today:** Want to change a material color? Go back to Maya, change the material, re-export the GLB, reload in Babylon, compare. Repeat.

**After:** Open the scene in Inspector. The Inspector shows that the mesh was loaded via key `"sodaCan"` → `soda_can.glb`. Change the material color in Inspector. The change is saved as an **override** in the authoring file — the source GLB is never touched. Next time you open the file, the override is reapplied automatically.

### Scenario 4: Preview in the actual renderer before export

**Today:** Artists preview in Maya's renderer, which doesn't match Babylon. They export, load, discover it looks wrong, go back, tweak, re-export. Repeat.

**After:** The assembly tool (Inspector + authoring file) lets you see assets rendered by Babylon itself. Texture, material, and lighting changes are previewed in real time in the actual target renderer.

> "I can just change the texture, relink the texture, and then I can see it in Babylon before I even go out to GLB." — Patrick

### Scenario 5: Parallel artist/developer workflows

**Today:** If an artist is updating a mesh and a developer is laying out the scene, they block each other — the developer can't take a new version of the mesh without rebuilding the scene.

**After:** The authoring file separates concerns: the artist owns the GLB, the developer owns the scene layout and overrides. Taking a new drop of the mesh means the developer just gets the updated GLB — their overrides and layout survive.

> "You're not working in the same repo… I can dial everything in and hand you the asset." — Patrick

### Scenario 6: AI-generated 3D content assembly

**Today:** AI tools generate many small 3D assets (meshes, textures). Assembling them into a scene requires manual import and baking.

**After:** The authoring file acts as an orchestrator — reference generated assets by link, position them, apply overrides. Regenerate an asset with a new AI model? The link still works, the scene still loads.

> Sebastien identified this as a key emerging scenario: "Many small generated assets need a way to assemble, reposition, and manage them without flattening everything."

### Scenario 7: Smart reload during development

**Today:** Making iterative changes means manually reloading the scene after every edit.

**After:** The smart loader watches linked files. When a texture or model changes on disk, it re-imports automatically — no manual reload.

> "I make a texture change and it gets re-imported… I make a mesh change, it gets re-imported… like, hey, the file updated." — Patrick

---

## Proposed Milestones

### Milestone 1 — Keyed Loading (Runtime Foundation)

**Goal:** Application code references assets by stable logical keys, not file paths.

**What it enables:** Decouples code from concrete assets. Changing what `"sodaCan"` points to doesn't require code changes.

### Milestone 2 — Authoring File Save/Load

**Goal:** Persist the link table, provenance, and overrides to a file. Reload a scene from the authoring file.

**What it enables:** Session persistence — close and reopen a scene without losing assembly decisions.

### Milestone 3 — Inspector: Scene Explorer

**Goal:** Inspector shows linkable keys and resolved assets. Scene objects are attributed to their source keys.

**What it enables:** Visual iteration — see what's linked, understand where each object came from.

### Milestone 4 — Inspector: Assembly Tool

**Goal:** A dedicated Inspector pane for composing scenes from linked assets — drag-and-drop files, browse and select assets, add/remove/swap keys.

**What it enables:** Scene composition without code — drag a GLB into the scene, swap what a key points to via a file picker, visually arrange and manage linked assets.

### Milestone 5 — Inspector: Override Editing

**Goal:** Track Inspector edits on keyed objects and persist them as overrides in the authoring file.

**What it enables:** The "change a color in Inspector and save it" workflow — non-destructive edits without touching source assets.

### Milestone 6 — Export / Bake to Delivery Format

**Goal:** Bake the authoring file into a lean `.glb` or `.babylon` for deployment, or ship the authoring file directly alongside its linked assets.

**What it enables:** Two deployment paths — self-contained portable file (GLB) or linked authoring file with external assets.

---

## Stakeholder Input Summary

| Person                     | Role                                 | Key Contribution                                                                                                                                                                                                                                                                                                                                                                   | Date   |
| -------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **David Catuhe**           | Leadership / strategic direction     | Defined the two-phase vision: (1) keyed loading via SmartLoader as an Inspector extension, (2) save as a new Babylon authoring file. Posed the key design question: if a user changes `glb.material.red` in Inspector, do we save that as an override? Answer for v1: yes. Code stability principle — playground code uses the same key regardless of what file the key points to. | 1:1    |
| **Patrick Ryan**           | Art pipeline / 3D artist perspective | Defined the taxonomy (DCC → interchange → transmission). Described the "fat vs thin" Babylon concept. Articulated the round-tripping pain from an artist's workflow. Emphasized assembly tool and smart reload.                                                                                                                                                                    | Feb 10 |
| **Gary Hsu**               | Technical / loader architecture      | "Requirements first, not format first." Confirmed current `.babylon` limitations (base64 textures, raw JSON geometry). Explained why round-tripping is inherently lossy.                                                                                                                                                                                                           | Mar 3  |
| **Sebastien Vandenberghe** | Architecture lead                    | Framed it as "compositor" — scene-level composition from linked assets. Identified AI content assembly as key scenario. Recommended requirements doc → review with Patrick.                                                                                                                                                                                                        | Mar 19 |

---

## Delivery Model

The authoring file supports **two deployment paths**:

1. **Ship the authoring file directly** — deploy the authoring file alongside its linked assets (GLBs, textures). At runtime, SmartLoader resolves the links and applies overrides. This is the simpler path for web apps where assets are served from the same origin or CDN.

2. **Bake to a self-contained file** — flatten the authoring file into a single `.glb` or `.babylon` with all assets embedded and overrides pre-applied. Use this when you need a single portable file with no external dependencies (e.g., offline sharing, embedding in a third-party platform).

Both paths should be possible. The authoring format is the single source of truth — how you deploy it is a separate decision.

---

## Guardrails / Non-Goals

- Babylon is **not** becoming a texture-painting or mesh-editing tool
- DCC tools **remain** the source of truth for geometry and textures
- No goal to achieve **full GLTF round-trip fidelity** (confirmed by Gary as not a product goal)
- v1 will **not** rewrite source GLB/texture files — overrides are diffs, not mutations
