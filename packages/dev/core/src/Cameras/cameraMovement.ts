import type { Scene } from "../scene";
import { Vector3 } from "../Maths/math.vector";
import { Epsilon } from "../Maths/math.constants";
import type { InterpolatingBehavior } from "../Behaviors/Cameras/interpolatingBehavior";

const FrameDurationAt60FPS = 1000 / 60;
/**
 * Holds all logic related to converting input pixel deltas into current frame deltas, taking speed / framerate into account
 * to ensure smooth frame-rate-independent movement
 */
export class CameraMovement {
    protected _scene: Scene;

    /**
     * Should be set by input classes to indicates whether there is active input this frame
     * This helps us differentiate between 0 pixel delta due to no input vs user actively holding still
     */
    public activeInput: boolean = false;

    /**
     * ------------ Speed ----------------
     * Speed defines the amount of camera movement expected per input pixel movement
     * -----------------------------------
     */
    /**
     * Desired coordinate unit movement per input pixel when zooming
     */
    public zoomSpeed: number = 1;
    /**
     * Desired coordinate unit movement per input pixel when panning
     */
    public panSpeed: number = 1;
    /**
     * Desired radians movement per input pixel when rotating along x axis
     */
    public rotationXSpeed: number = 1;
    /**
     * Desired radians movement per input pixel when rotating along y axis
     */
    public rotationYSpeed: number = 1;

    /**
     * ----------- Speed multipliers ---------------
     * Multipliers allow movement classes to modify the effective speed dynamically per-frame
     * (ex: scale zoom based on distance from target)
     * -----------------------------------
     */
    /**
     * Multiplied atop zoom speed. Used to dynamically adjust zoom speed based on per-frame context (ex: zoom faster when further from target)
     */
    protected _zoomSpeedMultiplier: number = 1;
    /**
     * Multiplied atop pan speed. Used to dynamically adjust pan speed based on per-frame context (ex: pan slowly when close to target)
     */
    protected _panSpeedMultiplier: number = 1;

    /**
     * ---------- Inertia ----------------
     * Inertia represents the decay factor per-frame applied to the velocity when there is no user input.
     * 0 = No inertia, instant stop (velocity immediately becomes 0)
     * 0.5 = Strong decay, velocity halves every frame at 60fps
     * 0.9 = Moderate inertia, velocity retains 90% per frame at 60fps
     * 0.95 = High inertia, smooth glide, velocity retains 95% per frame at 60fps
     * 1 = Infinite inertia, never stops (velocity never decays)
     * -----------------------------------
     */
    /**
     * Inertia applied to the zoom velocity when there is no user input.
     * Higher inertia === slower decay, velocity retains more of its value each frame
     */
    public zoomInertia: number = 0.9;
    /**
     * Inertia applied to the panning velocity when there is no user input.
     * Higher inertia === slower decay, velocity retains more of its value each frame
     */
    public panInertia: number = 0.9;
    /**
     * Inertia applied to the rotation velocity when there is no user input.
     * Higher inertia === slower decay, velocity retains more of its value each frame
     */
    public rotationInertia: number = 0.9;

    /**
     * ---------- Accumulated Pixel Deltas -----------
     * Pixel inputs accumulated throughout the frame by input classes (reset each frame after processing)
     * -----------------------------------
     */
    /**
     * Accumulated pixel delta (by input classes) for zoom this frame
     * Read by computeCurrentFrameDeltas() function and converted into zoomDeltaCurrentFrame (taking speed into account)
     * Reset to zero after each frame
     */
    public zoomAccumulatedPixels: number = 0;
    /**
     * Accumulated pixel delta (by input classes) for panning this frame
     * Read by computeCurrentFrameDeltas() function and converted into panDeltaCurrentFrame (taking speed into account)
     * Reset to zero after each frame
     */
    public panAccumulatedPixels: Vector3 = new Vector3();
    /**
     * Accumulated pixel delta (by input classes) for rotation this frame
     * Read by computeCurrentFrameDeltas() function and converted into rotationDeltaCurrentFrame (taking speed into account)
     * Reset to zero after each frame
     */
    public rotationAccumulatedPixels: Vector3 = new Vector3();

    /**
     * ---------- Current Frame Movement Deltas -----------
     * Deltas read on each frame by camera class in order to move the camera
     * -----------------------------------
     */
    /**
     * Zoom delta to apply to camera this frame, computed by computeCurrentFrameDeltas() from zoomPixelDelta (taking speed into account)
     */
    public zoomDeltaCurrentFrame: number = 0;
    /**
     * Pan delta to apply to camera this frame, computed by computeCurrentFrameDeltas() from panPixelDelta (taking speed into account)
     */
    public panDeltaCurrentFrame: Vector3 = Vector3.Zero();
    /**
     * Rotation delta to apply to camera this frame, computed by computeCurrentFrameDeltas() from rotationPixelDelta (taking speed into account)
     */
    public rotationDeltaCurrentFrame: Vector3 = Vector3.Zero();

