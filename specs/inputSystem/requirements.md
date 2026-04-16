# Input System — Requirements

## Overview

This document specifies the requirements for extending the declarative input mapping system (`inputMap` + `resolveInteraction()` + `handlers`) to FreeCamera, polishing the existing ArcRotateCamera and GeospatialCamera implementations, and adding comprehensive test coverage. The system allows users to remap physical inputs to semantic interactions and replace interaction handlers without subclassing.

---

## 1. Input Mapping (REQ-MAP)

### REQ-MAP-1: Declarative input-to-interaction mapping

Each in-scope camera (ArcRotateCamera, GeospatialCamera, FreeCamera) MUST support a declarative `inputMap` array on its movement class that maps physical input sources (pointer, keyboard, wheel, touch) to semantic interaction names. First matching entry wins.

### REQ-MAP-2: resolveInteraction returns interaction name or "none"

`resolveInteraction(source, conditions)` MUST return the interaction name of the first matching `inputMap` entry, or `"none"` if no entry matches. When `"none"` is returned, the input class MUST take no action.

### REQ-MAP-3: User-modifiable inputMap

Users MUST be able to reassign `camera.movement.inputMap` at runtime to remap inputs. New interactions MUST use the updated map immediately. In-progress interactions (e.g., an active drag) MUST continue using the interaction type resolved at the start of the interaction.

### REQ-MAP-4: Reset to defaults

Each `CameraMovement` subclass MUST provide a `resetInputMap()` method that restores the `inputMap` to its camera-type default configuration.

### REQ-MAP-5: InputMapEntry type safety

`InputMapEntry` MUST be a discriminated union on `source`, where each variant only exposes fields relevant to that source (e.g., `button` only on pointer entries, `touchCount` only on touch entries). The `interaction` field MUST be constrained to the camera's valid interaction names via generics.

### REQ-MAP-6: Modifier matching

`InputMapEntry` variants for pointer, wheel, and keyboard sources MUST support optional `modifiers` (ctrl, shift, alt). An entry with no modifiers MUST match regardless of modifier state. An entry with specific modifiers MUST only match when those modifiers are active.

### REQ-MAP-7: Entry ordering determines priority

More-specific entries (with modifiers or button constraints) MUST be placed before less-specific entries in default maps. The documentation MUST note that first-match-wins semantics require careful ordering.

---

## 2. Interaction Handlers (REQ-HDL)

### REQ-HDL-1: Camera-specific handler types

Each `CameraMovement` subclass MUST define its own typed `handlers` property with handler signatures appropriate to that camera's movement model. Different camera types MAY have completely different handler interfaces.

### REQ-HDL-2: Replaceable handlers

Users MUST be able to replace individual interaction handlers by assigning to `camera.movement.handlers.<interaction>`. The replacement MUST conform to the handler's type signature. TypeScript MUST enforce correct handler types at compile time.

### REQ-HDL-3: Default handlers reproduce current behavior

Each `CameraMovement` subclass MUST provide default handlers that reproduce the camera's current behavior exactly. No observable behavior change when the movement system is enabled with default configuration.

### REQ-HDL-4: Handler lifecycle support

Handlers that require lifecycle management (e.g., pan with start/update/stop) MUST be represented as objects with named methods. Single-operation handlers MAY be plain functions. The distinction MUST be per-handler, not per-camera.

---

## 3. CameraMovement Base Class (REQ-MOV)

### REQ-MOV-1: Opt-in activation

The movement system MUST be opt-in. A flag on the camera, when set, MUST result in the appropriate `CameraMovement` subclass being created and assigned to `camera.movement`. The flag MUST default to off (disabled).

### REQ-MOV-2: Existing behavior when disabled

When the movement system is disabled (flag off / `camera.movement` is null), the camera MUST behave exactly as it does today. No existing code paths may be broken.

### REQ-MOV-3: Framerate-independent deltas

`CameraMovement` MUST convert accumulated pixel deltas to framerate-independent deltas with configurable inertia via `computeCurrentFrameDeltas()`. This MUST work for all in-scope camera types.

### REQ-MOV-4: Base class generalization

The `CameraMovement` base class MUST support both orbit-style cameras (ArcRotateCamera: pan/rotate/zoom) and first-person cameras (FreeCamera: translate/rotate). Accumulator and speed properties MUST be generic enough for both paradigms, or subclasses MUST be able to define their own without base class constraints.

### REQ-MOV-5: No render-loop allocations

`resolveInteraction()` and `computeCurrentFrameDeltas()` MUST NOT allocate objects. Input classes MUST cache `InputConditions` objects and mutate them per frame rather than creating new objects.

---

## 4. FreeCamera Movement (REQ-FREE)

### REQ-FREE-1: FreeCameraMovement class

