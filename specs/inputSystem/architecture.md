# Input System — Architecture

## Executive Summary

This document describes the architecture for extending the declarative input mapping
system (`inputMap` + `resolveInteraction()` + `handlers`) to FreeCamera, polishing the
existing ArcRotateCamera and GeospatialCamera implementations, and adding comprehensive
test coverage.

### Before / After Comparison

| Aspect | Before | After |
|--------|--------|-------|
| FreeCamera input logic | Hardcoded in each input class; writes directly to `cameraDirection`/`cameraRotation` | Input classes call `resolveInteraction()` and typed `handlers` when movement is available |
| FreeCamera inertia model | `TargetCamera._checkInputs()` applies per-frame `scaleInPlace(this.inertia)` on `cameraDirection`/`cameraRotation` — not framerate-independent | `FreeCameraMovement.computeCurrentFrameDeltas()` produces framerate-independent deltas with configurable per-axis inertia |
| FreeCamera speed model | `_computeLocalCameraSpeed()` mixes `speed`, `deltaTime`, and `fps` | Speed/inertia separated cleanly in movement class; `_computeLocalCameraSpeed()` used only in legacy path |
| ArcRotateCamera movement creation | `movement` property exists but is never instantiated automatically | Opt-in flag creates `ArcRotateCameraMovement` on demand |
| ArcRotateCamera input remapping | Change `_useCtrlForPanning`, `_panningMouseButton` flags | Reassign `camera.movement.inputMap` array |
| Input configuration | Scattered boolean flags per input class | Single declarative `inputMap` array on movement class |
| Legacy flag support | Flags are the only mechanism | Flags deprecated; internally modify `inputMap` when movement is enabled |
| `resetInputMap()` | Does not exist | Each `CameraMovement` subclass provides `resetInputMap()` |
| Test coverage for movement system | None | Unit tests for `resolveInteraction`, `computeCurrentFrameDeltas`, default maps, backward compat shims |

---

## Current Architecture Overview

### Camera Class Hierarchy

```
Camera
├── TargetCamera
│   ├── FreeCamera            ← speed, inertia, cameraDirection/cameraRotation
│   │   └── UniversalCamera   ← adds gamepad
│   └── ...
├── ArcRotateCamera           ← alpha/beta/radius, inertial*Offset, optional movement
└── GeospatialCamera          ← center/yaw/pitch/radius, always has movement
```

