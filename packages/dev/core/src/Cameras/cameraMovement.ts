import { type Scene } from "../scene";
import { Vector3 } from "../Maths/math.vector";
import { type InterpolatingBehavior } from "../Behaviors/Cameras/interpolatingBehavior";

const DefaultReferenceFrameRate = 60;
/**
 * Base class for camera movement systems that convert raw input into framerate-independent camera deltas.
 *
 * This class handles the physics layer: velocity tracking, inertial decay, speed multipliers,
 * and per-frame delta computation. Input mapping (which physical inputs trigger which interactions)
 * is handled by an `InputMapper` instance composed on each movement subclass as `input`.
 *
 * **Speed and inertia** — Properties on this class that control how accumulated pixel deltas
 * are converted to framerate-independent camera deltas via `computeCurrentFrameDeltas()`:
 * - `panSpeed`, `rotationXSpeed`, `rotationYSpeed`, `zoomSpeed` — units of movement per pixel
 * - `panInertia`, `rotationInertia`, `zoomInertia` — velocity decay factor when input stops (0 = instant stop, 0.9 = smooth glide)
 */
export class CameraMovement {
    protected _scene: Scene;

    /**
     * Should be set by input classes to indicate whether there is active input this frame.
     * This helps differentiate between 0 pixel delta due to no input vs user actively holding still.
     */
    public activeInput: boolean = false;

    /**
     * ------------ Speed ----------------
     * Speed defines the amount of camera movement expected per input pixel movement
     * -----------------------------------
     */
    /**
     * Global speed multiplier applied to all movement (pan, rotation, zoom).
     * Acts as a master scale factor on top of the individual speed properties.
     */
    public speed: number = 1;
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
     * Higher inertia === slower decay, velocity retains more of its value each frame.
     *
     * Note: ArcRotateCamera syncs this from `camera.inertia` via an accessor on the camera class.
     * To tune independently, override inside `scene.onBeforeRenderObservable` after `camera.inertia` is read.
     */
    public zoomInertia: number = 0.9;
    /**
     * Inertia applied to the panning velocity when there is no user input.
     * Higher inertia === slower decay, velocity retains more of its value each frame.
     *
     * Note: ArcRotateCamera overrides this from `camera.panningInertia` (which defaults to `camera.inertia`).
     */
    public panInertia: number = 0.9;
    /**
     * Inertia applied to the rotation velocity when there is no user input.
     * Higher inertia === slower decay, velocity retains more of its value each frame.
     *
     * Note: ArcRotateCamera syncs this from `camera.inertia` via an accessor on the camera class.
     * To tune independently, override inside `scene.onBeforeRenderObservable` after `camera.inertia` is read.
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
     * Framerate (Hz) at which inertia values are calibrated. Default 60 matches legacy camera feel
     * at any actual refresh rate. Override to 120, 144, etc. only if your app was tuned on that
     * specific refresh rate under the legacy (framerate-dependent) camera math and you want to
     * preserve that exact decay characteristic. Most applications should leave this at 60.
     */
    public referenceFrameRate: number = DefaultReferenceFrameRate;

    /**
     * Rotation velocity used for inertia calculations (movement / time)
     */
    private _rotationVelocity: Vector3 = new Vector3();

    /**
     * Used when calculating inertial decay. Default to 60fps
     */
    private _prevFrameTimeMs: number = 1000 / DefaultReferenceFrameRate;

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
        // Use prevFrameTime as fallback when deltaTime is 0 (e.g. first render frame in tests or unusual conditions)
        const effectiveDeltaMs = deltaTimeMs > 0 ? deltaTimeMs : this._prevFrameTimeMs;

        // Fast-path: when nothing is moving (no accumulated input, all velocities zero), skip all work.
        if (
            this._zoomVelocity === 0 &&
            this.zoomAccumulatedPixels === 0 &&
            this._panVelocity.x === 0 &&
            this._panVelocity.y === 0 &&
            this._panVelocity.z === 0 &&
            this.panAccumulatedPixels.x === 0 &&
            this.panAccumulatedPixels.y === 0 &&
            this.panAccumulatedPixels.z === 0 &&
            this._rotationVelocity.x === 0 &&
            this._rotationVelocity.y === 0 &&
            this._rotationVelocity.z === 0 &&
            this.rotationAccumulatedPixels.x === 0 &&
            this.rotationAccumulatedPixels.y === 0 &&
            this.rotationAccumulatedPixels.z === 0 &&
            !this.activeInput
        ) {
            this.panDeltaCurrentFrame.setAll(0);
            this.rotationDeltaCurrentFrame.setAll(0);
            this.zoomDeltaCurrentFrame = 0;
            if (deltaTimeMs > 0) {
                this._prevFrameTimeMs = deltaTimeMs;
            }
            return;
        }

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
        this._panVelocity.scaleToRef(this.speed * this.panSpeed * this._panSpeedMultiplier * effectiveDeltaMs, this.panDeltaCurrentFrame);

        this._rotationVelocity.copyFromFloats(
            this._calculateCurrentVelocity(this._rotationVelocity.x, this.rotationAccumulatedPixels.x, this.rotationInertia),
            this._calculateCurrentVelocity(this._rotationVelocity.y, this.rotationAccumulatedPixels.y, this.rotationInertia),
            this._calculateCurrentVelocity(this._rotationVelocity.z, this.rotationAccumulatedPixels.z, this.rotationInertia)
        );
        this.rotationDeltaCurrentFrame.copyFromFloats(
            this._rotationVelocity.x * this.speed * this.rotationXSpeed * effectiveDeltaMs,
            this._rotationVelocity.y * this.speed * this.rotationYSpeed * effectiveDeltaMs,
            // z is not used by current handlers; keep at 0. Add a rotationZSpeed if z motion is wired up later.
            0
        );

