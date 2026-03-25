# Camera Input Architecture Proposal

## Problem Statement

Camera input configuration is handled through scattered, ad-hoc boolean flags:

| Flag | Location | What it controls |
|---|---|---|
| `useCtrlForPanning` | `ArcRotateCamera.attachControl()` | Whether ctrl+arrows pan instead of rotate |
| `multiTouchPanAndZoom` | `OrbitCameraPointersInput` | Whether two-finger gestures can pan and zoom simultaneously |
| `allowZoomWhilePointerRotating` (PR #18150) | `GeospatialCameraMouseWheelInput` | Whether wheel zoom works during pointer rotation |

Each new configuration need adds another boolean, another conditional, and often requires one input to inspect a sibling input's state. This doesn't scale, and the flag combinatorics become hard to reason about.

**Motivating examples:**
- [PR #18150](https://github.com/BabylonJS/Babylon.js/pull/18150): Geo camera wheel zoom during rotation. The wheel input reaches into the pointer input via `this.camera.inputs.attached["pointers"]` with a string key + cast.
- [Forum thread](https://forum.babylonjs.com/t/panning-arcrotatecamera-with-keyboard-without-using-ctrl-key/19878): Community request to swap pan/rotate on ArcRotateCamera. Currently requires modifying `attachControl` signature.
- Post-9.0 camera input rework (georgie/amoebachant) for framerate-independent movement.

## Proposed Architecture

Three composable layers, each answering one question:

```
┌───────────────────────────────────────────────────────┐
│ Physical Input (mouse, keyboard, touch)               │
│  ↓                                                    │
│ [Layer 1: Input Mapping]                              │
│  "What interaction does this gesture mean?"           │
│  Produces: InteractionType + InputSource              │
│  ↓                                                    │
│ [Layer 2: Conflict Matrix]                            │
│  "Can these interactions happen at the same time?"    │
│  Checks: type + source against conflict rules         │
│  ↓                                                    │
│ [Layer 3: Interaction Handlers]                       │
│  "What does this interaction do to the camera?"       │
│  Keyed by: InteractionType only (source-agnostic)     │
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

| Term | Means | Example |
|---|---|---|
| **Input** | Physical device event processor (existing concept) | `GeospatialCameraPointersInput` |
| **Interaction** | Semantic action type + input source (new) | `{ type: Rotate, source: Pointer }` |
| **Interaction Handler** | Executes a semantic action on the camera (new, typed per interaction) | `GlobeDragHandler`, `TiltHandler` |
| **Behavior** | Post-input reactive modifier (existing, unchanged) | `AutoRotationBehavior` |

---

## Core Types

```ts
/** What the camera is doing (semantic action) */
enum InteractionType {
    None,
    Pan,
    Rotate,
    Zoom,
    FlyTo,
    // extensible per camera type
}

/** Where the interaction originated (physical device) */
enum InputSource {
    Pointer,   // mouse buttons
    Wheel,     // scroll wheel
    Touch,     // touch screen
    Keyboard,  // arrow keys, etc.
}

/** A specific active interaction: what + who */
interface ActiveInteraction {
    type: InteractionType;
    source: InputSource;
}
```

### Where source matters

| Layer | Uses source? | Why |
|---|---|---|
| Input Mapping | Produces it | Physical event → type + source |
| Conflict Matrix | **Yes** | Different sources have different coexistence rules |
| Active Interactions Set | **Yes** | Tracks what's active with source |
| Interaction Handlers | **No** | Handlers care about *what*, not *who* |

---

## Layer 1: Input Mapping

Maps physical gestures to semantic interactions. Replaces hardcoded `switch (evt.button)` blocks and `_ctrlPressed` booleans.

### Interface

```ts
interface InputContext {
    device: InputSource;
    button?: number;         // mouse button (0=left, 1=middle, 2=right)
    key?: string;            // keyboard key
    modifiers: {
        ctrl: boolean;
        shift: boolean;
        alt: boolean;
    };
    touchCount?: number;     // number of active touches
}

/** Returns the interaction type; source is inferred from context.device */
type InputMappingFunction = (context: InputContext) => InteractionType;
```

The mapping function returns `InteractionType`. The `InputSource` is automatically derived from `context.device`, so the resulting `ActiveInteraction` is `{ type: mapping(ctx), source: ctx.device }`.

### Default mappings (per camera type)

**Geospatial camera:**
```ts
const geoDefault: InputMappingFunction = (ctx) => {
    if (ctx.device === InputSource.Pointer) {
        if (ctx.button === 0) return InteractionType.Pan;
        if (ctx.button === 1 || ctx.button === 2) return InteractionType.Rotate;
    }
    if (ctx.device === InputSource.Touch) {
        if (ctx.touchCount === 1) return InteractionType.Pan;
    }
    if (ctx.device === InputSource.Wheel) {
        return InteractionType.Zoom;
    }
    return InteractionType.None;
};
```

**ArcRotateCamera (current behavior):**
```ts
const arcRotateDefault: InputMappingFunction = (ctx) => {
    if (ctx.device === InputSource.Keyboard) {
        return ctx.modifiers.ctrl ? InteractionType.Pan : InteractionType.Rotate;
    }
    if (ctx.device === InputSource.Pointer) {
        if (ctx.button === 0) return InteractionType.Rotate;
        if (ctx.button === 2) return InteractionType.Pan;
    }
    return InteractionType.None;
};
```

### User override (forum thread ask)
```ts
// "I want default arrows to pan, ctrl+arrows to rotate"
camera.inputMapping = (ctx) => {
    if (ctx.device === InputSource.Keyboard) {
        return ctx.modifiers.ctrl ? InteractionType.Rotate : InteractionType.Pan;
    }
    return arcRotateDefault(ctx); // everything else unchanged
};
```

### What it replaces
- `useCtrlForPanning` parameter on `attachControl()`
- Hardcoded `switch (evt.button)` in input classes
- `_ctrlPressed` internal state tracking

---

## Layer 2: Conflict Matrix

Declares which interactions cannot coexist. Supports source-specific rules to distinguish e.g. wheel zoom during pointer rotation (allowed) from touch zoom during touch rotation (blocked).

### Interface

```ts
/** A pattern that matches active interactions. Omitting source = wildcard (any source). */
interface InteractionPattern {
    type: InteractionType;
    source?: InputSource;    // undefined = matches any source
}

/** Two interaction patterns that cannot coexist. Symmetric. */
interface InteractionConflict {
    a: InteractionPattern;
    b: InteractionPattern;
}

class CameraMovement {
    /** Currently active interactions (gesture-level state, not frame deltas) */
    public activeInteractions = new Set<ActiveInteraction>();

    /** Pairs of interactions that cannot coexist */
    public interactionConflicts: InteractionConflict[] = [];

    /** Check if an interaction is allowed given current active interactions */
    public canPerform(interaction: ActiveInteraction): boolean {
        for (const active of this.activeInteractions) {
            for (const conflict of this.interactionConflicts) {
                if ((this._matches(active, conflict.a) && this._matches(interaction, conflict.b)) ||
                    (this._matches(active, conflict.b) && this._matches(interaction, conflict.a))) {
                    return false;
                }
            }
        }
        return true;
    }

    private _matches(interaction: ActiveInteraction, pattern: InteractionPattern): boolean {
        return interaction.type === pattern.type &&
               (pattern.source === undefined || interaction.source === pattern.source);
    }
}
```

### Default conflicts (geospatial camera)

```ts
this.movement.interactionConflicts = [
    // Pan blocks all zoom (regardless of source)
    { a: { type: InteractionType.Pan },    b: { type: InteractionType.Zoom } },

    // Touch rotation blocks touch zoom (no pinch-zoom while two-finger rotating)
    { a: { type: InteractionType.Rotate, source: InputSource.Touch },
      b: { type: InteractionType.Zoom,   source: InputSource.Touch } },

    // Pointer rotation blocks wheel zoom (current default behavior)
    { a: { type: InteractionType.Rotate, source: InputSource.Pointer },
      b: { type: InteractionType.Zoom,   source: InputSource.Wheel } },
];
```

### User override (PR #18150 ask)

```ts
// "Allow wheel zoom while pointer-rotating"
// Just remove the pointer-rotate ↔ wheel-zoom entry:
camera.movement.interactionConflicts = [
    { a: { type: InteractionType.Pan },    b: { type: InteractionType.Zoom } },
    { a: { type: InteractionType.Rotate, source: InputSource.Touch },
      b: { type: InteractionType.Zoom,   source: InputSource.Touch } },
    // pointer-rotate ↔ wheel-zoom conflict gone
];
```

### How `multiTouchPanAndZoom` maps
```ts
// multiTouchPanAndZoom = false (blocks simultaneous touch pan + touch zoom)
{ a: { type: InteractionType.Pan, source: InputSource.Touch },
  b: { type: InteractionType.Zoom, source: InputSource.Touch } }

// multiTouchPanAndZoom = true → omit this entry
```

### How inputs participate

Inputs register/deregister gesture state on the movement class. They no longer inspect each other.

```ts
// Pointer input
onButtonDown(evt) {
    const interactionType = this.camera.inputMapping({
        device: InputSource.Pointer, button: evt.button, modifiers: { ... }
    });
    const interaction = { type: interactionType, source: InputSource.Pointer };
    this.camera.movement.activeInteractions.add(interaction);
    this._activeInteraction = interaction; // track for cleanup
}

onButtonUp(evt) {
    if (this._activeInteraction) {
        this.camera.movement.activeInteractions.delete(this._activeInteraction);
        this._activeInteraction = null;
    }
}

// Wheel input
checkInputs() {
    const interaction = { type: InteractionType.Zoom, source: InputSource.Wheel };
    if (this.camera.movement.canPerform(interaction)) {
        const handler = this.camera.movement.getHandler(InteractionType.Zoom);
        handler?.zoomByDelta(this._wheelDeltaY, cursorX, cursorY);
    }
    super.checkInputs();
}
```

### What it replaces
- `allowZoomWhilePointerRotating` on wheel input
- `multiTouchPanAndZoom` on pointer input
- `if (this.isDragging || this.rotationAccumulatedPixels.lengthSquared() > Epsilon)` in movement class
- Any input reaching into a sibling via `this.camera.inputs.attached["..."]`

### Key design decision: gesture state, not frame deltas

The current code checks `rotationAccumulatedPixels.lengthSquared() > Epsilon` per frame. If a user holds right-click but pauses mouse motion, the delta goes to zero and zoom re-enables mid-gesture. `activeInteractions` tracks button-down/button-up state, which correctly represents "the user is in a rotation gesture" regardless of per-frame motion.

---

## Layer 3: Interaction Handlers

Defines what each interaction actually does to the camera. Each interaction type has its own typed handler interface, because different interactions have fundamentally different data shapes (pan takes screen coords, zoom is scalar, flyTo is async).

### Typed handler interfaces

```ts
interface PanHandler {
    /** Begin a pan gesture at screen position */
    start(screenX: number, screenY: number): void;
    /** Continue panning to new screen position */
    update(screenX: number, screenY: number): void;
    /** End the pan gesture */
    stop(): void;
}

interface RotateHandler {
    /** Apply rotation from pixel deltas */
    update(deltaX: number, deltaY: number): void;
}

interface ZoomHandler {
    /** Zoom by a scroll/pinch delta, optionally toward a screen position */
    zoomByDelta(delta: number, cursorScreenX?: number, cursorScreenY?: number): void;
    /** Zoom toward a specific world point by a distance */
    zoomToPoint(point: Vector3, distance: number): void;
}

interface FlyToHandler {
    /** Animate the camera to a target point */
    flyTo(target: Vector3): Promise<void>;
}
```

### Type-safe registry

```ts
/** Maps interaction types to their typed handler interfaces */
interface InteractionHandlerMap {
    [InteractionType.Pan]: PanHandler;
    [InteractionType.Rotate]: RotateHandler;
    [InteractionType.Zoom]: ZoomHandler;
    [InteractionType.FlyTo]: FlyToHandler;
}

class CameraMovement {
    private _handlers = new Map<InteractionType, unknown>();

    public setHandler<K extends InteractionType>(
        interaction: K,
        handler: InteractionHandlerMap[K]
    ): void {
        this._handlers.set(interaction, handler);
    }

    public getHandler<K extends InteractionType>(
        interaction: K
    ): InteractionHandlerMap[K] | undefined {
        return this._handlers.get(interaction) as InteractionHandlerMap[K] | undefined;
    }
}
```

### Handlers are keyed by InteractionType only (not source)

A `PanHandler` doesn't care whether the pan was triggered by a mouse drag or a keyboard arrow press — it just knows how to pan the camera. The source distinction is handled entirely by the input mapping and conflict matrix layers.

### Default handlers (geospatial camera)

```ts
camera.movement.setHandler(InteractionType.Pan, new GlobeDragHandler(camera));
camera.movement.setHandler(InteractionType.Rotate, new TiltHandler(camera));
camera.movement.setHandler(InteractionType.Zoom, new ZoomToPointHandler(camera));
camera.movement.setHandler(InteractionType.FlyTo, new FlyToPointHandler(camera));
```

### How inputs call handlers

Inputs know the physical shape of their data and call the appropriate handler method:

```ts
// Pointer input — pan gesture
onButtonDown(evt) {
    const type = this.camera.inputMapping({ device: InputSource.Pointer, button: evt.button, ... });
    if (type === InteractionType.Pan) {
        this.camera.movement.getHandler(InteractionType.Pan)?.start(scene.pointerX, scene.pointerY);
    }
}

onTouch(point, offsetX, offsetY) {
    if (this._activeType === InteractionType.Pan) {
        this.camera.movement.getHandler(InteractionType.Pan)?.update(scene.pointerX, scene.pointerY);
    } else if (this._activeType === InteractionType.Rotate) {
        this.camera.movement.getHandler(InteractionType.Rotate)?.update(offsetX, offsetY);
    }
}

onButtonUp(evt) {
    if (this._activeType === InteractionType.Pan) {
        this.camera.movement.getHandler(InteractionType.Pan)?.stop();
    }
}

// Double-tap — flyTo
onDoubleTap() {
    const pickResult = scene.pick(scene.pointerX, scene.pointerY);
    if (pickResult.pickedPoint) {
        this.camera.movement.getHandler(InteractionType.FlyTo)?.flyTo(pickResult.pickedPoint);
    }
}
```

### User override (custom mechanics)

```ts
// "I want right-click to orbit around the picked point, not the camera target"
camera.movement.setHandler(InteractionType.Rotate, new OrbitAroundPickPointHandler(camera));
// Input mapping and conflict matrix unchanged
```

```ts
// "I want pan to have inertia"
camera.movement.setHandler(InteractionType.Pan, new InertiaPanHandler(camera));
// Same PanHandler interface, different implementation
```

### What it replaces
- Hardcoded `handleDrag()`, `handleZoom()`, `_handleTilt()` scattered across input classes
- Movement logic that's split between inputs and the movement class

---

## Relationship to Existing Behavior\<Camera\> System

The existing `Behavior<T>` system is **unchanged and complementary**. Behaviors attach to cameras via `addBehavior()`, run after `onAfterCheckInputsObservable`, and apply secondary effects (auto-rotate when idle, bounce at limits, frame a mesh, adjust clip planes).

The three-layer system runs *before* behaviors — it produces the core camera movement that behaviors then react to.

Existing behaviors may benefit from the conflict matrix:
```ts
// AutoRotationBehavior currently tracks pointer events independently to detect idle.
// With activeInteractions, it could simply check:
if (movement.activeInteractions.size === 0) {
    // No user interaction — start auto-rotate countdown
}
```

---

## Migration Examples

### Example 1: PR #18150 (wheel zoom during pointer rotation)

**Before (PR approach):** New `allowZoomWhilePointerRotating` boolean on wheel input + wheel input queries pointer input via `this.camera.inputs.attached["pointers"]` string-keyed lookup + cast.

**After:** Remove one source-specific entry from the conflict matrix.
```ts
camera.movement.interactionConflicts = [
    { a: { type: Pan },    b: { type: Zoom } },
    { a: { type: Rotate, source: Touch },  b: { type: Zoom, source: Touch } },
    // pointer-rotate ↔ wheel-zoom conflict was here, now removed
];
```

### Example 2: Forum thread (swap pan/rotate for ArcRotateCamera)

**Before:** Modify `attachControl()` signature, add `CtrlKeyBehaviours` enum.

**After:** Override the input mapping function.
```ts
camera.inputMapping = (ctx) => {
    if (ctx.device === InputSource.Keyboard) {
        return ctx.modifiers.ctrl ? InteractionType.Rotate : InteractionType.Pan;
    }
    return arcRotateDefault(ctx);
};
```

### Example 3: Map-style navigation

**Before:** Subclass pointer input, override `onButtonDown`/`onTouch`.

**After:** Override the input mapping function.
```ts
camera.inputMapping = (ctx) => {
    if (ctx.device === InputSource.Pointer && ctx.button === 0) return InteractionType.Pan;
    if (ctx.device === InputSource.Pointer && ctx.button === 2) return InteractionType.Rotate;
    return defaultMapping(ctx);
};
```

### Example 4: Custom orbit-around-pick-point

**Before:** Subclass input class, override movement methods.

**After:** Swap one interaction handler (type-safe).
```ts
camera.movement.setHandler(InteractionType.Rotate, new OrbitAroundPickPointHandler(camera));
```

### Example 5: Allow multitouch pan + zoom on orbit camera

**Before:** Set `multiTouchPanAndZoom = true` on pointer input.

**After:** Remove the touch-pan ↔ touch-zoom conflict entry.

---

## Implementation Staging

The three layers are independent and can be shipped incrementally.

### Phase 1: Conflict Matrix (smallest, unblocks PR #18150)

**Scope:** Movement class gets `activeInteractions`, `interactionConflicts`, `canPerform()` with source-aware matching. Existing inputs register/deregister gesture state. Movement class uses `canPerform()` instead of hardcoded conditionals.

**Changes:**
- `InteractionType` enum, `InputSource` enum, `ActiveInteraction` interface, `InteractionPattern` interface, `InteractionConflict` interface (new file)
- `CameraMovement` / `GeospatialCameraMovement`: add `activeInteractions`, `interactionConflicts`, `canPerform()`, `_matches()`
- `GeospatialCameraPointersInput`: register/deregister interactions on button down/up/lost-focus
- `GeospatialCameraMouseWheelInput`: check `canPerform({ type: Zoom, source: Wheel })` before applying
- Remove `rotationAccumulatedPixels.lengthSquared() > Epsilon` check from movement class

**Backward compat:** Fully backward compatible. New API is additive. Default conflict list preserves current behavior.

### Phase 2: Input Mapping (addresses forum thread, post-9.0)

**Scope:** Extract gesture→interaction mapping from hardcoded switch statements into a configurable function. Each camera type provides a default.

**Changes:**
- `InputContext` interface, `InputMappingFunction` type (new)
- Camera base class or movement class gets `inputMapping` property
- Refactor existing input classes to call mapping function instead of hardcoding button→action
- Deprecate `useCtrlForPanning` on `attachControl()`

**Backward compat:** Default mapping functions reproduce current behavior. `useCtrlForPanning` sets the mapping function internally during deprecation period.

### Phase 3: Interaction Handlers (largest refactor)

**Scope:** Extract movement logic from input classes and movement class into pluggable, typed, per-interaction handlers.

**Changes:**
- Typed handler interfaces: `PanHandler`, `RotateHandler`, `ZoomHandler`, `FlyToHandler` (new)
- `InteractionHandlerMap` type mapping, type-safe `setHandler()` / `getHandler()` on movement class
- Concrete handlers extracted from existing code (`GlobeDragHandler`, `TiltHandler`, `ZoomToPointHandler`, etc.)
- Movement class becomes a thin coordinator: routes interactions to handlers, manages state
- Input classes become thin: map events, register gestures, call typed handler methods

**Backward compat:** Internal refactor. Public API surface of inputs and movement class preserved via delegation.

---

## Open Questions

1. **Where does the mapping function live?** On the camera, on the movement class, or on the inputs manager?

2. **Multi-touch classification:** Two-finger gestures can be pinch (zoom) or pan (rotate) depending on finger movement. This classification currently happens inside the pointer input. Does it move to the mapping layer or stay in the input?

3. **Backward compatibility for `multiTouchPanAndZoom`:** This flag on `OrbitCameraPointersInput` controls both the mapping (two-finger = pan+zoom vs pan-only) and the conflict (can they coexist). In the new model these are separate layers. Migration path needs care.

4. **Extensibility of InteractionHandlerMap:** If a camera type adds a new `InteractionType`, how does it extend the handler map type? Module augmentation, or a more open-ended registry?

5. **Conflict matrix mutability:** Should the conflict list be mutable at runtime (e.g. toggling a conflict during a session), or set once at init? If mutable, do we need eviction of active interactions that become conflicted?