### Current Input Pipeline (ArcRotateCamera with movement)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Per-frame cycle                                                     │
│                                                                     │
│  ArcRotateCamera._checkInputs()                                    │
│   │                                                                 │
│   ├─► inputs.checkInputs()                                         │
│   │    │                                                            │
│   │    ├─► PointersInput.onTouch()                                  │
│   │    │    if (camera.movement)                                    │
│   │    │      → resolveInteraction("pointer", {button})             │
│   │    │      → movement.handlers.pan(dx, dy)                       │
│   │    │        OR movement.handlers.rotate(dx, dy)                 │
│   │    │    else                                                    │
│   │    │      → camera.inertialAlphaOffset += ...  (legacy)         │
│   │    │                                                            │
│   │    ├─► KeyboardInput.checkInputs()                              │
│   │    │    if (camera.movement)                                    │
│   │    │      → resolveInteraction("keyboard", {modifiers})         │
│   │    │      → movement.handlers.<interaction>(...)                │
│   │    │    else                                                    │
│   │    │      → camera.inertialAlphaOffset += ...  (legacy)         │
│   │    │                                                            │
│   │    └─► WheelInput.handler()                                     │
│   │         if (camera.movement)                                    │
│   │           → movement.handlers.zoom(delta)                       │
│   │         else                                                    │
│   │           → camera.inertialRadiusOffset += ...  (legacy)        │
│   │                                                                 │
│   ├─► Apply inertial*Offset values (legacy path only)              │
│   │    alpha += inertialAlphaOffset; inertialAlphaOffset *= inertia │
│   │    ... (NOT framerate-independent)                               │
│   │                                                                 │
│   └─► _checkLimits(), super._checkInputs()                         │
└─────────────────────────────────────────────────────────────────────┘
```

**Key observation**: ArcRotateCamera's movement system is incomplete. The input classes
write to `movement.handlers.*` which accumulate into `panAccumulatedPixels` etc., but
`_checkInputs()` never calls `computeCurrentFrameDeltas()` and never reads
`panDeltaCurrentFrame`. The movement system is wired for input mapping and handler
dispatch only — the actual camera state updates still flow through the legacy
`inertial*Offset` path.

### Current Input Pipeline (GeospatialCamera — fully wired)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Per-frame cycle                                                     │
│                                                                     │
│  GeospatialCamera._checkInputs()                                   │
│   │                                                                 │
│   ├─► inputs.checkInputs()                                         │
│   │    │                                                            │
│   │    ├─► PointersInput                                            │
│   │    │    → movement.resolveInteraction("pointer", {button})      │
│   │    │    → movement.handlers.pan.start/update/stop(...)          │
│   │    │      OR movement.handlers.rotate(dx, dy)                   │
│   │    │                                                            │
│   │    ├─► KeyboardInput                                            │
│   │    │    → movement.resolveInteraction("keyboard", {modifiers})  │
│   │    │    → movement.handlers.<interaction>(...)                  │
│   │    │                                                            │
│   │    └─► WheelInput                                               │
│   │         → movement.handlers.zoom(delta, toCursor)               │
│   │                                                                 │
│   ├─► movement.computeCurrentFrameDeltas()                         │
│   │    ├─ Reads panAccumulatedPixels, rotationAccumulatedPixels,    │
│   │    │  zoomAccumulatedPixels                                     │
│   │    ├─ Applies speed, inertia, framerate-independence            │
│   │    └─ Writes panDeltaCurrentFrame, rotationDeltaCurrentFrame,  │
│   │       zoomDeltaCurrentFrame                                     │
│   │                                                                 │
│   ├─► Apply deltas to camera state                                  │
│   │    panDeltaCurrentFrame → _applyGeocentricTranslation()        │
│   │    rotationDeltaCurrentFrame → _applyGeocentricRotation()      │
│   │    zoomDeltaCurrentFrame → _applyZoom()                        │
│   │                                                                 │
│   └─► super._checkInputs()                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Current FreeCamera Input Pipeline (no movement system)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Per-frame cycle                                                     │
│                                                                     │
│  FreeCamera._checkInputs()                                         │
│   │                                                                 │
│   ├─► inputs.checkInputs()                                         │
│   │    │                                                            │
│   │    ├─► FreeCameraMouseInput                                     │
│   │    │    Writes directly to camera.cameraRotation.x/y            │
│   │    │    (divides by angularSensibility)                          │
│   │    │                                                            │
│   │    ├─► FreeCameraKeyboardMoveInput.checkInputs()                │
│   │    │    Calls camera._computeLocalCameraSpeed()                 │
│   │    │    Writes to camera._localDirection → transforms →         │
│   │    │    camera.cameraDirection.addInPlace(...)                   │
│   │    │    OR writes to camera.cameraRotation (rotate keys)        │
│   │    │                                                            │
│   │    ├─► FreeCameraTouchInput.checkInputs()                       │
│   │    │    Writes to camera.cameraRotation.y (always)              │
│   │    │    Writes to camera.cameraRotation.x (multi-touch)         │
│   │    │    OR camera.cameraDirection (single-touch forward)        │
│   │    │                                                            │
│   │    └─► FreeCameraMouseWheelInput.checkInputs()                  │
│   │         Writes to camera.cameraDirection / cameraRotation       │
│   │                                                                 │
│   └─► TargetCamera._checkInputs()                                  │
│        ├─ Apply cameraDirection → _updatePosition()                 │
│        ├─ Apply cameraRotation → rotation / rotationQuaternion      │
│        ├─ Inertia: cameraDirection.scaleInPlace(this.inertia)       │
│        │           cameraRotation.scaleInPlace(this.inertia)        │
│        └─ (NOT framerate-independent)                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Architectural Changes

### Target Architecture (all three cameras)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Camera._checkInputs()                                              │
│   │                                                                 │
│   ├─► inputs.checkInputs()                                         │
│   │    Each input class:                                            │
│   │      if (camera.movement)                                       │
│   │        → movement.resolveInteraction(source, conditions)        │
│   │        → movement.handlers.<interaction>(...)                   │
│   │          (handlers accumulate into movement accumulators)        │
│   │      else                                                       │
│   │        → legacy direct write to camera properties               │
│   │                                                                 │
│   ├─► if (camera.movement)                                          │
│   │      movement.computeCurrentFrameDeltas()                       │
│   │      → produces framerate-independent deltas                    │
│   │      Camera reads deltas and applies to its state               │
│   │                                                                 │
│   ├─► else (legacy path — unchanged)                                │
│   │      Apply inertial offsets / cameraDirection+cameraRotation    │
│   │                                                                 │
│   └─► _checkLimits(), super._checkInputs()                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                        CameraMovement (base)                     │
│  ┌──────────────┐  ┌───────────────────────┐  ┌──────────────┐  │
│  │ inputMap[]   │  │ resolveInteraction()  │  │ accumulators │  │
│  │              │──►│ source + conditions   │  │ pan/rot/zoom │  │
│  │ InputMap-    │  │ → interaction string  │  │ Accumulated  │  │
│  │ Entry[]     │  └───────────────────────┘  │ Pixels       │  │
│  └──────────────┘                             └──────┬───────┘  │
│                                                       │          │
│  ┌───────────────────────────────────────────────────┐│          │
│  │ computeCurrentFrameDeltas()                       ││          │
│  │  speed × velocity × deltaTime → current frame     │◄─────────│
│  │  deltas (framerate-independent with inertia)      ││          │
│  └───────────────────────────────┬───────────────────┘│          │
│                                  │                     │          │
│  ┌───────────────────────────────▼───────────────────┐│          │
│  │ panDeltaCurrentFrame / rotationDeltaCurrentFrame  ││          │
│  │ zoomDeltaCurrentFrame                              ││          │
│  └───────────────────────────────────────────────────┘│          │
│                                                        │          │
│  ┌──────────────────┐                                  │          │
│  │ resetInputMap()  │  restores camera-type defaults   │          │
│  └──────────────────┘                                  │          │
└─────────────────────────────────────────────────────────┘
         ▲                    ▲                    ▲
         │                    │                    │
┌────────┴───────┐  ┌────────┴───────┐  ┌─────────┴──────┐
│ ArcRotate-     │  │ Geospatial-    │  │ FreeCamera-    │
│ CameraMovement │  │ CameraMovement │  │ Movement       │
│                │  │                │  │                │
│ handlers:      │  │ handlers:      │  │ handlers:      │
│  pan(dx,dy)    │  │  pan{start,    │  │  translate(    │
│  rotate(dx,dy) │  │    update,stop}│  │    dx,dy,dz)  │
│  zoom(d)       │  │  rotate(dx,dy) │  │  rotate(dx,dy)│
│                │  │  zoom(d,cursor)│  │                │
│ inputMap:      │  │                │  │ inputMap:      │
│  LMB→rotate    │  │ inputMap:      │  │  LMB→rotate   │
│  RMB→pan       │  │  LMB→pan      │  │  keys→translate│
│  wheel→zoom    │  │  MMB/RMB→rot  │  │  wheel→transl. │
│  ctrl+kb→pan   │  │  wheel→zoom   │  │  touch→rotate  │
│  kb→rotate     │  │  ctrl+kb→rot  │  │                │
│                │  │  kb→pan       │  │                │
└────────────────┘  └────────────────┘  └────────────────┘
```