        this._zoomVelocity = this._calculateCurrentVelocity(this._zoomVelocity, this.zoomAccumulatedPixels, this.zoomInertia);
        this.zoomDeltaCurrentFrame = this._zoomVelocity * (this.speed * this.zoomSpeed * this._zoomSpeedMultiplier) * effectiveDeltaMs;

        if (deltaTimeMs > 0) {
            this._prevFrameTimeMs = deltaTimeMs;
        }
        this.zoomAccumulatedPixels = 0;
        this.panAccumulatedPixels.setAll(0);
        this.rotationAccumulatedPixels.setAll(0);
        this.activeInput = false;
    }

    /**
     * Resets the rotation velocity and accumulated pixels, stopping any in-progress rotation inertia.
     * Called when inertialAlphaOffset or inertialBetaOffset are explicitly zeroed (backward compat).
     */
    public resetRotationVelocity(): void {
        this._rotationVelocity.setAll(0);
        this.rotationAccumulatedPixels.setAll(0);
    }

    /**
     * Resets the pan velocity and accumulated pixels, stopping any in-progress pan inertia.
     */
    public resetPanVelocity(): void {
        this._panVelocity.setAll(0);
        this.panAccumulatedPixels.setAll(0);
    }

    /**
     * Resets the zoom velocity and accumulated pixels, stopping any in-progress zoom inertia.
     * Called when inertialRadiusOffset is explicitly zeroed out (backward compat).
     */
    public resetZoomVelocity(): void {
        this._zoomVelocity = 0;
        this.zoomAccumulatedPixels = 0;
    }

    /**
     * Returns true when the camera is playing an interpolating (fly-to) animation.
     * Useful for suppressing user-input movement while a programmatic animation is active.
     */
    public get isInterpolating(): boolean {
        return !!this._behavior?.isInterpolating;
    }

    /**
     * Returns the per-frame decay factor for a given inertia, adjusted to this frame's `dt`.
     * At the reference frame rate, returns `inertia` unchanged (matches legacy per-frame `*= inertia`).
     * Use this when implementing custom decaying accumulators (e.g. zoom-to-cursor coupled pan)
     * that need framerate-independent glide duration.
     * @param inertia - The inertia value (0-1) whose per-frame decay factor is needed.
     * @returns The decay factor to multiply a value by this frame.
     */
    public getFrameIndependentDecay(inertia: number): number {
        const dt = this._scene.getEngine().getDeltaTime();
        const effectiveDt = dt > 0 ? dt : this._prevFrameTimeMs;
        const referenceFrameDurationMs = 1000 / this.referenceFrameRate;
        return Math.pow(inertia, effectiveDt / referenceFrameDurationMs);
    }

    /**
     * Returns the input-scale factor to apply to an impulse injected into a decaying accumulator
     * so that the integrated total is framerate-independent and matches legacy at 60fps.
     * At the reference frame rate, returns 1 (no-op). At high fps, scales the impulse down so
     * the sum over the decay tail stays equal to `impulse / (1 - inertia)` — the legacy total.
     * @param inertia - The inertia value (0-1) used by the accumulator.
     * @returns The scaling factor to multiply an impulse by before adding it to the accumulator.
     */
    public getFrameIndependentInputScale(inertia: number): number {
        const oneMinusInertia = 1 - inertia;
        if (oneMinusInertia <= 0) {
            return 1;
        }
        const decay = this.getFrameIndependentDecay(inertia);
        return (1 - decay) / oneMinusInertia;
    }

    private _calculateCurrentVelocity(velocityRef: number, pixelDelta: number, inertialDecayFactor: number): number {
        let inputVelocity = velocityRef;
        const deltaTimeMs = this._scene.getEngine().getDeltaTime();
        // Use prevFrameTime as fallback when deltaTime is 0 (e.g. first render frame in tests or unusual conditions)
        const effectiveDeltaMs = deltaTimeMs > 0 ? deltaTimeMs : this._prevFrameTimeMs;

        if (effectiveDeltaMs === 0) {
            return inputVelocity;
        }

        // Apply inertial decay every frame
        const frameIndependentDecay = this.getFrameIndependentDecay(inertialDecayFactor);
        inputVelocity *= frameIndependentDecay;

        // When there's input this frame, add it on top of the decayed velocity — matches legacy's
        // `offset += pointerDelta` accumulation. The `inputScale` factor keeps the sustained-drag
        // steady-state identical to legacy at the reference framerate (`R/(1-inertia)`) at any
        // actual framerate. Without this factor, `v_ss = R/(1-pow(k, dt/T))` blows up at high fps
        // (2.3x at 144fps). When running at the reference framerate, inputScale = 1 (no-op).
        if (pixelDelta !== 0 || this.activeInput) {
            const oneMinusInertia = 1 - inertialDecayFactor;
            const inputScale = oneMinusInertia > 0 ? (1 - frameIndependentDecay) / oneMinusInertia : 1;
            inputVelocity += (pixelDelta / effectiveDeltaMs) * inputScale;
        } else if (Math.abs(inputVelocity) < 1e-6) {
            // Epsilon cutoff when gliding with no input
            inputVelocity = 0;
        }

        return inputVelocity;
    }
}
