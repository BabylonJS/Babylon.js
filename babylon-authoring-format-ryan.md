# Ryan Discussion — March 24, 2026

**Meeting:** Call with Ryan Tremblay · March 24, 2026 · ~11:23 AM · 37 minutes
**Participants:** Georgina Halpern, Ryan Tremblay

---

## Context

Ryan had notes from a prior discussion (~April 2025) with Patrick, Jason, and David about the same problem space. He shared that prior thinking, which has significant overlap but also some important differences from the current plan.

---

## Key Points

### 1. Prior art: "Smart Assets" concept from April 2025

Ryan, Patrick, Jason, and David discussed this problem ~a year ago. The concept was called **"smart assets"** or **"asset references."** Two approaches were considered:

- **Option A:** A formal asset reference type in code (an abstraction class)
- **Option B (preferred at the time):** A custom protocol — `asset://my-cool-glb` — that gets resolved through Babylon's existing `FileTools` infrastructure

The team leaned toward Option B because:
- No API changes needed anywhere — asset references are still just strings
- `FileTools` already handles all file loading; adding protocol resolution there is minimal change
- Any existing API that takes a URL string would automatically work with `asset://` references

### 2. `FileTools` as the integration point (not a new SmartLoader class)

Ryan's key architectural suggestion: instead of building a standalone `SmartLoader` class, **integrate smart asset resolution into `FileTools`**, which already handles virtually all file loading in Babylon.

> "File tools is a big class. Pretty much everything that gets loaded goes through this abstraction. We don't do low level fetch or XMLHttpRequest."

The flow would be:
1. Code references `asset://sodaCan` anywhere a URL is accepted
2. `FileTools` sees the `asset://` protocol
3. `FileTools` looks up `sodaCan` in an asset table (key → URL/file mapping)
4. `FileTools` resolves and loads the actual file

**This is a fundamentally different architecture than the current plan**, which has SmartLoader as a standalone class wrapping `LoadAssetContainerAsync`.

### 3. Playground integration was a key requirement (from David)

David's priority in the earlier discussion was that **Playground portability must be preserved**:
- You write code, save a snippet, send it to someone, they load it — everything works
- The asset table should be serialized with the Playground snippet (in the JSON payload)
- When someone opens a shared Playground that references assets they don't have locally, the system should **prompt the user** to pick the missing files

> "Could [FileTools] just prompt the user for it? We pop a dialogue and say, hey, I don't have this asset. Can you just point to it for me?"

This "prompt for missing assets" concept is not in the current plan.

### 4. Local file persistence with File System API

Ryan raised a technical detail about local file handling:
- The browser File System Access API lets you get a `FileSystemFileHandle`
- These handles can be persisted in `localStorage` or `IndexedDB`
- This means: pick a local file once → refresh the page → the mapping survives without re-picking

> "Once you pick a local file, how do you persist the permission to that local file? If you refresh the browser, everything should still work. You shouldn't have to go pick the files again."

This is a key UX requirement not in the current plan.

### 5. Overrides may not need to be coupled with the asset system

Ryan suggested that **overrides and asset mapping are two independent systems**:

> "It feels like that to me... if there's another JSON file that says the entity with this unique ID should have these properties overridden with these values, it seems like that could be done pretty much completely separately."

His reasoning: you could build an override/persistence system for Inspector changes **regardless of whether SmartLoader exists**. The systems are orthogonal. They could share a file, but they don't have to.

Georgina acknowledged this and said she'd go back to Patrick and David to clarify whether overrides are truly coupled to the smart asset system or are a separate requirement.

### 6. New format vs. extending `.babylon` vs. GLTF extensions

Ryan raised several format questions:

- **Hesitation about a new format:** "I feel like we already have a lot of formats. I'm not sure about introducing new file formats."
- **GLTF extensions:** Could we use GLTF's extension system + custom Babylon extensions instead of a separate `.babylon` format? "Could we just have GLTF with a bunch of custom Babylon extensions? And that's the Babylon format."
- **GLX:** Mentioned GLX as an emerging standard — "a higher level format for GLTF that does this kind of thing. It's more like a scene level thing where you can have references to lots of GLBs."
- **Pragmatic conclusion:** Acknowledged this is probably out of scope for now, but recommended keeping it in mind for design decisions: "If there's a design decision you can make that's more compatible with that future and otherwise equal, then make the design decision that way."

### 7. The asset table is simpler than what's in the current devdoc

Ryan's view of the asset mapping is essentially just:
```json
{
  "sodaCan": { "type": "url", "url": "https://example.com/soda.glb" },
  "table": { "type": "localAsset", "handle": "..." }
}
```

No provenance, no overrides — just ID → location. The provenance and override concepts felt separate to him.

---

## Impact on Current Plan

| Current plan element | Ryan's perspective |
|---------------------|-------------------|
| **SmartLoader as standalone class** | ⚠️ Prefers integrating into `FileTools` with `asset://` protocol — no new class needed for basic resolution |
| **`asset://` custom protocol** | ✅ New concept — any existing string-based URL API works without changes |
| **Authoring file with provenance + overrides** | ⚠️ Thinks the mapping should be much simpler (just key→URL). Provenance and overrides are separate systems. |
| **Override system coupled to SmartLoader** | ❌ Believes overrides are independent — could be a completely separate system |
| **New file format** | ⚠️ Hesitant — "we already have a lot of formats." Suggests considering GLTF extensions or GLX instead. |
| **Playground integration** | ✅ Core requirement from David — asset table serialized with snippet, prompt for missing assets |
| **Local file persistence** | ✅ New requirement — File System API handles persisted in localStorage/IndexedDB |
| **Assembly tool in Inspector** | Not discussed |
| **Scene Explorer** | Not discussed |
| **Export/Bake** | Not discussed |

---

## New Ideas Not in Current Plan

1. **`asset://` custom protocol** resolved through `FileTools` — avoids API changes, works everywhere strings are used for URLs
2. **Prompt for missing assets** — when a shared Playground references assets the recipient doesn't have, pop a file picker dialogue
3. **Local file handle persistence** — use File System API + localStorage/IndexedDB so local file mappings survive page refresh
4. **Playground snippet integration** — asset table serialized as part of the Playground JSON payload
5. **GLTF extensions / GLX** as a long-term alternative to the `.babylon` format (not actionable now, but a design consideration)

---

## Open Questions to Resolve with Patrick & David

1. **Are overrides truly coupled to the smart asset system, or are they independent?** Ryan thinks independent. Patrick's collaboration scenario ("send to Corey, he sees my changes") suggests coupled. Need to clarify.
2. **SmartLoader class vs. FileTools integration?** Two very different architectures. FileTools integration is less invasive but may not provide the scoping/provenance/disposal that the current plan needs.
3. **Is Playground integration a v1 requirement?** David apparently thought so in April 2025. Is that still the case?
4. **New format vs. GLTF extensions?** Ryan's preference leans toward not introducing new formats. Patrick needs persistent project files. These may be in tension.
5. **Does the asset mapping need provenance?** Ryan's model is flat (key→URL). Current plan has provenance (key→objects it created). Which is actually needed?

---

## Georgina's Takeaway (from the call)

> "I think it would be helpful for me to go back and chat with Patrick and David and go back to the 'what' of it all because if it's not a requirement to persist the overrides, then these can be considered separate things. And then that really simplifies what this file format is — is it really a whole new format or is it just a simple mapping between key, external URL, and type? And then the meat of the technical piece is the actual file handling and loading and protocol, and perhaps that's done via FileTools."