---

## Component Deep Dives

### 1. CameraMovement Base Class Generalization (REQ-MOV-4)

**Problem**: The current accumulators (`panAccumulatedPixels`, `rotationAccumulatedPixels`,
`zoomAccumulatedPixels`) and speed properties (`panSpeed`, `rotationXSpeed`, etc.) are
named with orbit-camera semantics. FreeCamera uses a translate+rotate model, not
pan/rotate/zoom.

**Decision**: Keep the existing accumulator names and semantics in the base class.

**Rationale**: The three-axis accumulator pattern (pan=translation, rotation=rotation,
zoom=scalar) is general enough for both paradigms:

| Base class concept | ArcRotateCamera meaning | FreeCamera meaning |
|-------------------|------------------------|-------------------|
| `panAccumulatedPixels` | Pan target (screen-relative) | Translate camera position |
| `rotationAccumulatedPixels` | Orbit around target (alpha/beta) | Rotate camera orientation (yaw/pitch) |
| `zoomAccumulatedPixels` | Change radius | Translate forward/back (or unused) |
| `panSpeed` | Pan sensitivity | Translation sensitivity |
| `rotationXSpeed` / `rotationYSpeed` | Orbit sensitivity | Look sensitivity |
| `zoomSpeed` | Radius change sensitivity | Forward translate sensitivity |

The names "pan" and "zoom" are slightly misleading for FreeCamera, but renaming would
break the existing GeospatialCamera and ArcRotateCamera integrations. The doc comments
on the base class will note that "pan" means "primary translational input" and "zoom"
means "secondary scalar input" in the abstract sense.

**Alternatives considered**:
- *Rename accumulators to generic names (primaryDelta, secondaryDelta, scalarDelta)*:
  Rejected because it would be a breaking change for GeospatialCameraMovement which is
  already shipping, and the generic names are less readable.
- *Let subclasses define their own accumulators*: Rejected because
  `computeCurrentFrameDeltas()` operates on the accumulators directly and would need to
  be overridden entirely, defeating the purpose of the base class.

