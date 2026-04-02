# Babylon Authoring Format — Goals

**Last updated:** March 31, 2026

---

## Problem Statement

Babylon.js has no native authoring layer. Both the existing `.babylon` format and glTF/GLB are **transmission formats** — optimized last-mile delivery to the browser. As Patrick Ryan put it: "Think of the Babylon file and GLTF as basically the same thing… they're both last mile files." There is no "**fat**" Babylon format — the working file you use during authoring — only "**thin**" delivery formats.

Today, artists author content in DCC tools (Maya, Blender, Substance), export to these transmission formats, and load them into Babylon. Every small change — a texture tweak, a material color adjustment — requires a full round-trip back through the DCC tool and a re-export. The renderers don't match, so what you see in the DCC tool isn't what you see in Babylon. GLB packs everything into a single binary, so any change means replacing the entire file.

This project adds a **compositional authoring layer** to Babylon.js — a system where scenes are built from **linked external assets** with **non-destructive overrides**, rather than from monolithic baked files.

---

## Core Goals

### G1 — Smart Assets: Reference assets by logical key, not file path

Assets are referenced by stable logical keys instead of hardcoded paths. Changing what a key points to requires zero code changes. Supports any file type Babylon can load (GLBs, glTFs, textures, node material JSON, animation files).

**Why:** Decouples code from concrete files. Developers write `smartAsset.load("chair")` — when the art team delivers a new version, only the URL behind the key changes. Code stability across the entire asset pipeline.

**Done when:** A user can `load("key")`, `unload("key")`, and `reload("key")`. Swapping the underlying URL of a key does not require changing application code. Missing assets trigger a resolution callback. Events fire on load, link change, and load failure.

### G2 — Override Persistence: Save Inspector property edits as non-destructive diffs

When a user edits any property in Inspector — transforms, material scalars, material colors, material textures, scene-level settings (clearColor, fog, environment), or any other property — the change is captured as an override that survives reload. Overrides are diffs layered on top of source assets — the source files are never modified. The override system targets ALL properties on ANY scene object from day 1.

**Why:** Eliminates round-tripping for small changes. An artist can tweak material colors in Inspector and save their work without re-exporting from a DCC tool.

**Done when:** Any Inspector property edit is automatically captured as an override. Overrides persist across reload. "Reset to original" restores the pre-override value. Overrides can be saved to and loaded from a standalone JSON file with round-trip fidelity.

### G3 — Asset Composition: Assemble scenes from individual parts

Import individual assets (meshes, textures, materials, animations) as separate smart assets. Create materials in Inspector, wire up relationships (texture→material→mesh→animation), and save the assembly as a project. Atomic asset types in scope: mesh files (GLB/glTF/OBJ), standalone textures (PNG/JPG/EXR/ENV), material files (node material JSON), and animation files.

**Why:** Enables a compositional workflow where individual assets are the atoms. Assets evolve independently — updating one doesn't break the assembly.

**Done when:** A user can import individual file types as smart assets, create new materials in Inspector, assign imported textures to material slots, assign imported animations to meshes/skeletons, and export the composed scene to GLB.

### G4 — Portable Project Bundle: Package everything into a shareable bundle

Package the smart asset map, overrides, and all referenced files into a single portable archive (.babylonzip or similar). Anyone can open it with zero setup — no missing file prompts, no server dependencies.

**Why:** Collaboration. Send a complete project to a colleague, client, or community member and it just works.

**Done when:** A user can export a project as a single archive containing the asset map, overrides, and all referenced files. A recipient can open the archive and see exactly the same scene with no setup.

### G5 — Playground Integration: Smart assets work in Playground

The smart asset table serializes as part of Playground JSON payloads. Playground code references assets by key. When a snippet is shared and the recipient doesn't have an asset locally, the system prompts them to locate it via a modal file picker.

**Why:** Playground is the primary way developers share Babylon.js code. Smart assets must work there for the system to be useful in practice.

**Done when:** A Playground snippet can reference smart asset keys. The asset table persists when saving/sharing snippets. Missing assets trigger a Playground-specific prompt for the user to locate files.

---

## Architecture Principle: Two Independent Systems

The system is architected as **two independent systems** composed via a project file:

