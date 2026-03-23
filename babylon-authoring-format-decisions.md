# Babylon Authoring Format — Open Questions & Design Decisions

A running list of decisions made, alternatives considered, and questions that need team input. Each item includes the current decision and the reasoning — flag anything you disagree with.

---

## Decided (Needs Team Validation)

### 1. Separate file extension vs. extending `.babylon`

**Decision:** Separate file extension (e.g., `.bauthoring`, `.bscene` — name TBD)

**Why:** A `.babylon` file today is always self-contained and always runnable. Adding links would mean `.babylon` files sometimes work and sometimes don't depending on whether linked assets are reachable. A separate extension sets clear expectations and avoids confusing existing users.

**Alternative considered:** Extend `.babylon` with new top-level keys (`links`, `overrides`, `provenance`) using the existing `AddParser()` system. Advantage: free compatibility with Sandbox, Playground, and existing tooling. Disadvantage: breaks the "drop a .babylon file anywhere and it works" guarantee.

**Who should weigh in:** Gary (he asked "why a new format at all?"), Sebastien (said "driven by requirements"), Patrick

---

### 2. Overrides saved as diffs, not baked into source

**Decision:** When a user changes `material.red` in Inspector, save the change as an override in the authoring file. Do NOT modify the source GLB.

**Why:** This preserves the linkable-asset model — the source file stays clean, overrides are layered on top, and taking a new version of the source asset doesn't lose your tweaks. This was explicitly discussed and agreed on with David.

**Alternative considered:** Bake changes back into the source GLB. Rejected for v1 because it's destructive, requires Babylon to act as a glTF writer at edit time, and breaks the separation between authoring and source assets.

**Who should weigh in:** David (already agreed), Patrick

---

### 3. Milestone ordering: Override editing (M5) before Export/Bake (M6)

**Decision:** Build override editing first, then export.

**Why:** Export without overrides is just "load N GLBs and merge them" — not compelling. Overrides are what makes the authoring format different from just calling `SceneLoader` manually. David's core scenario ("change `glb.material.red`, save it") requires overrides, not export. Export naturally follows — once overrides work, baking them into a GLB is straightforward.

**Alternative considered:** Export first. Would let you ship composed scenes sooner, but without the authoring-time iteration that's the core value proposition.

**Who should weigh in:** David, Patrick

---

### 4. Smart Reload (M7) as lowest priority

**Decision:** Smart reload (file watching) is the last milestone.

**Why:** It's a dev experience improvement, not core functionality. It also has platform constraints — browsers can't watch the filesystem, so it requires polling or dev-server integration. All the core authoring workflows (load, assemble, override, save, export) work without it.

**Alternative considered:** Building it earlier alongside the Inspector milestones. Patrick described it as part of the vision ("I make a texture change and it gets re-imported"), but it's aspirational and adds scope.

**Who should weigh in:** Patrick

---

### 5. Assembly tool as a dedicated Inspector pane (M4)

**Decision:** Build a separate Assembly pane in Inspector with drag-and-drop, asset browser, and key management — distinct from the scene explorer (M3) and override editing (M5).

**Why:** Assembly (managing the link table — what keys exist, what files they point to) is conceptually different from override editing (tweaking properties on loaded objects). The scene explorer shows what's there; the assembly tool lets you change what's there; the override editor lets you refine what's loaded.

**Alternative considered:** Folding assembly into the scene explorer's properties pane (click a key → change its URL in properties). Simpler, but the user wanted a richer drag-and-drop experience for composing scenes.

**Who should weigh in:** Ryan (Inspector architecture), Patrick (UX needs)

---

### 6. Authoring file can be shipped directly OR baked

**Decision:** Support both deployment paths — ship the authoring file alongside linked assets, or bake to a self-contained GLB/.babylon.

**Why:** For web apps where assets are on the same server/CDN, shipping the authoring file directly is simpler and preserves the ability to update individual assets. For offline sharing or embedding, baking to GLB is needed.

**Alternative considered:** Authoring file is only for iteration, always bake for deployment. Too restrictive — the authoring file IS a valid runtime format when linked assets are reachable.

**Who should weigh in:** Patrick (deployment scenarios), David

---

### 7. SmartLoader is entirely new API surface (no modifications to existing classes)

**Decision:** SmartLoader is additive. No changes to Scene, SceneLoader, AssetContainer, Inspector core, or any existing public APIs.