### 2. FreeCameraMovement Class (REQ-FREE-1, REQ-FREE-2, REQ-FREE-5)

`FreeCameraMovement` extends `CameraMovement` and defines:

**Interaction types**: `"translate"` and `"rotate"` (REQ-FREE-2).

**Handler types**:

```
FreeCameraHandlers = {
    translate: (dx: number, dy: number, dz: number) => void
    rotate:    (dx: number, dy: number) => void
}
```

Both handlers are plain functions (no lifecycle needed, unlike GeospatialCamera's pan
handler). The `translate` handler accepts three axes (left/right, up/down, forward/back)
to support keyboard movement in all directions. The `rotate` handler accepts yaw and
pitch deltas.

**Default handlers**: Accumulate into the base class accumulators:

```
translate handler:
  panAccumulatedPixels.x += dx   (strafe left/right)
  panAccumulatedPixels.y += dy   (up/down)
  panAccumulatedPixels.z += dz   (forward/back)

rotate handler:
  rotationAccumulatedPixels.x += dx   (yaw)
  rotationAccumulatedPixels.y += dy   (pitch)
```

**Default inputMap** (reproduces current FreeCamera behavior — REQ-FREE-3):

```
[
  { source: "pointer", button: 0,  interaction: "rotate" },
  { source: "pointer", button: 1,  interaction: "rotate" },
  { source: "pointer", button: 2,  interaction: "rotate" },
  { source: "wheel",               interaction: "translate" },
  { source: "keyboard",            interaction: "translate" },
  { source: "touch",               interaction: "rotate" },
]
```

Note: The current FreeCamera mouse input rotates on any button (buttons array `[0,1,2]`),
the keyboard always translates, wheel translates (forward/back by default), and touch
rotates with single-finger. This default map reproduces those semantics exactly.

**Speed/inertia defaults**: `FreeCameraMovement` will set defaults that reproduce the
current FreeCamera feel. The current `camera.speed` property on TargetCamera and
`_computeLocalCameraSpeed()` are used only in the legacy path. When the movement system
is enabled, `panSpeed` and `rotationXSpeed`/`rotationYSpeed` on the movement class
control sensitivity, and `panInertia`/`rotationInertia` control decay.

### 3. Opt-in Activation Mechanism (REQ-MOV-1, REQ-MOV-2)

**Decision**: A boolean flag `useMovementSystem` on each camera triggers creation of the
appropriate `CameraMovement` subclass.

**Mechanism for ArcRotateCamera**:

ArcRotateCamera already has `public movement?: ArcRotateCameraMovement`. Currently it is
never auto-created. A new `useMovementSystem` getter/setter will be added:

```
get useMovementSystem(): boolean
set useMovementSystem(value: boolean)
```

When set to `true`, the setter creates `new ArcRotateCameraMovement(...)` and assigns it
to `this.movement`. When set to `false`, the setter sets `this.movement = undefined`.
The property defaults to `false`.

**Mechanism for FreeCamera**:

A new `public movement?: FreeCameraMovement` property and corresponding
`useMovementSystem` getter/setter. Same pattern as ArcRotateCamera.

**Mechanism for GeospatialCamera**:

GeospatialCamera already creates its movement class unconditionally in the constructor.
This is correct — GeospatialCamera has no legacy path, so the movement system is always
active. No `useMovementSystem` flag is needed.

**Why a flag instead of just assigning `movement` directly**: The flag provides a clean
one-line opt-in (`camera.useMovementSystem = true`) and ensures the movement class is
constructed with the correct parameters derived from the camera's current state. Users
can still assign `camera.movement` directly for advanced scenarios.

**How `_checkInputs` branches** (REQ-MOV-2):

ArcRotateCamera's `_checkInputs()` will be modified to check `this.movement`:

```
_checkInputs():
  inputs.checkInputs()

  if (this.movement)
    movement.computeCurrentFrameDeltas()
    apply panDeltaCurrentFrame to target
    apply rotationDeltaCurrentFrame to alpha/beta
    apply zoomDeltaCurrentFrame to radius
  else
    // existing inertial offset logic (unchanged)
    alpha += inertialAlphaOffset * ...
    ...

  _checkLimits()
  super._checkInputs()
```

FreeCamera's `_checkInputs()` will similarly branch:

```
_checkInputs():
  inputs.checkInputs()

  if (this.movement)
    movement.computeCurrentFrameDeltas()
    apply panDeltaCurrentFrame → cameraDirection
    apply rotationDeltaCurrentFrame → cameraRotation
    // Then fall through to super._checkInputs() which
    // handles position update and rotation application.
    // But skip TargetCamera's inertia decay since movement
    // class already handles inertia.
  else
    // Fall through to super._checkInputs() as today

  super._checkInputs()
```

