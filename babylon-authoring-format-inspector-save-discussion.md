# Should Inspector Save Generalize Beyond SmartLoader?

## The Problem

The current SmartLoader plan creates an asymmetry:

- **SmartLoader scene:** Edit a material color in Inspector → saved as an override → persists across sessions ✅
- **Regular scene:** Edit a material color in Inspector → in-memory only → gone when you reload ❌

A user who loads a `.glb` in Sandbox, tweaks some properties, and expects to save their work will be disappointed — unless they happened to load it through SmartLoader. That's confusing.

## What Inspector Can Already Do Today

Inspector v2 already has export tools (buried in the Tools pane):

1. **Export to .babylon** — calls `SceneSerializer.Serialize(scene)` and downloads the JSON. This captures the *current* scene state, including any Inspector edits.
2. **Export to .glb** — calls `GLTF2Export.GLBAsync()` and downloads the binary. Same — captures current state.

So technically, "save your Inspector edits" already works for any scene — it's just a full re-export, not a diff. The problems are:
- It's buried (not a prominent "Save" button)
- It serializes *everything*, not just what you changed
- No undo
- No dirty state tracking ("you have unsaved changes")
- Sandbox has no save UI at all

## What SmartLoader Adds

SmartLoader's override system introduces a fundamentally different kind of save:

| | Full export (today) | SmartLoader overrides |
|---|---|---|
| **What's saved** | Entire scene state | Only the diffs |
| **File size** | Large (all geometry, materials, textures) | Small (just the overrides JSON) |
| **Source asset preserved?** | No — baked into output | Yes — links stay intact |
| **Can update source asset later?** | No — must re-export from DCC | Yes — overrides reapply on new version |
| **Tracks what changed?** | No | Yes — each override is explicit |

## Three Options

### Option A: SmartLoader-only overrides (current plan)

SmartLoader scenes get the override-based save. Regular scenes get nothing new — the existing "Export to .babylon" in the Tools pane is available but not prominent.

**Pros:**
- Smallest scope — no changes to Inspector core
- Override system is cleanly scoped to SmartLoader
- No risk of scope creep

**Cons:**
- Asymmetric UX — SmartLoader scenes can save edits, regular scenes can't (easily)
- Users who don't know about SmartLoader miss out
- The existing export is buried and non-obvious

### Option B: Generalize overrides to any scene object

Any scene (SmartLoader or not) can track Inspector edits as overrides. Loading a `.glb` and making edits auto-creates a single-key authoring file under the hood.

**Pros:**
- Consistent UX — every scene can save edits
- The authoring format becomes the universal "Inspector save" mechanism
- Opens the door to Sandbox as a lightweight scene editor

**Cons:**
- Significant scope increase — override tracking must work for ALL property types on ALL object types, not just SmartLoader-loaded objects
- Must handle scenes with mixed SmartLoader + non-SmartLoader objects
- "Auto-wrapping" a .glb in a SmartLoader may confuse users ("I loaded a .glb, why is it asking me to save a .bauthoring file?")
- Risk: this is basically building a scene editor, which is NOT the goal

### Option C: SmartLoader overrides + better UX for existing export (recommended?)

Keep SmartLoader overrides as-is (scoped to SmartLoader scenes). Separately, improve the non-SmartLoader experience by:

1. **Add a "Save" button to Sandbox** — prominently surfaces the existing export functionality
2. **Add dirty state tracking** — set a flag when `PropertyChangeInfo` fires, show "unsaved changes" indicator
3. **One-click re-export** — "Save as .babylon" or "Save as .glb" with last-used format remembered

This doesn't require override tracking for non-SmartLoader scenes — it just makes the existing full-export more accessible.

**Pros:**
- SmartLoader scenes get the full override experience (diffs, links, provenance)
- Regular scenes get a much better save UX (prominent button, dirty indicator) without needing override infrastructure
- Both paths are honest about what they do: SmartLoader saves diffs, regular export saves everything
- Minimal additional scope — the export functionality already exists, we're just surfacing it better
- Natural upgrade path: if a user wants override-style saves, they start using SmartLoader

**Cons:**
- Still two different "save" behaviors depending on context — but at least both work
- Regular scene export is a full re-serialize, which can be slow for large scenes

## What Would Need to Change for Each Option

### Option A (current plan) — no additional work
Nothing changes. SmartLoader overrides work for SmartLoader scenes. Regular scenes use existing export tools as-is.

### Option B (generalize) — significant work

| Work Item | Effort | Risk |
|-----------|--------|------|
| Override tracking for ALL object types (not just SmartLoader-loaded) | High | Property interception must work universally |
| Auto-wrap loaded scenes in SmartLoader | Medium | UX confusion, lifecycle management |
| Handle mixed SmartLoader + direct objects | High | Complex provenance tracking |
| Save format for non-linked overrides | Medium | What do overrides target when there's no key? |
| Undo/redo system (expected if "save" exists) | High | Command stack, serializable commands |
| Estimated additional scope | **~4-6 weeks** | Scope creep risk |

### Option C (better export UX) — moderate work

| Work Item | Effort | Risk |
|-----------|--------|------|
| Dirty state tracking via PropertyChangeInfo | 1-2 days | Low |
| "Save" button in Sandbox UI | 1 day | Low |
| "Unsaved changes" indicator | 0.5 days | Low |
| One-click re-export with format memory | 1 day | Low |
| Estimated additional scope | **~1 week** | Low risk |

## The Key Question

Is the SmartLoader authoring format intended to be:

**(a)** A specialized tool for scene composition workflows (linking multiple assets, overrides, assembly) — in which case Option A or C is fine

**(b)** The foundation for a general "Inspector as a scene editor" vision — in which case Option B is needed eventually, but could be deferred

This is a strategic question. Patrick's assembly tool vision is (a). But the natural UX evolution points toward (b). Option C lets us ship (a) now and move toward (b) later without painting ourselves into a corner.

## Recommendation

**Option C for v1.** Ship SmartLoader overrides (scoped to SmartLoader scenes) + improve the existing export UX for regular scenes. Evaluate whether to generalize (Option B) after v1 based on user feedback and team appetite.

The SmartLoader override infrastructure is designed in a way that COULD generalize later — the `PropertyChangeInfo` observable, the override schema, and the authoring file format don't have anything SmartLoader-specific baked in at the schema level. The door stays open.

## Who Should Weigh In

- **David** — strategic direction: is this a scene editor or a composition tool?
- **Ryan** — Inspector architecture: is Option B feasible without major refactoring?
- **Patrick** — user perspective: do artists need general save, or is SmartLoader-scoped save sufficient for their workflows?