| System | Purpose | Standalone Value |
|--------|---------|-----------------|
| **Smart Assets** (G1) | Map logical keys to asset URLs, load/unload/reload by key | Developers decouple code from concrete files; artists swap assets without code changes |
| **Override Persistence** (G2) | Persist Inspector property edits so they survive reload — works on ANY scene object | Users tweak a GLB in Inspector and keep their changes — no smart assets needed |

Either system can ship and be useful alone. When used together, a project file composes both. This enables parallel development tracks and independent value delivery.

---

## Milestone Structure

Seven milestones across two parallel tracks, converging for composition:

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

### M1 — SmartAsset Loading
> "I can create a smartAsset in code."

Key-based loading, unloading, reloading. Asset table management. Event notifications. Missing asset resolution callback. Support for all Babylon-loadable file types.

### M2 — SmartAsset Inspector UX
> "I can add / view / modify smart assets in Inspector."

Drag-and-drop to add assets. Key management (rename, remove, swap URL). Smart asset visualization pane showing all keys, resolved URLs, provenance, missing/broken assets.

### M3 — Save/Load SmartAsset Map
> "I can save a file and load it elsewhere."

JSON schema for smart asset map. Save/load APIs. Schema validation with error recovery for missing assets. Relative URI resolution. Playground snippet integration.

### M4 — Inspector Overrides Tracking
> "I can make Inspector changes and they are tracked."

Override data model (target identifier, property path, value). Value resolution (hex→Color3, arrays→Vector3/Color4). Override application after scene/asset load. Original value snapshots for "reset to source." Visual indicator in Inspector.

### M5 — Save/Load Inspector Overrides
> "I can save and load overrides to return to the same state."

Override persistence to standalone JSON. Load and apply to current scene. Round-trip fidelity.

### M6 — Save/Load Babylon Zip
> "I can save a portable bundle that works anywhere."

Bundle save (pack asset map + overrides + all referenced files into a standard zip). Bundle load (unpack, rewrite URLs, load). Validation on load. Inspector UI for save/load.

### M7 — Asset Composition
> "I can assemble a scene from individual parts and export to GLB."

Import individual file types as smart assets (standalone textures, animation files, material files). Project file with `inlineObjects` section for in-tool-created objects. Inspector UX for assigning textures to material slots and animations to meshes. Export via GLTF2Export.

Additional M7 goals from stakeholder feedback:
- **Animation assembly** — import animation files, assign to meshes/skeletons, manage animation groups (Patrick)
- **Integrated compression** — Draco geometry compression + Basis texture compression without external CLI dependencies (Patrick)
- **Artist mode** — a streamlined Inspector mode that pares down complexity for asset assembly workflows (David)
- **AI content assembly** — the authoring format as an orchestrator for AI-generated 3D assets: reference, position, override, and regenerate (Sebastien)

---

## User Scenarios

### Scenario 1: Developer — Stable code, swappable assets
A developer building a product configurator writes code that references assets by key: `load("chair")`, `load("table")`. The art team delivers updated models throughout the project. Each time, the developer updates the URL behind the key — the code never changes.

### Scenario 2: Artist — Tweak, save, share, pick up where you left off
An artist loads a GLB in Inspector, changes material colors, adjusts the clear color, and repositions lights. She saves her changes. The next day, she loads the same GLB and her overrides file — the scene looks exactly as she left it. She sends both files to a teammate, who opens them and sees the same scene.

### Scenario 3: Artist — Assemble a scene from parts and export
An artist imports a character mesh, textures, and animation files as separate smart assets. She creates a PBR material in Inspector, assigns textures, assigns the material to the mesh, and wires up animations. She saves as a portable bundle and exports to GLB.

---

## Inspiration: USD (Universal Scene Description)

USD is an existing scene description format that solves many of the same problems. While we are not adopting USD directly, its design principles inform our architecture:

- **Composition arcs** — USD layers, references, and sublayers provide non-destructive scene composition. Our smart assets + overrides system follows the same principle: linked assets with layered diffs.
- **Opinion strength ordering** — USD resolves conflicts via a well-defined layer stack. Our override system provides a simpler single-layer model that could extend to multi-layer in the future.
- **Asset resolution** — USD's `ArResolver` maps logical asset paths to concrete locations. Our smart asset key→URL resolution serves the same purpose.
- **Payload deferral** — USD can defer loading heavy payloads. Our smart asset system supports explicit load/unload/reload per key.
- **Variant sets** — USD allows switching between pre-defined variants of an asset. Our key-based system enables this by swapping the URL behind a key.