**Skipping TargetCamera inertia in movement mode**: When the movement system is enabled,
`computeCurrentFrameDeltas()` handles inertia. TargetCamera's `_checkInputs()` also
applies inertia via `cameraDirection.scaleInPlace(this.inertia)` and
`cameraRotation.scaleInPlace(this.inertia)`. To avoid double-inertia, FreeCamera will
set `cameraDirection` and `cameraRotation` from the movement deltas each frame (they are
single-frame deltas, not cumulative), and TargetCamera's epsilon checks + inertia decay
will operate on values that are already near-zero (since the movement class resets
accumulators each frame). This means the legacy inertia path effectively becomes a no-op
when movement is active, without requiring changes to TargetCamera.

### 4. Input Class Branching Pattern (REQ-FREE-4)

Each FreeCamera input class will follow the same branching pattern already established
in ArcRotateCamera inputs:

```
FreeCameraMouseInput (event-driven, not per-frame):

  onPointerDown:
    if (camera.movement)
      activeType = movement.resolveInteraction("pointer", {button})
    else
      // existing logic (set previousPosition, etc.)

  onPointerMove:
    if (camera.movement && activeType === "rotate")
      movement.handlers.rotate(offsetX / sensibility, offsetY / sensibility)
    else
      // existing logic (camera.cameraRotation += ...)

  onPointerUp:
    // clear state (same for both paths)
```

```
FreeCameraKeyboardMoveInput (per-frame checkInputs):

  checkInputs():
    if (camera.movement)
      // Cache conditions object (no allocations — REQ-MOV-5)
      interaction = movement.resolveInteraction("keyboard", cachedConditions)
      if (interaction === "translate")
        for each pressed key: movement.handlers.translate(dx, dy, dz)
      else if (interaction === "rotate")
        for each pressed key: movement.handlers.rotate(dx, dy)
    else
      // existing logic (camera._computeLocalCameraSpeed(), etc.)
```

```
FreeCameraTouchInput (per-frame checkInputs):

  checkInputs():
    if (camera.movement)
      // Touch always maps to rotate in default map
      movement.handlers.rotate(offsetX / sensitivity, offsetY / sensitivity)
    else
      // existing logic
```

```
FreeCameraMouseWheelInput (per-frame checkInputs):

  checkInputs():
    if (camera.movement)
      interaction = movement.resolveInteraction("wheel", cachedConditions)
      if (interaction === "translate")
        movement.handlers.translate(wheelX, 0, wheelY)
      else if (interaction === "rotate")
        movement.handlers.rotate(wheelX, wheelY)
    else
      // existing logic (complex axis-configurable system)
```

**In-progress interaction preservation (REQ-MAP-3)**: For event-driven inputs (pointer,
touch), the interaction type is resolved at `onButtonDown` / `onPointerDown` and stored
in `_activeType`. Subsequent `onTouch` / `onPointerMove` calls use the stored
`_activeType`. This means changing `inputMap` mid-drag does not affect the current
gesture — only new gestures pick up the new map. This pattern already works correctly in
ArcRotateCamera and GeospatialCamera inputs.

For per-frame inputs (keyboard, wheel), `resolveInteraction` is called every frame in
`checkInputs()`. Changing `inputMap` takes effect on the next frame. This is acceptable
because keyboard and wheel inputs are not "gestures" with start/end lifecycle.

### 5. Deprecated Flag Mapping (REQ-COMPAT-2)

When the movement system is enabled on ArcRotateCamera, legacy flags map to `inputMap`
modifications:

**`_useCtrlForPanning` (from `attachControl`)**:

When `true` (default), the default inputMap already has
`{ source: "keyboard", modifiers: { ctrl: true }, interaction: "pan" }`. No change
needed.

When `false`, the `useMovementSystem` setter removes the ctrl+keyboard→pan entry from
the inputMap so keyboard always maps to rotate.

**`_panningMouseButton`**:

The default inputMap has `{ source: "pointer", button: 2, interaction: "pan" }`. If
`_panningMouseButton` is set to a value other than 2, the `useMovementSystem` setter
modifies the pointer→pan entry's `button` field to match.

**`useAltToZoom` (on ArcRotateCameraKeyboardMoveInput)**:

The default inputMap has `{ source: "keyboard", modifiers: { alt: true }, interaction: "zoom" }`.
If `useAltToZoom` is `false`, the keyboard→zoom entry is removed when the movement
system is enabled.