**Why:** Backward compatibility. Existing `.babylon` files, glTF loading, and Inspector behavior are completely unaffected. SmartLoader is opt-in — scenes that don't use it work exactly as before.

**Risk area:** Override tracking from Inspector edits (M5) may need hooks in Inspector's property binding system. If so, these must be opt-in and only activate when a SmartLoader is present on the scene.

**Who should weigh in:** Gary (backward compat), Ryan (Inspector architecture)

---

## Open Questions (Need Decision)

### 8. File extension name

**Options:**
- `.bauthoring` — clear but long
- `.bscene` — short, scene-focused
- `.babylon-authoring` — explicit but very long
- `.bab` — short but potentially confusing
- Something else?

**Who should decide:** Team consensus

---

### 9. How does SmartLoader discover the scene?

**Current assumption:** SmartLoader is instantiated with a scene reference (`new SmartLoader(scene)`), and stores itself on `scene.metadata.smartLoader` so Inspector can find it.

**Question:** Is `scene.metadata` the right place? Should there be a first-class `scene.smartLoader` property? That would require modifying the Scene class (conflicts with decision #7).

**Who should decide:** Gary, Sebastien

---

### 10. Provenance — regenerated on load or restored from file?

**Current assumption:** Provenance is regenerated fresh every time assets are loaded (by snapshotting object names from the AssetContainer). The saved provenance in the file is informational only.

**Question:** Should saved provenance be used for validation? e.g., "this key used to produce 3 meshes but now produces 4 — something changed upstream." This would be useful for detecting asset drift but adds complexity.

**Who should decide:** Patrick (would this catch real problems in his workflow?)

---

### 11. Name collisions across linked assets — resolved

**Decision:** Use **container-scoped lookup**. Overrides and provenance search within the `AssetContainer` for each key, not across the entire scene. Two keys can both have `"Cube"` without conflict. Provenance stores both `name` and `index` (position in the container's array) — name is primary, index is fallback for renamed/duplicate objects.

**Runtime vs. serialization:** At runtime, provenance tracks direct object references (no fragility). Names and indices are only used when saving/loading the authoring file.

**Remaining edge case:** Duplicate names within a single source GLB are rare but possible. The index fallback handles this.

---

### 12. Should the authoring file store scene-level settings?

**Question:** Should the authoring file also persist camera position, environment texture, fog, lighting, skybox, and other scene-level settings alongside the links and overrides?

**Why it matters:** Without this, opening an authoring file gives you the linked assets but not the scene setup. The user would need to recreate camera position, lighting, etc. every time.

**Options:**
- Yes — add a `sceneSettings` section to the schema (camera, environment, fog, etc.)
- No — keep the format purely about asset composition; scene settings are the application's responsibility
- Later — defer to a future milestone

**Who should decide:** David, Patrick

---

### 13. How are overrides identified when objects are renamed upstream?

**Scenario:** An override targets `"materials.canPaint"`. The artist renames the material to `"canPaintV2"` in the source GLB. The override now silently fails (target not found).

**Options:**
- Warn on load ("override target not found")
- Use stable IDs instead of names (but glTF doesn't guarantee stable IDs across re-exports)
- Use index-based targeting as fallback (fragile)
- Accept this as a known limitation — names are the best we have

**Who should decide:** Patrick (how often do artists rename things mid-pipeline?), Gary

---

### 14. Undo support scope in Assembly tool (M4)

**Question:** How deep should undo go?

**Options:**
- Simple: undo last add/remove/swap only
- Full: undo stack for all assembly + override operations
- None for v1: rely on re-loading the saved authoring file as "undo"

**Who should decide:** Ryan (Inspector conventions)

---

### 15. Should Inspector save generalize beyond SmartLoader?

The SmartLoader plan creates an asymmetry: SmartLoader scenes can persist Inspector edits (as overrides), but regular scenes can't. See `babylon-authoring-format-inspector-save-discussion.md` for a full analysis of three options. Current recommendation is Option C — ship SmartLoader overrides + improve the existing export UX for regular scenes, defer generalization to post-v1.

**Who should decide:** David (strategic direction), Ryan (Inspector architecture), Patrick (user needs)

---

### 16. Timeline and investment level

The current estimate is ~13 weeks at 85% allocation (~10–11 with parallelization). This covers all 7 milestones through smart reload.

**Question:** Is this the right scope for v1? Should any milestones be cut or deferred? Patrick cautioned: "Don't take me saying we need this tool as you should go make this tool" — investment decisions are David's call.

**Who should decide:** David
