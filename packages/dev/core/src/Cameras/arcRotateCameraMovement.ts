import { CameraMovement } from "./cameraMovement";
import type { Scene } from "../scene";
import type { Vector3 } from "../Maths/math.vector";
import type { InterpolatingBehavior } from "../Behaviors/Cameras/interpolatingBehavior";
import type { ArcRotateCamera } from "./arcRotateCamera";
import type { InputMapEntry } from "./cameraInteractions";

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
 * Arc-rotate camera movement system that extends the base movement with
 * the input mapping and handler pattern.
 *
 * Default handlers accumulate pixel deltas into the base class accumulators
 * (panAccumulatedPixels, rotationAccumulatedPixels, zoomAccumulatedPixels).
 * The base class's computeCurrentFrameDeltas() converts these to framerate-independent
 * deltas with proper inertia, which the camera reads each frame.
 */
export class ArcRotateCameraMovement extends CameraMovement {
    /**
     * Interaction handlers for arc-rotate camera.
     * Override individual handlers to customize camera behavior without changing input mapping.
     */
    public handlers: Partial<ArcRotateHandlers> = {};

    /**
     * Input-to-interaction mapping rules, constrained to valid arc-rotate interaction types.
     */
    public override inputMap: InputMapEntry<ArcRotateInteraction>[] = [];

    constructor(scene: Scene, cameraPosition: Vector3, behavior?: InterpolatingBehavior<ArcRotateCamera>) {
        super(scene, cameraPosition, behavior);

        this.handlers = {
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
        };

        this.inputMap = [
            { source: "pointer", button: 0, interaction: "rotate" },
            { source: "pointer", button: 2, interaction: "pan" },
            { source: "wheel", interaction: "zoom" },
            { source: "keyboard", modifiers: { ctrl: true }, interaction: "pan" },
            { source: "keyboard", modifiers: { alt: true }, interaction: "zoom" },
            { source: "keyboard", interaction: "rotate" },
        ];
    }
}