**Implementation approach**: The deprecated flags are applied once when `useMovementSystem`
is set to `true`. If a user sets a deprecated flag AFTER enabling the movement system, a
`@deprecated` console warning is emitted and the inputMap is re-derived. The flag
setters call a private `_syncLegacyFlagsToInputMap()` method that rebuilds the relevant
inputMap entries.

**Alternatives considered**:
- *Live getter that computes inputMap from flags*: Rejected because it would prevent
  users from customizing the inputMap directly (their changes would be overwritten).
- *Intercepting flag changes via property descriptors*: Rejected as overly complex.
  The chosen approach (re-derive on flag change with warning) is simple and sufficient.

### 6. resetInputMap (REQ-MAP-4)

Each `CameraMovement` subclass implements `resetInputMap()` as a public method that
restores the `inputMap` to the hardcoded default for that camera type.

**Implementation**: Each subclass stores its defaults as a static method or inline
construction (same code that runs in the constructor). `resetInputMap()` simply
re-executes that initialization.

For ArcRotateCamera, `resetInputMap()` also re-applies legacy flag mappings (if the
deprecated flags have non-default values) via `_syncLegacyFlagsToInputMap()` on the
camera.

### 7. ArcRotateCamera Movement Integration (REQ-ARC-1, REQ-ARC-3)

**Current state**: ArcRotateCamera's input classes already branch on `camera.movement`
for handler dispatch and `resolveInteraction`, but `_checkInputs()` never calls
`computeCurrentFrameDeltas()`. The movement class accumulators are populated but never
consumed for framerate-independent output.

**Change**: Modify `ArcRotateCamera._checkInputs()` to call
`movement.computeCurrentFrameDeltas()` when movement is available, and read the
resulting deltas instead of processing `inertialAlphaOffset` etc.

The `panDeltaCurrentFrame`, `rotationDeltaCurrentFrame`, and `zoomDeltaCurrentFrame`
will map to ArcRotateCamera state as follows:

```
rotationDeltaCurrentFrame.x → alpha adjustment (with direction/handedness)
rotationDeltaCurrentFrame.y → beta adjustment (with direction modifier)
zoomDeltaCurrentFrame       → radius adjustment
panDeltaCurrentFrame.x/y    → target panning (transformed through view matrix)
```

The existing legacy path (lines 1050–1127 of arcRotateCamera.ts) remains untouched
inside an `else` branch, preserving behavior when movement is not enabled.

**Consistency with GeospatialCamera (REQ-ARC-1)**: After this change, both
ArcRotateCamera and GeospatialCamera will follow the same pattern:
1. `inputs.checkInputs()` — dispatches to handlers via `resolveInteraction`
2. `movement.computeCurrentFrameDeltas()` — converts accumulators to deltas
3. Camera reads deltas and applies them to its state

### 8. Serialization (REQ-SER-1, REQ-SER-2)

**inputMap serialization**:

The `inputMap` is a plain array of objects with string and number fields. It serializes
naturally to JSON:

```json
{
  "movement": {
    "inputMap": [
      { "source": "pointer", "button": 0, "interaction": "rotate" },
      { "source": "pointer", "button": 2, "interaction": "pan" },
      { "source": "wheel", "interaction": "zoom" },
      { "source": "keyboard", "modifiers": { "ctrl": true }, "interaction": "pan" },
      { "source": "keyboard", "interaction": "rotate" }
    ]
  }
}
```

The camera's `serialize()` method will include the inputMap when movement is enabled.
The camera's `Parse()` method will restore the inputMap if present.

**Speed/inertia serialization**: The speed and inertia properties on the movement class
are simple numbers and will be serialized alongside the inputMap.

**Handler serialization (REQ-SER-2)**: Custom handler functions cannot be serialized.
The serialized format will not include handlers. On parse, the movement class will be
created with default handlers. This is documented as expected behavior — users who
assign custom handlers must re-assign them after deserialization.

**useMovementSystem flag**: Serialized as a boolean on the camera. On parse, if `true`,
the movement class is created, and then the inputMap is restored from the serialized
data if present.

### 9. GeospatialCamera Polish (REQ-GEO-1, REQ-GEO-3)

GeospatialCamera's implementation is already the most complete reference. Polish items:

1. **Add `resetInputMap()`** — currently missing from `GeospatialCameraMovement`.
2. **Ensure handler types match the established pattern** — already consistent.
3. **Verify `resolveInteraction` usage** — Geospatial inputs always use movement (no
   legacy branch needed since GeospatialCamera is new and has no legacy API to preserve).

No structural changes are needed to GeospatialCameraMovement.

---

## Data Model Changes

### New Types

**`FreeCameraHandlers`** — Handler type for FreeCamera interactions:

