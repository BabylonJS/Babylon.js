import { CameraMovement } from "./cameraMovement";
import type { Scene } from "../scene";
import type { Vector3 } from "../Maths/math.vector";
import type { InterpolatingBehavior } from "../Behaviors/Cameras/interpolatingBehavior";
import type { ArcRotateCamera } from "./arcRotateCamera";
import { type InputMapEntry, InputMapper } from "./cameraInteractions";

// ── ArcRotate handler types ────────────────────────────────────────

/**
 * Handler shape for arc-rotate camera interactions.
 * Property names are the canonical interaction type strings used in inputMap entries.
 * All handlers are plain functions since none need multi-method lifecycle.
 */
export type ArcRotateHandlers = {
    /** Pan by pre-scaled pixel deltas */
    pan: (deltaX: number, deltaY: number) => void;
    /** Orbit by pre-scaled pixel deltas */
    rotate: (deltaX: number, deltaY: number) => void;
    /** Zoom by a pre-computed delta (already scaled by input) */
    zoom: (delta: number) => void;
};

/** Interaction type string for arc-rotate camera, derived from handler property names */
export type ArcRotateInteraction = keyof ArcRotateHandlers;

/**
 * Arc-rotate camera movement system that provides framerate-independent physics
 * and input mapping for pan, rotate, and zoom interactions.
 *
 * Default accumulator-based flow: input classes feed pixel deltas into the accumulators
 * (panAccumulatedPixels, rotationAccumulatedPixels, zoomAccumulatedPixels).
 * The base class's computeCurrentFrameDeltas() converts these to framerate-independent
 * deltas with proper inertia, which the camera reads each frame.
 */
export class ArcRotateCameraMovement extends CameraMovement {
    /** Input system that maps physical inputs to interactions and dispatches to handlers. */
    public readonly input: InputMapper<ArcRotateHandlers>;

    constructor(scene: Scene, cameraPosition: Vector3, behavior?: InterpolatingBehavior<ArcRotateCamera>) {
        super(scene, cameraPosition, behavior);

        this.input = new InputMapper<ArcRotateHandlers>(
            {
                pan: (deltaX, deltaY) => {
                    this.panAccumulatedPixels.x += deltaX;
                    this.panAccumulatedPixels.y += deltaY;
                },
                rotate: (deltaX, deltaY) => {
                    this.rotationAccumulatedPixels.x += deltaX;
                    this.rotationAccumulatedPixels.y += deltaY;
                },
                zoom: (delta) => {
                    this.zoomAccumulatedPixels += delta;
                },
            },
            () => this._createDefaultInputMap()
        );
    }

    private _createDefaultInputMap(): InputMapEntry<ArcRotateInteraction>[] {
        return [
            // ctrl+left-drag → pan (more specific than the bare rotate entry below; must come first so first-match-wins picks it).
            { source: "pointer", button: 0, modifiers: { ctrl: true }, interaction: "pan", sensitivity: 0.001 },
            { source: "pointer", button: 0, interaction: "rotate", sensitivity: 0.001 },
            { source: "pointer", button: 2, interaction: "pan", sensitivity: 0.001 },
            { source: "wheel", interaction: "zoom" },
            { source: "keyboard", key: [187, 107, 189, 109], interaction: "zoom", sensitivity: 0.04 }, // +/-/numpad+/numpad-
            { source: "keyboard", modifiers: { ctrl: true }, interaction: "pan", sensitivity: 0.02 },
            { source: "keyboard", modifiers: { alt: true }, interaction: "zoom", sensitivity: 0.04 },
            { source: "keyboard", interaction: "rotate", sensitivity: 0.01 },
        ];
    }
}
