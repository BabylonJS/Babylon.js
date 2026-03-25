# Camera Input Architecture Proposal

## Problem Statement

Camera input configuration is handled through scattered, ad-hoc boolean flags:

| Flag                                        | Location                          | What it controls                                            |
| ------------------------------------------- | --------------------------------- | ----------------------------------------------------------- |
| `useCtrlForPanning`                         | `ArcRotateCamera.attachControl()` | Whether ctrl+arrows pan instead of rotate                   |
| `multiTouchPanAndZoom`                      | `OrbitCameraPointersInput`        | Whether two-finger gestures can pan and zoom simultaneously |
| `allowZoomWhilePointerRotating` (PR #18150) | `GeospatialCameraMouseWheelInput` | Whether wheel zoom works during pointer rotation            |

Each new configuration need adds another boolean, another conditional, and often requires one input to inspect a sibling input's state. This doesn't scale, and the flag combinatorics become hard to reason about.

**Motivating examples:**

- [PR #18150](https://github.com/BabylonJS/Babylon.js/pull/18150): Geo camera wheel zoom during rotation. The wheel input reaches into the pointer input via `this.camera.inputs.attached["pointers"]` with a string key + cast.
- [Forum thread](https://forum.babylonjs.com/t/panning-arcrotatecamera-with-keyboard-without-using-ctrl-key/19878): Community request to swap pan/rotate on ArcRotateCamera. Currently requires modifying `attachControl` signature.
- Post-9.0 camera input rework (georgie/amoebachant) for framerate-independent movement.

## Proposed Architecture

Two composable layers, each answering one question:

```
┌───────────────────────────────────────────────────────┐
│ Physical Input (mouse, keyboard, touch)               │
│  ↓                                                    │
│ [Layer 1: Input Mapping]                              │
│  "What interaction does this gesture mean?"           │
│  Declarative map: source + condition → interaction     │
│  ↓                                                    │
│ [Layer 2: Interaction Handlers]                       │
│  "What does this interaction do to the camera?"       │
│  Keyed by: interaction name only (source-agnostic)    │
│  ↓                                                    │
│ Camera state updated                                  │
│  ↓                                                    │
│ onAfterCheckInputsObservable fires                    │  ← EXISTING
│  ↓                                                    │
│ [Behavior<Camera>] → post-input modifications         │  ← EXISTING (unchanged)
│  (AutoRotation, Bouncing, Framing, Clipping)          │
└───────────────────────────────────────────────────────┘
```

### Terminology

| Term                    | Means                                                                 | Example                                            |
| ----------------------- | --------------------------------------------------------------------- | -------------------------------------------------- |
| **Input**               | Physical device event processor (existing concept)                    | `GeospatialCameraPointersInput`                    |
| **Interaction**         | Semantic action the camera performs (new)                             | `"rotate"`, `"pan"`, `"zoom"`                      |
| **Input Map Entry**     | Declarative rule: source + condition → interaction (new)              | `{ source: Pointer, button: 0, interaction: Pan }` |
| **Interaction Handler** | Executes a semantic action on the camera (new, typed per interaction) | `GlobeDragHandler`, `TiltHandler`                  |
| **Behavior**            | Post-input reactive modifier (existing, unchanged)                    | `AutoRotationBehavior`                             |

---

## Core Types

```ts
/** Where the interaction originated (physical device) */
type InputSource = "pointer" | "wheel" | "touch" | "keyboard";

type InputModifiers = { ctrl?: boolean; shift?: boolean; alt?: boolean };

/**
 * InputMapEntry is a discriminated union on `source`.
 * Each variant only exposes fields relevant to that source — e.g. `button` only
 * exists on pointer entries, `touchCount` only on touch entries.
 */
type PointerInputMapEntry<T extends string = string> = {
    source: "pointer";  interaction: T;  button?: number;  modifiers?: InputModifiers;
};
type WheelInputMapEntry<T extends string = string> = {
    source: "wheel";    interaction: T;  modifiers?: InputModifiers;
};
type TouchInputMapEntry<T extends string = string> = {
    source: "touch";    interaction: T;  touchCount?: number;
};
type KeyboardInputMapEntry<T extends string = string> = {
    source: "keyboard"; interaction: T;  modifiers?: InputModifiers;
};

type InputMapEntry<T extends string = string> =
    | PointerInputMapEntry<T>
    | WheelInputMapEntry<T>
    | TouchInputMapEntry<T>
    | KeyboardInputMapEntry<T>;
// { source: "pointer", button: 0, touchCount: 1 } → compile error (touchCount not on pointer)
```

The base `CameraMovement` class provides the `inputMap` and `resolveInteraction()` infrastructure. It does not define `handlers` — each camera's movement subclass declares its own typed `handlers` property.

```ts
class CameraMovement {
    /** Ordered list of input-to-interaction rules. First match wins. */
    public inputMap: InputMapEntry[] = [];

    /** Find the interaction type for a given source and conditions */
    public resolveInteraction(source: InputSource, conditions?: InputConditions): string {
        for (const entry of this.inputMap) {
            if (entry.source !== source) continue;
            // switch narrows the union — each case only checks fields that exist on that variant
            switch (entry.source) {
                case "pointer":
                    if (entry.button !== undefined && entry.button !== conditions?.button) continue;
                    if (!this._matchModifiers(entry.modifiers, conditions?.modifiers)) continue;
                    break;
                case "wheel":
                    if (!this._matchModifiers(entry.modifiers, conditions?.modifiers)) continue;
                    break;
                case "touch":
                    if (entry.touchCount !== undefined && entry.touchCount !== conditions?.touchCount) continue;
                    break;
                case "keyboard":
                    if (!this._matchModifiers(entry.modifiers, conditions?.modifiers)) continue;
                    break;
            }
            return entry.interaction;
        }
        return "none";
    }
}
```

---

## Camera-Specific Handler Types

Each camera's movement subclass defines its own `handlers` property with its own typed handler types. Different cameras can have completely different handler APIs — the base class doesn't constrain them. TypeScript enforces the correct types per camera because input classes reference the concrete movement type.

### Geospatial camera

```ts
type GeospatialPanHandler = {
    start(screenX: number, screenY: number): void;
    update(screenX: number, screenY: number): void;
    stop(): void;
};

type GeospatialRotateHandler = {
    update(deltaX: number, deltaY: number): void;
};

type GeospatialZoomHandler = {
    zoomByDelta(delta: number, toCursor: boolean): void;
};

type GeospatialFlyToHandler = {
    flyTo(target: Vector3): Promise<void>;
};

type GeospatialHandlers = {
    pan: GeospatialPanHandler;
    rotate: GeospatialRotateHandler;
    zoom: GeospatialZoomHandler;
    flyTo: GeospatialFlyToHandler;
};

class GeospatialCameraMovement extends CameraMovement {
    public override inputMap: InputMapEntry<keyof GeospatialHandlers>[] = [];
    public handlers: Partial<GeospatialHandlers> = {};
}
// inputMap interaction field only accepts "pan" | "rotate" | "zoom" | "flyTo"
// { interaction: "typo" } is a compile error
```

### ArcRotateCamera (different handler APIs)

```ts
type ArcRotatePanHandler = {
    pan(deltaAlpha: number, deltaBeta: number): void;
};

type ArcRotateRotateHandler = {
    orbit(deltaAlpha: number, deltaBeta: number): void;
};

type ArcRotateZoomHandler = {
    zoomByRadius(deltaRadius: number): void;
};

type ArcRotateHandlers = {
    pan: ArcRotatePanHandler;
    rotate: ArcRotateRotateHandler;
    zoom: ArcRotateZoomHandler;
};

class ArcRotateCameraMovement extends CameraMovement {
    public override inputMap: InputMapEntry<keyof ArcRotateHandlers>[] = [];
    public handlers: Partial<ArcRotateHandlers> = {};
}
// inputMap interaction field only accepts "pan" | "rotate" | "zoom"
```

The same `"pan"` string in the input map means different things for different cameras — geospatial pan drags the globe with screen coordinates, arc-rotate pan moves by angular offsets. TypeScript ensures each camera's input classes call the correct handler methods.

## Layer 1: Input Mapping

Maps physical gestures to semantic interactions via a declarative data structure on the movement class. Each entry says "when _this source_ fires with _these conditions_, it means _this interaction_." First matching entry wins.

### Default input maps (per camera type)

**Geospatial camera:**

```ts
camera.movement.inputMap = [
    { source: "pointer", button: 0, interaction: "pan" },
    { source: "pointer", button: 1, interaction: "rotate" },
    { source: "pointer", button: 2, interaction: "rotate" },
    { source: "touch", touchCount: 1, interaction: "pan" },
    { source: "wheel", interaction: "zoom" },
    { source: "keyboard", modifiers: { ctrl: true }, interaction: "rotate" },
    { source: "keyboard", modifiers: { alt: true }, interaction: "rotate" },
    { source: "keyboard", interaction: "pan" },
];
```

**ArcRotateCamera (current behavior):**

```ts
camera.movement.inputMap = [
    { source: "pointer", button: 0, interaction: "rotate" },
    { source: "pointer", button: 2, interaction: "pan" },
    { source: "wheel", interaction: "zoom" },
    { source: "keyboard", modifiers: { ctrl: true }, interaction: "pan" },
    { source: "keyboard", interaction: "rotate" },
];
```

Note: more-specific entries (with modifiers) must come **before** less-specific entries for the same source, since first match wins.

### User override examples

```ts
// "I want left-click to pan, right-click to rotate" (map-style navigation)
// Just reassign the pointer entries:
camera.movement.inputMap = [
    { source: "pointer", button: 0, interaction: "pan" },
    { source: "pointer", button: 2, interaction: "rotate" },
    { source: "wheel", interaction: "zoom" },
    { source: "keyboard", interaction: "rotate" },
];
```

```ts
// "I want default arrows to pan, ctrl+arrows to rotate" (forum thread ask)
// Just reorder the keyboard entries:
camera.movement.inputMap = [
    ...camera.movement.inputMap.filter((e) => e.source !== "keyboard"),
    { source: "keyboard", modifiers: { ctrl: true }, interaction: "rotate" },
    { source: "keyboard", interaction: "pan" },
];
```

### How inputs use the map

```ts
// Pointer input
onButtonDown(evt) {
    this._activeType = this.camera.movement.resolveInteraction("pointer", {
        button: evt.button, modifiers: { ctrl: evt.ctrlKey, ... }
    });
    if (this._activeType === "pan") {
        this.camera.movement.handlers.pan?.start(scene.pointerX, scene.pointerY);
    }
}

onTouch(point, offsetX, offsetY) {
    if (this._activeType === "pan") {
        this.camera.movement.handlers.pan?.update(scene.pointerX, scene.pointerY);
    } else if (this._activeType === "rotate") {
        this.camera.movement.handlers.rotate?.update(offsetX, offsetY);
    }
}

// Wheel input
checkInputs() {
    this.camera.movement.handlers.zoom?.zoomByDelta(this._wheelDeltaY, true);
}
```

### What it replaces

- `useCtrlForPanning` parameter on `attachControl()`
- Hardcoded `switch (evt.button)` in input classes
- `_ctrlPressed` internal state tracking
- `allowZoomWhilePointerRotating` on wheel input
- `multiTouchPanAndZoom` on pointer input
- Any input reaching into a sibling via `this.camera.inputs.attached["..."]`

### Performance: avoiding allocations in the render loop

`resolveInteraction()` accepts an `InputConditions` object. For event-driven inputs (pointer `onButtonDown`, `onButtonUp`), allocating this inline is fine — these don't run per frame. But for inputs whose `checkInputs()` runs every frame (keyboard with held keys), the conditions object must be **cached and mutated**, not allocated:

```ts
// ❌ Bad: allocates every frame
checkInputs() {
    const interaction = this.camera.movement.resolveInteraction("keyboard", {
        modifiers: { ctrl: this._modifierPressed, alt: this._modifierPressed }
    });
}

// ✅ Good: cache once, mutate per frame
private _keyboardConditions: InputConditions = { modifiers: { ctrl: false, alt: false } };

checkInputs() {
    this._keyboardConditions.modifiers!.ctrl = this._modifierPressed;
    this._keyboardConditions.modifiers!.alt = this._modifierPressed;
    const interaction = this.camera.movement.resolveInteraction("keyboard", this._keyboardConditions);
}
```

This follows the existing Babylon.js pattern (e.g. `TmpVectors`) of pre-allocating reusable objects to avoid GC pressure in the render loop. The `resolveInteraction()` scan itself (6–8 string comparisons) is negligible.

---

## Layer 2: Interaction Handlers

Defines what each interaction actually does to the camera. Handler types are defined per camera type (see Camera-Specific Handler Types above). The `handlers` property lives on each movement subclass — the base class provides the input map infrastructure, each subclass provides its own typed handlers.

### Handlers are keyed by interaction name (not source)

A `PanHandler` doesn't care whether the pan was triggered by a mouse drag or a keyboard arrow press — it just knows how to pan the camera. The source distinction is handled entirely by the input mapping layer.

### Default handlers (geospatial camera)

```ts
// Pan, rotate, zoom handlers set up by GeospatialCameraMovement constructor
// (delegates to existing movement methods: startDrag, handleDrag, stopDrag, handleZoom, etc.)

// flyTo handler wired up by GeospatialCamera constructor
// (lives on camera because it calls camera.flyToPointAsync, avoiding circular dependency)
camera.movement.handlers.flyTo = {
    flyTo: (target) => camera.flyToPointAsync(target),
};
```

### How inputs call handlers

Inputs resolve their interaction type via `resolveInteraction()` (Layer 1), then call the appropriate handler via `handlers.*`:

```ts
// Pointer input — pan gesture
onButtonDown(evt) {
    this._activeType = this.camera.movement.resolveInteraction("pointer", {
        button: evt.button, modifiers: { ctrl: evt.ctrlKey, ... }
    });
    if (this._activeType === "pan") {
        this.camera.movement.handlers.pan?.start(scene.pointerX, scene.pointerY);
    }
}

onTouch(point, offsetX, offsetY) {
    if (this._activeType === "pan") {
        this.camera.movement.handlers.pan?.update(scene.pointerX, scene.pointerY);
    } else if (this._activeType === "rotate") {
        this.camera.movement.handlers.rotate?.update(offsetX, offsetY);
    }
}

onButtonUp(evt) {
    if (this._activeType === "pan") {
        this.camera.movement.handlers.pan?.stop();
    }
}

// Double-tap — flyTo
onDoubleTap() {
    const pickResult = scene.pick(scene.pointerX, scene.pointerY);
    if (pickResult.pickedPoint) {
        this.camera.movement.handlers.flyTo?.flyTo(pickResult.pickedPoint);
    }
}
```

### User override (custom mechanics)

```ts
// "I want right-click to orbit around the picked point, not the camera target"
camera.movement.handlers.rotate = new OrbitAroundPickPointHandler(camera);
// Input mapping unchanged — still maps right-click to "rotate"
// OrbitAroundPickPointHandler must implement GeospatialRotateHandler
```

```ts
// "I want pan to have inertia"
camera.movement.handlers.pan = new InertiaPanHandler(camera);
// Must implement GeospatialPanHandler (start/update/stop with screen coords)
```

### What it replaces

- Hardcoded `handleDrag()`, `handleZoom()`, `_handleTilt()` scattered across input classes
- Movement logic that's split between inputs and the movement class

---

## Relationship to Existing Behavior\<Camera\> System

The existing `Behavior<T>` system is **unchanged and complementary**. Behaviors attach to cameras via `addBehavior()`, run after `onAfterCheckInputsObservable`, and apply secondary effects (auto-rotate when idle, bounce at limits, frame a mesh, adjust clip planes).

The two-layer system runs _before_ behaviors — it produces the core camera movement that behaviors then react to.

---

## Migration Examples

### Example 1: PR #18150 (wheel zoom during pointer rotation)

**Before (PR approach):** New `allowZoomWhilePointerRotating` boolean on wheel input + wheel input queries pointer input via `this.camera.inputs.attached["pointers"]` string-keyed lookup + cast.

**After:** The wheel input resolves its interaction type through the input map and calls the zoom handler directly. No cross-input inspection needed — whether zoom is allowed during rotation is an input-level concern (the wheel input simply doesn't know or care what the pointer input is doing).

### Example 2: Forum thread (swap pan/rotate for ArcRotateCamera)

**Before:** Modify `attachControl()` signature, add `CtrlKeyBehaviours` enum.

**After:** Update the input map.

```ts
camera.movement.inputMap = [
    { source: "pointer", button: 0, interaction: "rotate" },
    { source: "pointer", button: 2, interaction: "pan" },
    { source: "wheel", interaction: "zoom" },
    // Swapped: ctrl+arrows = rotate, plain arrows = pan
    { source: "keyboard", modifiers: { ctrl: true }, interaction: "rotate" },
    { source: "keyboard", interaction: "pan" },
];
```

### Example 3: Map-style navigation

**Before:** Subclass pointer input, override `onButtonDown`/`onTouch`.

**After:** Update two entries in the input map.

```ts
camera.movement.inputMap = [
    { source: "pointer", button: 0, interaction: "pan" },
    { source: "pointer", button: 2, interaction: "rotate" },
    { source: "wheel", interaction: "zoom" },
    { source: "keyboard", interaction: "rotate" },
];
```

### Example 4: Custom orbit-around-pick-point

**Before:** Subclass input class, override movement methods.

**After:** Swap one interaction handler (type-safe).

```ts
camera.movement.handlers.rotate = new OrbitAroundPickPointHandler(camera);
```

### Example 5: Allow multitouch pan + zoom on orbit camera

**Before:** Set `multiTouchPanAndZoom = true` on pointer input.

**After:** Multi-touch classification stays inside the pointer input (it's a gesture-detection concern, not a mapping concern). The pointer input determines whether a two-finger gesture is a pan, zoom, or both, and calls the appropriate handler(s).

---

## Implementation Staging

The two layers are independent and can be shipped incrementally.

### Phase 1: Input Mapping (unblocks forum thread, simplifies PR #18150)

**Scope:** Movement class gets `inputMap` array and `resolveInteraction()`. Each movement subclass defines its own typed `handlers` property. Existing inputs use them instead of hardcoding button→action logic.

**Changes:**

- `InputSource` (string literal union), `InputMapEntry` type (new file)
- `CameraMovement`: add `inputMap`, `resolveInteraction()`
- Each camera movement subclass: define `handlers` property with camera-specific handler types (e.g. `GeospatialHandlers`, `ArcRotateHandlers`)
- Refactor existing input classes to call `resolveInteraction()` and `handlers.*` instead of hardcoded switch/if chains
- Deprecate `useCtrlForPanning` on `attachControl()`

**Backward compat:** Fully backward compatible. Default input maps and handlers reproduce current behavior. `useCtrlForPanning` sets the map internally during deprecation period.

### Phase 2: Handler extraction (largest refactor)

**Scope:** Extract movement logic from movement class into standalone handler classes that can be composed and reused across camera types.

**Changes:**

- Concrete handler classes extracted from existing code (`GlobeDragHandler`, `TiltHandler`, `ZoomToPointHandler`, etc.)
- Movement class becomes a thin coordinator: owns `inputMap`, `handlers`, accumulated pixel state, inertia
- Input classes become thin: map events via `resolveInteraction()`, call handler methods

**Backward compat:** Internal refactor. Public API surface of inputs and movement class preserved via delegation.

---

## Open Questions

1. **Multi-touch classification:** Two-finger gestures can be pinch (zoom) or pan depending on finger movement. This classification currently happens inside the pointer input. Does it move to the mapping layer (via `touchCount` or similar) or stay in the input as gesture detection?

2. **Backward compatibility for `multiTouchPanAndZoom`:** This flag on `OrbitCameraPointersInput` controls both what a two-finger gesture means (pan vs zoom vs both) and whether they can happen simultaneously. Migration path needs care.

3. **Extensibility:** If a camera type adds a new interaction (e.g. `tilt`), it just adds a property to its own handlers type. No base class changes needed.

4. **Interaction coexistence:** Without a conflict matrix, cross-input blocking (e.g. "don't zoom while panning") stays inside individual inputs or the movement class. If this becomes a recurring need, a lightweight conflict mechanism could be added later without changing the input map or handler layers.