```
type FreeCameraHandlers = {
    translate: (dx: number, dy: number, dz: number) => void
    rotate:    (dx: number, dy: number) => void
}
```

**`FreeCameraInteraction`** — String union derived from handler keys:
`"translate" | "rotate"`

### Modified Types

**`CameraMovement`** (base class) — Add:
- `resetInputMap(): void` — abstract or default no-op, overridden by each subclass.

**`ArcRotateCamera`** — Add:
- `useMovementSystem: boolean` getter/setter (default `false`)
- Modify `_checkInputs()` to branch on `this.movement`
- Modify `serialize()` and static `Parse()` to handle movement state

**`FreeCamera`** — Add:
- `movement?: FreeCameraMovement` property
- `useMovementSystem: boolean` getter/setter (default `false`)
- Modify `_checkInputs()` to branch on `this.movement`
- Modify `serialize()` and static `Parse()` to handle movement state

### Existing Types — No Changes

- `InputSource`, `InputModifiers`, `InputMapEntry`, `InputConditions` — already correct.
- `ArcRotateHandlers`, `ArcRotateInteraction` — already correct.
- `GeospatialHandlers`, `GeospatialInteraction` — already correct.
- `CameraInputsManager`, `ICameraInput` — unchanged.
- `BaseCameraPointersInput`, `OrbitCameraPointersInput` — unchanged.

---

## Migration Strategy

### Phase 1: Base Class + ArcRotateCamera Integration

1. Add `resetInputMap()` to `CameraMovement` base class.
2. Implement `resetInputMap()` in `ArcRotateCameraMovement` and
   `GeospatialCameraMovement`.
3. Add `useMovementSystem` flag to `ArcRotateCamera` with movement class creation.
4. Wire `computeCurrentFrameDeltas()` into `ArcRotateCamera._checkInputs()`.
5. Add deprecated flag shim logic (`_syncLegacyFlagsToInputMap`).
6. Add serialization support for ArcRotateCamera movement state.
7. Add unit tests for `resolveInteraction`, `computeCurrentFrameDeltas`,
   ArcRotateCamera default behavior preservation.

### Phase 2: FreeCameraMovement

1. Create `FreeCameraMovement` class extending `CameraMovement`.
2. Add `movement` property and `useMovementSystem` flag to `FreeCamera`.
3. Wire `computeCurrentFrameDeltas()` into `FreeCamera._checkInputs()`.
4. Refactor `FreeCameraMouseInput` with movement branching.
5. Refactor `FreeCameraKeyboardMoveInput` with movement branching.
6. Refactor `FreeCameraTouchInput` with movement branching.
7. Refactor `FreeCameraMouseWheelInput` with movement branching.
8. Add serialization support for FreeCamera movement state.
9. Add unit tests for FreeCameraMovement defaults and behavior preservation.

### Phase 3: Polish + Comprehensive Tests

1. Review GeospatialCameraMovement for consistency, add `resetInputMap()`.
2. Backward compatibility tests for deprecated flag shims.
3. InputMap mutation tests (in-progress interaction preservation).
4. Edge case tests (empty inputMap, no matching entry, modifier combinations).

---

## Code Removal Plan

No code is removed. All changes are additive. Legacy code paths are preserved behind
`if (!this.movement)` branches. Deprecated flags continue to function.

In a future major version, the legacy inertia system in ArcRotateCamera (`inertialAlphaOffset`,
`inertialBetaOffset`, etc.) and TargetCamera (`cameraDirection`/`cameraRotation` inertia
scaling) could be considered for removal, but that is out of scope.

---

## Files to Modify / Create / Delete

### Files to Create

| File | Purpose |
|------|---------|
| `packages/dev/core/src/Cameras/freeCameraMovement.ts` | `FreeCameraMovement` class, `FreeCameraHandlers` type, `FreeCameraInteraction` type |
| `packages/dev/core/test/unit/Cameras/freeCameraMovement.test.ts` | Unit tests for `FreeCameraMovement` |
| `packages/dev/core/test/unit/Cameras/cameraMovement.test.ts` | Unit tests for base `CameraMovement` (`resolveInteraction`, `computeCurrentFrameDeltas`) |
| `packages/dev/core/test/unit/Cameras/arcRotateCameraMovement.test.ts` | Unit tests for `ArcRotateCameraMovement` default map and behavior |
| `packages/dev/core/test/unit/Cameras/inputMapBackcompat.test.ts` | Unit tests for deprecated flag → inputMap shim logic |

### Files to Modify