    /**
     * ---------- Velocity -----------
     * Used to track velocity between frames for inertia calculation
     * -----------------------------------
     */
    /**
     * Zoom pixel velocity used for inertia calculations (pixels / ms).
     */
    protected _zoomVelocity: number = 0;
    /**
     * Pan velocity used for inertia calculations (movement / time)
     */
    private _panVelocity: Vector3 = new Vector3();
    /**
     * Rotation velocity used for inertia calculations (movement / time)
     */
    private _rotationVelocity: Vector3 = new Vector3();

    /**
     * Used when calculating inertial decay. Default to 60fps
     */
    private _prevFrameTimeMs: number = FrameDurationAt60FPS;

    constructor(
        scene: Scene,
        protected _cameraPosition: Vector3,
        protected _behavior?: InterpolatingBehavior
    ) {
        this._scene = scene;
    }

    /**
     * When called, will take the accumulated pixel deltas set by input classes and convert them into current frame deltas, stored in currentFrameMovementDelta properties
     * Takes speed, scaling, inertia, and framerate into account to ensure smooth movement
     * Zeros out pixelDeltas before returning
     */
    public computeCurrentFrameDeltas(): void {
        const deltaTimeMs = this._scene.getEngine().getDeltaTime();

        this.panDeltaCurrentFrame.setAll(0);
        this.rotationDeltaCurrentFrame.setAll(0);
        this.zoomDeltaCurrentFrame = 0;

        const hasUserInput = this.panAccumulatedPixels.lengthSquared() > 0 || this.rotationAccumulatedPixels.lengthSquared() > 0 || this.zoomAccumulatedPixels !== 0;

        if (hasUserInput && this._behavior?.isInterpolating) {
            this._behavior.stopAllAnimations();
        }

        this._panVelocity.copyFromFloats(
            this._calculateCurrentVelocity(this._panVelocity.x, this.panAccumulatedPixels.x, this.panInertia),
            this._calculateCurrentVelocity(this._panVelocity.y, this.panAccumulatedPixels.y, this.panInertia),
            this._calculateCurrentVelocity(this._panVelocity.z, this.panAccumulatedPixels.z, this.panInertia)
        );
        this._panVelocity.scaleToRef(this.panSpeed * this._panSpeedMultiplier * deltaTimeMs, this.panDeltaCurrentFrame);

        this._rotationVelocity.copyFromFloats(
            this._calculateCurrentVelocity(this._rotationVelocity.x, this.rotationAccumulatedPixels.x, this.rotationInertia),
            this._calculateCurrentVelocity(this._rotationVelocity.y, this.rotationAccumulatedPixels.y, this.rotationInertia),
            this._calculateCurrentVelocity(this._rotationVelocity.z, this.rotationAccumulatedPixels.z, this.rotationInertia)
        );
        this.rotationDeltaCurrentFrame.copyFromFloats(
            this._rotationVelocity.x * this.rotationXSpeed * deltaTimeMs,
            this._rotationVelocity.y * this.rotationYSpeed * deltaTimeMs,
            this._rotationVelocity.z * this.rotationYSpeed * deltaTimeMs
        );

        this._zoomVelocity = this._calculateCurrentVelocity(this._zoomVelocity, this.zoomAccumulatedPixels, this.zoomInertia);
        this.zoomDeltaCurrentFrame = this._zoomVelocity * (this.zoomSpeed * this._zoomSpeedMultiplier) * deltaTimeMs;

        this._prevFrameTimeMs = deltaTimeMs;
        this.zoomAccumulatedPixels = 0;
        this.panAccumulatedPixels.setAll(0);
        this.rotationAccumulatedPixels.setAll(0);
    }

    public get isInterpolating(): boolean {
        return !!this._behavior?.isInterpolating;
    }

    private _calculateCurrentVelocity(velocityRef: number, pixelDelta: number, inertialDecayFactor: number): number {
        let inputVelocity = velocityRef;
        const deltaTimeMs = this._scene.getEngine().getDeltaTime();

        // If we are actively receiving input or have accumulated some pixel delta since last frame, calculate inputVelocity (inertia doesn't kick in yet)
        if (pixelDelta !== 0 || this.activeInput) {
            inputVelocity = pixelDelta / deltaTimeMs;
        } else if (!this.activeInput && inputVelocity !== 0) {
            // If we are not receiving input and velocity isn't already zero, apply inertial decay to decelerate velocity
            const frameIndependentDecay = Math.pow(inertialDecayFactor, this._prevFrameTimeMs / FrameDurationAt60FPS);
            inputVelocity *= frameIndependentDecay;
            if (Math.abs(inputVelocity) <= Epsilon) {
                inputVelocity = 0;
            }
        }

        return inputVelocity;
    }
}