Key differences from USD:
- We are web-first (browser, JavaScript/TypeScript, no native runtime required)
- We compose at the file level (whole GLBs, textures), not at the prim/property level
- Our format is JSON-based, not binary
- We leverage Babylon's existing scene graph and loaders rather than building a new runtime
- v1 is single-layer overrides (one override set), not multi-layer opinion stacking — but the architecture should not preclude multi-layer in the future

---

## Design Decisions (Already Made)

1. **Separate file extension** — not extending `.babylon`. A `.babylon` file is always self-contained. The authoring format requires linked assets. (Extension name TBD — `.bauthoring`, `.bscene`, etc.)
2. **Overrides as diffs, not mutations** — source files are never modified. Overrides are layered on top.
3. **SmartLoader is additive** — no modifications to existing Scene, SceneLoader, AssetContainer, or Inspector APIs. Fully backward compatible.
4. **Two deployment paths** — ship the authoring file directly (web apps with CDN) or bake to self-contained GLB/.babylon.
5. **Override system is general-purpose** — works on ANY scene object and ALL properties, not limited to smart-loaded assets.
6. **Composable project file** — the project file holds both `assets` and `overrides` sections, but either can be empty. Smart assets without overrides, or overrides without smart assets, are both valid.

## Open Architecture Questions

1. **Asset resolution mechanism** — standalone SmartLoader class (additive, self-contained, new API surface) vs. `asset://` protocol in FileTools (any existing URL-based API works automatically, touches foundational class). Decision deferred to architecture phase.
2. **File extension name** — `.bauthoring`, `.bscene`, `.bab`, or something else. Needs team consensus.

---

## Known Risks

1. **🔴 Override tracking from Inspector edits** — Inspector's `BoundProperty` directly mutates objects. Intercepting changes to build a diff layer — distinguishing "original value from the GLB" vs. "previous override value," snapshotting original values at load time — is the hardest technical problem in the project. See risks doc for full analysis.
2. **🔴 Browser file I/O** — Browsers can't write files without user interaction. File System Access API is Chrome/Edge only. There is no "just save to the same file." Affects M3 (save/load), M5 (override persistence), and M6 (bundle save).
3. **🟡 API surface lock-in** — Once SmartLoader ships as a public API, backward compatibility is permanent per Babylon conventions. Consider shipping as `@beta` initially. API review with Gary/Sebastien before shipping M1.

---

## Non-Goals

- Not a replacement for DCC tools — Maya/Blender/Substance remain the source of truth for geometry and textures
- Not full state serialization — we persist intent (links + overrides), not the entire runtime scene
- Not a new rendering pipeline — uses existing Babylon loaders and scene graph
- No goal to achieve full GLTF round-trip fidelity
- v1 will not rewrite source GLB/texture files

---

## Stakeholders

| Person | Role | Key Input |
|--------|------|-----------|
| David Catuhe | Strategic direction | Two-phase vision: keyed loading → authoring file. Overrides on ALL properties. Portable bundle. |
| Patrick Ryan | Art pipeline / artist perspective | Fat vs thin format concept. Assembly tool. Animation gap. Compression needs. |
| Gary Hsu | Technical / loader architecture | Requirements first. Backward compat. Round-trip limitations. |
| Sebastien Vandenberghe | Architecture lead | Compositor framing. AI content assembly scenario. |
| Ryan Tremblay | Inspector architecture | `asset://` protocol proposal. Two independent systems architecture. |

---

## Related Documents

- [Milestones v2](../../babylon-authoring-format-milestones-v2.md)
- [Original Goals & Scenarios](../../babylon-authoring-format-goals.md)
- [Design Decisions](../../babylon-authoring-format-decisions.md)
- [Technical Dev Doc](../../babylon-authoring-format-devdoc.md)
- [Risks](../../babylon-authoring-format-risks.md)
- [Revised Plan](../../babylon-authoring-format-newPlan.md)
- [Inspector Save Discussion](../../babylon-authoring-format-inspector-save-discussion.md)