A `FreeCameraMovement` class MUST be created extending `CameraMovement`, with handlers and inputMap appropriate for FreeCamera's translate+rotate model.

### REQ-FREE-2: FreeCamera interactions

`FreeCameraMovement` MUST define at minimum these semantic interactions:
- `translate` — Move the camera position (forward/back, left/right, up/down)
- `rotate` — Rotate the camera orientation (yaw and pitch)

Additional interactions MAY be defined if the current FreeCamera input behavior requires them.

### REQ-FREE-3: Default inputMap reproduces current behavior

The default `inputMap` for `FreeCameraMovement` MUST map:
- Mouse drag → rotate (yaw/pitch)
- WASD/arrow keys → translate
- Mouse wheel → translate forward/back (if current behavior supports this)
- Touch → rotate and/or translate (matching current `FreeCameraTouchInput` behavior)

The exact mappings MUST match the current FreeCamera behavior when the movement system is disabled.

### REQ-FREE-4: Refactored input classes

`FreeCameraMouseInput`, `FreeCameraKeyboardMoveInput`, `FreeCameraMouseWheelInput`, and `FreeCameraTouchInput` MUST be refactored to use `resolveInteraction()` and `handlers` when `camera.movement` is available, falling back to current behavior when it is not.

### REQ-FREE-5: Framerate-independent FreeCamera movement

`FreeCameraMovement.computeCurrentFrameDeltas()` MUST produce framerate-independent translation and rotation deltas with configurable inertia, replacing FreeCamera's current `camera.speed` and `_computeLocalCameraSpeed()` framerate scaling when the movement system is enabled.

---

## 5. ArcRotateCamera Polish (REQ-ARC)

### REQ-ARC-1: Existing implementation consistency

`ArcRotateCameraMovement` MUST be reviewed for consistency with the base class API and GeospatialCameraMovement. Any inconsistencies MUST be resolved.

### REQ-ARC-2: ArcRotateCamera interactions

`ArcRotateCameraMovement` MUST support at minimum: `pan`, `rotate`, `zoom`.

### REQ-ARC-3: Default behavior preservation

The default `inputMap` and `handlers` MUST reproduce current ArcRotateCamera behavior exactly: left-click rotate, right-click pan, wheel zoom, ctrl+arrows pan, alt+arrows zoom, plain arrows rotate.

---

## 6. GeospatialCamera Polish (REQ-GEO)

### REQ-GEO-1: Existing implementation consistency

`GeospatialCameraMovement` MUST be reviewed for consistency with the base class API and ArcRotateCameraMovement. Any inconsistencies MUST be resolved.

### REQ-GEO-2: GeospatialCamera interactions

`GeospatialCameraMovement` MUST support at minimum: `pan`, `rotate`, `zoom`.

### REQ-GEO-3: Default behavior preservation

The default `inputMap` and `handlers` MUST reproduce current GeospatialCamera behavior exactly.

---

## 7. Backward Compatibility (REQ-COMPAT)

### REQ-COMPAT-1: Opt-in with no breaking changes

When the movement system is disabled (default), all existing camera behavior MUST be preserved with zero code changes required from users.

### REQ-COMPAT-2: Deprecated flags map to inputMap

When the movement system is enabled, legacy flags (`useCtrlForPanning`, `panningMouseButton`, `useAltToZoom`, `multiTouchPanAndZoom`, etc.) MUST be deprecated (marked with `@deprecated` and console warnings) but MUST continue to work by internally modifying the `inputMap`.

### REQ-COMPAT-3: No compile-time breaks

No changes to public API signatures that would cause compile errors in existing user code. New parameters MUST be optional. No removed public methods or properties.

### REQ-COMPAT-4: No runtime behavior changes for existing code

Existing code that does not opt in to the movement system MUST behave identically to before. No observable side effects from the existence of the new system.

---

## 8. Serialization (REQ-SER)

### REQ-SER-1: inputMap serialization

The `inputMap` array MUST be serializable to and parseable from .babylon JSON format. The serialized representation MUST be human-readable.

### REQ-SER-2: Handler serialization

Default handlers (identified by name/type) SHOULD be serializable by reference. Custom handler functions MUST NOT be serialized (they cannot be). When a serialized scene references a handler that cannot be restored, the default handler MUST be used.

---

## 9. Testing (REQ-TEST)

### REQ-TEST-1: resolveInteraction unit tests

Unit tests MUST cover:
- Basic source matching (pointer, keyboard, wheel, touch)
- First-match-wins ordering
- Modifier matching (exact, partial, absent)
- Button/touchCount matching
- Return of "none" when no entry matches
- Empty inputMap

### REQ-TEST-2: computeCurrentFrameDeltas unit tests

