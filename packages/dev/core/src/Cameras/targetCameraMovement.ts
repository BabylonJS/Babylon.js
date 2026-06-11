/** This file must only contain pure code and pure imports */

import { CameraMovement } from "./cameraMovement";
import { type Scene } from "../scene.pure";
import { type Vector3 } from "../Maths/math.vector.pure";
import { type InterpolatingBehavior } from "../Behaviors/Cameras/interpolatingBehavior";
import { type InputMapEntry, InputMapper } from "./inputMapper";

// ── TargetCamera handler types ─────────────────────────────────────

/**
 * Handler shape for target/free camera interactions.
 * Property names are the canonical interaction type strings used in inputMap entries.
 * All handlers are plain functions since none need multi-method lifecycle.
 */
export type TargetCameraHandlers = {
    /**
     * Translate the camera by world-space deltas (already oriented; the camera applies them directly).
     * Mirrors the legacy `cameraDirection` accumulation surface, which input classes populate after
     * transforming their local intent (e.g. keyboard strafe) into world space.
     */
    translate: (deltaX: number, deltaY: number, deltaZ: number) => void;
    /**
     * Rotate the camera by pitch/yaw deltas.
     * pitch rotates around the local X axis (look up/down), yaw around the local Y axis (look left/right).
     * Mirrors the legacy `cameraRotation` accumulation surface (x = pitch, y = yaw).
     */
    rotate: (pitch: number, yaw: number) => void;
};

/** Interaction type string for target/free camera, derived from handler property names */
export type TargetCameraInteraction = keyof TargetCameraHandlers;

/**
 * Shared movement system for {@link TargetCamera} and its subclasses (FreeCamera, FlyCamera,
 * FollowCamera). Provides framerate-independent physics (via {@link CameraMovement}) and a
 * declarative {@link InputMapper} for configuring which physical inputs trigger which interactions.
 *
 * Accumulator mapping for this camera family:
 * - `translate` feeds `panAccumulatedPixels` as a WORLD-space direction (input classes orient local
 *   intent into world space before populating it, mirroring the legacy `cameraDirection` surface).
 * - `rotate` feeds `rotationAccumulatedPixels` (x=pitch, y=yaw), mirroring legacy `cameraRotation`.
 *
 * These camera classes have no separate zoom channel: mouse-wheel input folds into translation/rotation
 * just like the legacy inputs, so there is no `zoom` interaction here.
 *
 * Input classes inject deltas using the same scaling they applied historically and the movement
 * system leaves all speed multipliers at 1, so at the reference framerate the per-frame applied
 * delta matches the legacy value exactly while inertial glide becomes framerate-independent.
 */
export class TargetCameraMovement extends CameraMovement {
    /** Input system that maps physical inputs to interactions and dispatches to handlers. */
    public readonly input: InputMapper<TargetCameraHandlers>;

    /**
     * Creates a movement system for the {@link TargetCamera} family.
     * @param scene The scene the owning camera belongs to.
     * @param cameraPosition The owning camera's position vector (shared by reference).
     * @param behavior Optional interpolating behavior used to suppress input while animating.
     */
    constructor(scene: Scene, cameraPosition: Vector3, behavior?: InterpolatingBehavior) {
        super(scene, cameraPosition, behavior);

        this.input = new InputMapper<TargetCameraHandlers>(
            {
                translate: (deltaX, deltaY, deltaZ) => {
                    this.panAccumulatedPixels.x += deltaX;
                    this.panAccumulatedPixels.y += deltaY;
                    this.panAccumulatedPixels.z += deltaZ;
                },
                rotate: (pitch, yaw) => {
                    this.rotationAccumulatedPixels.x += pitch;
                    this.rotationAccumulatedPixels.y += yaw;
                },
            },
            () => this._createDefaultInputMap()
        );
    }

    private _createDefaultInputMap(): InputMapEntry<TargetCameraInteraction>[] {
        // Default entries leave `sensitivity` unset so each input class falls back to its legacy
        // sensibility properties (`angularSensibility`, `rotationSpeed`, etc.) for backward
        // compatibility. Setting `sensitivity` on an entry overrides those properties.
        //
        // Keyboard direction (translate vs rotate, and which axis) is resolved inside
        // FreeCameraKeyboardMoveInput from its per-direction key lists (keysUp, keysRotateLeft, ...),
        // and mouse-wheel axis mapping lives on FreeCameraMouseWheelInput, so only the pointer-drag
        // mapping is declared here.
        return [
            // Mouse drag → look (any button; FreeCameraMouseInput gates on its own `buttons` list).
            { source: "pointer", interaction: "rotate" },
        ];
    }
}