| File | Changes |
|------|---------|
| `packages/dev/core/src/Cameras/cameraMovement.ts` | Add `resetInputMap()` method |
| `packages/dev/core/src/Cameras/arcRotateCameraMovement.ts` | Add `resetInputMap()` implementation |
| `packages/dev/core/src/Cameras/geospatialCameraMovement.ts` | Add `resetInputMap()` implementation |
| `packages/dev/core/src/Cameras/arcRotateCamera.ts` | Add `useMovementSystem` flag; modify `_checkInputs()` to call `computeCurrentFrameDeltas()` and read deltas when movement is enabled; add legacy flag sync; update serialization |
| `packages/dev/core/src/Cameras/freeCamera.ts` | Add `movement` property, `useMovementSystem` flag; modify `_checkInputs()` to branch on movement |
| `packages/dev/core/src/Cameras/Inputs/freeCameraMouseInput.ts` | Add movement branching in pointer event handlers |
| `packages/dev/core/src/Cameras/Inputs/freeCameraKeyboardMoveInput.ts` | Add movement branching in `checkInputs()` with cached conditions |
| `packages/dev/core/src/Cameras/Inputs/freeCameraTouchInput.ts` | Add movement branching in `checkInputs()` |
| `packages/dev/core/src/Cameras/Inputs/freeCameraMouseWheelInput.ts` | Add movement branching in `checkInputs()` |

### Files to Delete

None.

---

## Testing Strategy Overview

### Unit Tests (Vitest)

All tests live under `packages/dev/core/test/unit/Cameras/`.

**`cameraMovement.test.ts`** — Tests for base class (REQ-TEST-1, REQ-TEST-2):
- `resolveInteraction()`: source matching, first-match-wins, modifier matching (exact,
  partial, absent), button matching, touchCount matching, return "none" when no match,
  empty inputMap.
- `computeCurrentFrameDeltas()`: framerate independence (same accumulated pixels produce
  proportionally scaled deltas regardless of deltaTime), inertia decay (velocity decays
  when activeInput is false), accumulator reset after computation, zero-delta passthrough,
  speed multiplier application.

**`arcRotateCameraMovement.test.ts`** — Tests for ArcRotateCamera specifics (REQ-TEST-3):
- Default inputMap produces expected interactions for representative inputs.
- Default handlers accumulate correctly into base class accumulators.
- `resetInputMap()` restores defaults.

**`freeCameraMovement.test.ts`** — Tests for FreeCamera specifics (REQ-TEST-3):
- Default inputMap reproduces current FreeCamera input behavior.
- Translate handler accumulates dx/dy/dz correctly.
- Rotate handler accumulates yaw/pitch correctly.
- `resetInputMap()` restores defaults.

**`inputMapBackcompat.test.ts`** — Tests for deprecated flag shims (REQ-TEST-4):
- Setting `_useCtrlForPanning = false` then enabling movement → no ctrl+keyboard→pan entry.
- Setting `_panningMouseButton = 1` then enabling movement → pointer→pan entry has button=1.
- Setting deprecated flags after enabling movement → inputMap updated with warning.

**InputMap mutation tests (REQ-TEST-5)**: Included in the movement test files:
- Changing inputMap during a pointer drag does not affect the in-progress interaction.
- Changing inputMap between frames affects the next keyboard `checkInputs()` call.

### Integration / Visualization Tests

No new visualization tests are needed for this feature — it is an internal input
architecture change with no visual output differences. The existing visualization tests
serve as regression guards to ensure camera behavior is preserved.

### What Is NOT Tested

- Exotic input sources (gamepad, VR) — out of scope.
- FollowCamera, FlyCamera — out of scope.
- Inspector UI for inputMap — out of scope.
- Custom handler assignment — tested only at the type level (TypeScript enforces
  correct signatures); runtime assignment is trivial property assignment.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Framerate-independent deltas produce noticeably different feel from legacy inertia | Users report "camera feels different" | Tune default speed/inertia values to closely match legacy feel; default to movement off |
| ArcRotateCamera `_checkInputs` is complex (240 lines); adding movement branch increases complexity | Maintenance burden | Movement branch is clean conditional at top; legacy code remains untouched |
| FreeCameraMouseWheelInput has complex axis-configurable system that doesn't map cleanly to translate/rotate | Incomplete migration of wheel behavior | Keep legacy wheel behavior as fallback; movement path supports only the common case (Y-axis = forward/back) |
| In-progress interaction preservation may have edge cases with rapid input switching | Dropped or stuck interactions | Use proven pattern from existing ArcRotateCamera/GeospatialCamera pointer inputs |
| Deprecated flag setters triggering inputMap rebuild could conflict with user's custom inputMap | User's customizations overwritten | Only sync legacy flags when they are explicitly set; document that custom inputMap and deprecated flags should not be mixed |