Unit tests MUST cover:
- Framerate independence (same accumulated pixels produce same deltas regardless of frame timing)
- Inertia decay behavior
- Accumulator reset after computation
- Zero-delta passthrough

### REQ-TEST-3: Default behavior preservation tests

For each in-scope camera, unit tests MUST verify that the default `inputMap` and `handlers` produce the same results as the legacy code path for representative input sequences.

### REQ-TEST-4: Backward compatibility tests

Unit tests MUST verify that deprecated flags (`useCtrlForPanning`, etc.) correctly modify the `inputMap` when the movement system is enabled.

### REQ-TEST-5: InputMap mutation tests

Unit tests MUST verify that inputMap changes take effect for new interactions but do not affect in-progress interactions.

---

## Out of Scope

- **FollowCamera and FlyCamera** — Deferred to future work.
- **Exotic input sources** — Gamepad, VR device orientation, virtual joystick, device orientation. Deferred.
- **Inspector UI for inputMap** — Can be added later.
- **Conflict resolution between simultaneous inputs** — Not addressed in this iteration.
- **Input validation** — No runtime validation of inputMap entries (e.g., checking for duplicate entries or unreachable entries).

---

## Acceptance Criteria Summary

| ID | Requirement | Acceptance Criteria |
|----|------------|-------------------|
| REQ-MAP-1 | Declarative input mapping | All 3 cameras support inputMap on movement class |
| REQ-MAP-2 | resolveInteraction | Returns correct interaction or "none" |
| REQ-MAP-3 | Runtime remapping | inputMap reassignment works immediately for new interactions |
| REQ-MAP-4 | Reset to defaults | resetInputMap() restores camera-type defaults |
| REQ-MAP-5 | Type safety | InputMapEntry is discriminated union, generics constrain interaction names |
| REQ-MAP-6 | Modifier matching | Modifiers match correctly (present, absent, partial) |
| REQ-MAP-7 | Entry ordering | Default maps ordered specific-to-general |
| REQ-HDL-1 | Camera-specific handlers | Each camera has typed handlers property |
| REQ-HDL-2 | Replaceable handlers | Handler assignment works, TypeScript enforces types |
| REQ-HDL-3 | Default behavior | Default handlers reproduce current camera behavior |
| REQ-HDL-4 | Handler lifecycle | Object handlers support start/update/stop; function handlers are plain |
| REQ-MOV-1 | Opt-in activation | Flag on camera creates movement class, defaults to off |
| REQ-MOV-2 | Disabled behavior | Camera works identically when movement disabled |
| REQ-MOV-3 | Framerate independence | computeCurrentFrameDeltas produces consistent results |
| REQ-MOV-4 | Base class generalization | Supports orbit and first-person paradigms |
| REQ-MOV-5 | No allocations | Zero allocations in render loop |
| REQ-FREE-1 | FreeCameraMovement | Class exists with appropriate handlers/inputMap |
| REQ-FREE-2 | FreeCamera interactions | translate and rotate interactions defined |
| REQ-FREE-3 | FreeCamera defaults | Default map matches current behavior |
| REQ-FREE-4 | Refactored inputs | FreeCamera inputs use resolveInteraction when available |
| REQ-FREE-5 | Framerate independence | FreeCameraMovement has framerate-independent deltas |
| REQ-ARC-1 | ArcRotate polish | Consistent with base class and Geospatial |
| REQ-ARC-2 | ArcRotate interactions | pan, rotate, zoom supported |
| REQ-ARC-3 | ArcRotate defaults | Default behavior preserved exactly |
| REQ-GEO-1 | Geospatial polish | Consistent with base class and ArcRotate |
| REQ-GEO-2 | Geospatial interactions | pan, rotate, zoom supported |
| REQ-GEO-3 | Geospatial defaults | Default behavior preserved exactly |
| REQ-COMPAT-1 | Opt-in no breaks | Disabled by default, no changes for existing users |
| REQ-COMPAT-2 | Deprecated flags | Legacy flags work via inputMap shims |
| REQ-COMPAT-3 | No compile breaks | No public API signature changes |
| REQ-COMPAT-4 | No runtime breaks | No observable behavior changes for existing code |
| REQ-SER-1 | inputMap serialization | inputMap round-trips through .babylon JSON |
| REQ-SER-2 | Handler serialization | Default handlers serialized by reference, custom handlers gracefully skipped |
| REQ-TEST-1 | resolveInteraction tests | Unit tests for all matching scenarios |
| REQ-TEST-2 | computeCurrentFrameDeltas tests | Unit tests for framerate independence and inertia |
| REQ-TEST-3 | Default behavior tests | Per-camera tests verifying behavior preservation |
| REQ-TEST-4 | Backward compat tests | Deprecated flag shim tests |
| REQ-TEST-5 | Mutation tests | inputMap changes don't affect in-progress interactions |
