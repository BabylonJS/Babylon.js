# Patrick Discussion — March 24, 2026

**Meeting:** "Discuss file format work" · March 24, 2026 · 12:30–1:00 PM
**Participants:** Georgina Halpern, Patrick Ryan

---

## Key Themes

### 1. The real pain is going back to Maya, not reloading in Inspector

Patrick clarified that the manual reload button in Inspector is fine — the problem is **having to go back to Maya/Substance for every iteration**. Small changes (texture tweak, UV adjustment, material parameter) currently require a full DCC → export → import cycle.

### 2. Inspector changes don't persist

Changes made in Inspector today are lost on reload or when shared. This is a core problem — there's no way to save your work in Inspector and hand it to someone else.

### 3. Assembly-focused UX (not full Inspector)

Patrick advocated for a **pared-down, assembly-focused UX** rather than exposing the full Inspector for authoring. The current Inspector has too many options — artists need a streamlined tool focused on:
- Assembling meshes, materials, textures, lights, cameras, animations
- Previewing the final scene
- Exporting to GLTF/GLB

This should be **no-code** — animation assignment, material configuration, and scene setup should be entirely UI-driven.

### 4. Persistent, shareable project file

Patrick emphasized the need for a project file that:
- Saves asset references, material assignments, parameter values, scene configuration (lights, cameras, ground)
- Can be reopened later
- Can be shared with teammates (e.g., "Corey sets it up, Steve opens it and tweaks, then exports")

This is what we've been calling the "authoring file." Patrick validated it as a core requirement.

### 5. Parameter-level overrides confirmed

Patrick confirmed that overrides should work at the property level — change a single material color, persist it, and have it survive reloads. Overrides should survive as long as the material structure is compatible.

### 6. Animation assembly is a major gap

Current limitations:
- Difficult to import animation-only files
- Hard to assign multiple animations to meshes
- Often requires manual coding
- No clean UX for animation group management

Desired state: drag-and-drop animation assignment, persistent animation configuration saved in the project format.

### 7. Compression should be integrated into export

Current state: Draco mesh compression is partially supported; Basis texture compression requires separate CLI tools.

Desired state: integrated export pipeline that handles both mesh and texture compression without CLI dependencies.

---

## New Goals / Requirements (Not in Current Plan)

| # | New requirement | Impact on current plan |
|---|----------------|----------------------|
| 1 | **Animation assembly UX** — drag-and-drop animation import and assignment to meshes | Not currently a milestone. Could be part of Assembly Tool (M2) or a new milestone. |
| 2 | **Assembly-focused UX** — a streamlined, pared-down Inspector experience for authoring (not the full Inspector) | Current plan builds panes within full Inspector. Patrick may want a more opinionated, simpler tool. Needs clarification: is this a separate app (like Sandbox) or a mode within Inspector? |
| 3 | **Scene-level settings in authoring file** — lights, cameras, ground, environment | Currently an open question in the decisions doc (#12). Patrick confirmed it's needed. |
| 4 | **Integrated compression in export** — Draco + Basis without CLI tools | Not in current Export/Bake milestone (M7). Could expand M7 scope or be a separate milestone. |
| 5 | **Collaboration flow** — save project, share with teammate, they open/tweak/export | Already supported by Save/Load (M3) + Assembly (M2), but the "teammate opens and tweaks" flow may need more thought around relative vs. absolute asset paths, portability. |

---

## Confirmed Alignment with Current Plan

| Current plan element | Patrick's position |
|---------------------|-------------------|
| Keyed loading / asset references | ✅ Aligned — assets should be referenced, not embedded |
| Overrides as diffs, not baked | ✅ Confirmed — "change a parameter, persist it" |
| Assembly tool in Inspector | ✅ Aligned, but wants it **streamlined** (not full Inspector) |
| Authoring file save/load | ✅ Core requirement — "project permanence" |
| Export to GLB | ✅ Needed — but wants compression integrated |
| Reload button (not auto-watch) | ✅ "Reloading is fine, going back to Maya is not" |

---

## Open Questions for David

1. **Assembly tool scope:** Is this a pane within Inspector, or a separate streamlined app (like a "Babylon Assembly" tool)? Patrick leans toward something simpler than full Inspector.
2. **Animation assembly:** Should animation import/assignment be a first-class feature in v1, or deferred?
3. **Compression integration:** How much export optimization (Draco, Basis) belongs in v1 vs. later?
4. **Scene settings in authoring file:** Confirmed needed by Patrick. Should we add cameras, lights, environment to the schema now?

---

## Action Items (Assigned to Georgina)

1. Inspector UX requirements — identify what works, what's clunky, what's impossible
2. Inspector persistence options — evaluate approaches
3. Animation assembly investigation — analyze limitations, propose solutions
4. Compression support assessment — Draco + Basis, remove CLI dependency
5. File format definition — persistent, shareable project format with parameter overrides
