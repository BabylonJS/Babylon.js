# Input System — Goals

## Problem Statement

Camera input configuration in Babylon.js is handled through scattered, ad-hoc boolean flags (`useCtrlForPanning`, `multiTouchPanAndZoom`, `panningMouseButton`, etc.) and hardcoded button-to-action logic in input classes. Each new configuration need adds another boolean, another conditional, and often requires one input to inspect a sibling input's state. This doesn't scale, and the flag combinatorics become hard to reason about.

A two-layer declarative input mapping system (`inputMap` + `resolveInteraction()` + typed `handlers`) has already been implemented for **ArcRotateCamera** and **GeospatialCamera** via the `CameraMovement` base class. However, these implementations have no test coverage, and other major camera types (FreeCamera, FollowCamera, FlyCamera) still use hardcoded input logic.

## Scope

This feature targets three camera types:

- **ArcRotateCamera** — Already has the pattern via `ArcRotateCameraMovement`. Needs polish and comprehensive tests.
- **GeospatialCamera** — Already has the pattern via `GeospatialCameraMovement`. Needs polish and comprehensive tests.
- **FreeCamera** — Does not yet have a `CameraMovement` subclass. Needs a new movement class, input refactoring, and tests.

FreeCamera's interaction model differs from ArcRotateCamera (translate + rotate vs. orbit). The `CameraMovement` base class may need to evolve to accommodate this — e.g., its current accumulators (`panAccumulatedPixels`, `rotationAccumulatedPixels`, `zoomAccumulatedPixels`) are orbit-centric.

### Deferred to future work

- **FollowCamera** — Its 3-property model (`heightOffset`, `rotationOffset`, `radius`) with 9 modifier flags is different enough to warrant separate treatment.
- **FlyCamera** — Similar to FreeCamera but adds roll; defer until FreeCamera pattern is proven.
- **Exotic input sources** — Gamepad, VR device orientation, virtual joystick, device orientation. These don't fit the `button + modifiers → interaction` model cleanly (continuous sensors, axis-based). Defer until core sources (pointer, keyboard, wheel, touch) are solid.

## Goals

### G1: Extend input mapping to FreeCamera

Create a `FreeCameraMovement` subclass of `CameraMovement` with:
- Camera-specific typed handlers (e.g. `translate`, `rotate`) with appropriate signatures
- A default `inputMap` that reproduces current FreeCamera behavior
- Framerate-independent movement with proper inertia via `computeCurrentFrameDeltas()`
- Refactored FreeCamera input classes (mouse, keyboard, wheel, touch) to use `resolveInteraction()` and `handlers`

### G2: Polish ArcRotateCamera and GeospatialCamera implementations

Review and refine the existing `ArcRotateCameraMovement` and `GeospatialCameraMovement` implementations. Ensure they are consistent with each other, handle edge cases, and that the base class API is clean enough to support FreeCamera's different paradigm.

### G3: User-configurable input remapping

Users can remap any physical input (pointer, keyboard, wheel, touch) to any semantic interaction by modifying `camera.movement.inputMap`. For example:
- Swapping left-click pan/rotate on ArcRotateCamera
- Changing modifier key bindings
- Remapping WASD to different actions on FreeCamera

All without subclassing or overriding input classes.

### G4: Replaceable interaction handlers

Users can replace individual interaction handlers by assigning to `camera.movement.handlers.*`. Handler interfaces are camera-specific — different camera types have different handler signatures as appropriate for their movement model.

### G5: Backward compatibility via deprecation

Legacy flags (`useCtrlForPanning`, `multiTouchPanAndZoom`, `panningMouseButton`, `useAltToZoom`, etc.) are deprecated but continue to work by internally modifying the `inputMap`. No compile-time or runtime breaking changes for existing users.

### G6: Generalize the CameraMovement base class

The base `CameraMovement` class may need to evolve to support FreeCamera's translate+rotate model alongside ArcRotateCamera's orbit model. The current accumulator names (`panAccumulatedPixels`, etc.) and speed properties (`panSpeed`, `rotationXSpeed`, etc.) may need to become more generic or extensible.

### G7: Comprehensive test coverage

Add unit tests for:
- `resolveInteraction()` — entry matching, first-match-wins, modifier matching, fallback to "none"
- `computeCurrentFrameDeltas()` — inertia, framerate independence, accumulator reset
- Each `CameraMovement` subclass's default `inputMap` and `handlers`
- Backward compatibility shims (deprecated flags still produce correct behavior)

## Non-Goals

- **General-purpose input system for non-camera entities** — This feature is scoped to camera inputs only.
- **Removing the existing `ICameraInput` / `CameraInputsManager` system** — The input mapping layer sits inside the existing input architecture, not a replacement of it.
- **Changing the Behavior\<Camera\> system** — Behaviors remain unchanged; they run after input processing.
- **FollowCamera, FlyCamera** — Deferred to future work.
- **Exotic input sources (gamepad, VR, virtual joystick, device orientation)** — Deferred to future work.

## Constraints

- **Performance**: No allocations in the render loop. `resolveInteraction()` conditions objects must be cached and mutated, not allocated per frame. Follow the `TmpVectors` pattern.
- **Backward compatibility**: All existing camera input APIs must continue to work. Deprecated flags map internally to `inputMap` entries.
- **Type safety**: Each camera's handler types are specific to that camera. TypeScript should enforce correct handler signatures.

## Prior Art

- `camera-input-architecture-proposal.md` — Detailed architecture proposal created with prior exploration. Use as reference but not as gospel; the architecture and implementation phases may be restructured.
- Existing `CameraMovement` base class in `packages/dev/core/src/Cameras/cameraMovement.ts`
- Existing `ArcRotateCameraMovement` in `packages/dev/core/src/Cameras/arcRotateCameraMovement.ts`
- Existing `GeospatialCameraMovement` in `packages/dev/core/src/Cameras/geospatialCameraMovement.ts`
