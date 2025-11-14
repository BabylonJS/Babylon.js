import type { Scene } from "../scene";
import { Vector3 } from "../Maths/math.vector";
import { Epsilon } from "../Maths/math.constants";
import { Vector3FromFloatsToRef, Vector3LengthSquared, Vector3ScaleToRef } from "../Maths/math.vector.functions";
import type { InterpolatingBehavior } from "../Behaviors/Cameras/interpolatingBehavior";

/**
 * @experimental
 * This class is subject to change as geospatial camera evolves.
 *
 * It is intended to hold all logic related to converting input pixel deltas into current frame deltas, taking speed / framerate into account
 * to ensure smooth frame-rate-independent movement
 */
export class CameraMovement {
    protected _scene: Scene;

    // Can be set by input classes to indicate whether there is active input this frame
    // This helps us differentiate between 0 pixel delta due to no input vs user actively holding still
    public activeInput: boolean = false;

    // Speed multipliers (desired movement in scene coordinate space per input pixel)
    public panSpeed: number = 1;
    public rotationXSpeed: number = 1;
    public rotationYSpeed: number = 1;
    public zoomSpeed: number = 1;

    // Scaling lets you modify the effective speed based on some variable (e.g., distance from target)
    protected _zoomScaleFactor: number = 1;
    protected _panScaleFactor: number = 1;

    /**
     * Inertia represents the decay factor per-frame applied to the velocity when there is no user input.
     * 0 = No inertia, instant stop (velocity immediately becomes 0)
     * 0.5 = Strong decay, velocity halves every frame at 60fps
     * 0.9 = Moderate inertia, velocity retains 90% per frame at 60fps
     * 0.95 = High inertia, smooth glide, velocity retains 95% per frame at 60fps
     * 1 = Infinite inertia, never stops (velocity never decays)
     */
    public zoomInertia: number = 0.9;
    public panInertia: number = 0.9;
    public rotationInertia: number = 0.9;

    // Pixel inputs set by input classes (reset each frame after processing)
    public pixelDeltaTranslation: Vector3 = new Vector3();
    public pixelDeltaRotation: Vector3 = new Vector3();
    public pixelDeltaZoom: number = 0;

    // Deltas read on each frame by camera class in order to move the camera
    public currentFrameTranslationDelta: Vector3 = Vector3.Zero();
    public currentFrameRotationDelta: Vector3 = Vector3.Zero();
    public currentFrameZoomDelta: number = 0;

    // Used to track velocity between frames for inertia calculation
    private _translationVelocity: Vector3 = new Vector3();
    private _rotationVelocity: Vector3 = new Vector3();
    protected _zoomVelocity: number = 0;

    private _prevFrameTimeMs: number = 16.67; // Default to 60fps

    constructor(
        scene: Scene,
        protected _cameraPosition: Vector3,
        protected _behavior?: InterpolatingBehavior
    ) {
        this._scene = scene;
    }

    public computeCurrentFrameDeltas(): void {
        const deltaTimeMs = this._scene.getEngine().getDeltaTime();

        this.currentFrameTranslationDelta.setAll(0);
        this.currentFrameRotationDelta.setAll(0);
        this.currentFrameZoomDelta = 0;

        const hasUserInput = Vector3LengthSquared(this.pixelDeltaTranslation) > 0 || Vector3LengthSquared(this.pixelDeltaRotation) > 0 || this.pixelDeltaZoom !== 0;

        if (hasUserInput && this._behavior?.isInterpolating) {
            this._behavior.stopAllAnimations();
        }

        this._translationVelocity = Vector3FromFloatsToRef(
            this._calculateCurrentVelocity(this._translationVelocity.x, this.pixelDeltaTranslation.x, this.panSpeed * this._panScaleFactor, this.panInertia),
            this._calculateCurrentVelocity(this._translationVelocity.y, this.pixelDeltaTranslation.y, this.panSpeed * this._panScaleFactor, this.panInertia),
            this._calculateCurrentVelocity(this._translationVelocity.z, this.pixelDeltaTranslation.z, this.panSpeed * this._panScaleFactor, this.panInertia),
            this._translationVelocity
        );
        Vector3ScaleToRef(this._translationVelocity, deltaTimeMs, this.currentFrameTranslationDelta);
        this._rotationVelocity = Vector3FromFloatsToRef(
            this._calculateCurrentVelocity(this._rotationVelocity.x, this.pixelDeltaRotation.x, this.rotationXSpeed, this.rotationInertia),
            this._calculateCurrentVelocity(this._rotationVelocity.y, this.pixelDeltaRotation.y, this.rotationYSpeed, this.rotationInertia),
            this._calculateCurrentVelocity(this._rotationVelocity.z, this.pixelDeltaRotation.z, this.rotationYSpeed, this.rotationInertia),
            this._rotationVelocity
        );
        Vector3ScaleToRef(this._rotationVelocity, deltaTimeMs, this.currentFrameRotationDelta);

        this._zoomVelocity = this._calculateCurrentVelocity(this._zoomVelocity, this.pixelDeltaZoom, this.zoomSpeed * this._zoomScaleFactor, this.zoomInertia);
        this.currentFrameZoomDelta = this._zoomVelocity * deltaTimeMs;

        this._prevFrameTimeMs = deltaTimeMs;
        this.pixelDeltaZoom = 0;
        Vector3FromFloatsToRef(0, 0, 0, this.pixelDeltaTranslation);
        Vector3FromFloatsToRef(0, 0, 0, this.pixelDeltaRotation);
    }

    public get isInterpolating(): boolean {
        return !!this._behavior?.isInterpolating;
    }

    private _calculateCurrentVelocity(velocityRef: number, pixelDelta: number, speedFactor: number, inertialDecayFactor: number): number {
        let inputVelocity = velocityRef;
        const deltaTimeMs = this._scene.getEngine().getDeltaTime();

        // If we are actively recieving input or have accumulated some pixel delta since last frame, calculate inputVelocity (inertia doesn't kickin yet)
        if (pixelDelta !== 0 || this.activeInput) {
            const pixelsPerMs = pixelDelta / deltaTimeMs;
            inputVelocity = pixelsPerMs * speedFactor;
        } else if (!this.activeInput && inputVelocity !== 0) {
            // If we are not receiving input and velocity isn't already zero, apply inertial decay to decelerate velocity
            const frameDurationAt60FPS = 1000 / 60;
            const frameIndependentDecay = Math.pow(inertialDecayFactor, this._prevFrameTimeMs / frameDurationAt60FPS);
            inputVelocity *= frameIndependentDecay;

            if (Math.abs(inputVelocity) <= Epsilon) {
                inputVelocity = 0;
            }
        }

        return inputVelocity;
    }
}
