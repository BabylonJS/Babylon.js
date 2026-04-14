import { type Scene } from "../scene";
import { Vector3 } from "../Maths/math.vector";
import type { InputMapEntry, InputConditions, InputSource, InputModifiers } from "./cameraInteractions";
import { type InterpolatingBehavior } from "../Behaviors/Cameras/interpolatingBehavior";

const FrameDurationAt60FPS = 1000 / 60;
/**
 * Base class for camera movement systems that convert raw input into framerate-independent camera deltas.
 *
 * The movement system has three layers of configuration:
 *
 * **1. Input mapping (`inputMap`)** — Controls which physical inputs trigger which camera interactions.
 * Each entry maps a source (pointer, keyboard, wheel, touch) + optional conditions (button, modifiers, key)
 * to a semantic interaction type (pan, rotate, zoom). First matching entry wins; use `addEntry()` to
 * auto-insert based on specificity, or `getEntry()` to modify an existing entry.
 *
 * ```typescript
 * // Swap left-click rotate to pan
 * camera.movement.getEntry("pointer", "rotate")!.interaction = "pan";
 * camera.movement.getEntry("pointer", "pan")!.interaction = "rotate";
 *
 * // Add shift+drag to pan (auto-inserted before less-specific entries)
 * camera.movement.addEntry({ source: "pointer", button: 0, modifiers: { shift: true }, interaction: "pan", sensitivity: 0.002 });
 *
 * // Change sensitivity of pointer rotation
 * camera.movement.getEntry("pointer", "rotate")!.sensitivity = 0.005;
 *
 * // Map +/- keys to zoom
 * camera.movement.addEntry({ source: "keyboard", key: [187, 107, 189, 109], interaction: "zoom", sensitivity: 0.04 });
 * ```
 *
 * **2. Sensitivity (`sensitivity` on each inputMap entry)** — Multiplier applied to input deltas before
 * passing to the handler. Higher values = faster movement. Each entry can have its own sensitivity,
 * allowing different sensitivity for e.g. keyboard rotate vs pointer rotate. When `sensitivity` is
 * omitted from an entry, each input class uses its own built-in default for that interaction type.
 *
 * **3. Handlers** — Defined on camera-specific subclasses (e.g. `ArcRotateCameraMovement.handlers`).
 * Handlers receive pre-scaled deltas and accumulate them into pixel accumulators. Override individual
 * handlers to customize behavior without changing input mapping:
 *
 * ```typescript
 * const defaultRotate = camera.movement.handlers.rotate;
 * camera.movement.handlers.rotate = (dx, dy) => {
 *     console.log("rotate:", dx, dy);
 *     defaultRotate(dx, dy);
 * };
 * ```
 *
 * **4. Speed and inertia** — Properties on this base class that control how accumulated pixel deltas
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
     * Ordered list of input-to-interaction mapping rules. First matching entry wins.
     * Each entry maps a physical input source (+ optional conditions like button or modifier keys) to a semantic interaction type.
     *
     * Override this array to reconfigure which physical inputs trigger which camera interactions.
     * @example
     * ```ts
     * // Map-style navigation: left-click pans, right-click rotates
     * camera.movement.inputMap = [
     *     { source: "pointer", button: 0, interaction: "pan" },
     *     { source: "pointer", button: 2, interaction: "rotate" },
     *     { source: "wheel",              interaction: "zoom" },
     * ];
     * ```
     */
    public inputMap: InputMapEntry[] = [];

    /**
     * Resolves a physical input event to a matching inputMap entry.
     * When multiple entries match, the most specific one wins (counted by number of conditions).
     * Among equally specific entries, the first one in the array wins.
     * Returns the matched entry, or null if no entry matches.
     * @param source - The physical input source (e.g. "pointer", "keyboard")
     * @param currentConditions - Conditions to match against, specific to the source type
     * @returns The matched InputMapEntry, or null if no entry matches
     */
    public resolveInteraction(source: InputSource, currentConditions?: InputConditions): InputMapEntry | null {
        for (const entry of this.inputMap) {
            if (entry.source === source && this._entryMatches(entry, currentConditions)) {
                return entry;
            }
        }
        return null;
    }

    private _entryMatches(entry: InputMapEntry, currentConditions?: InputConditions): boolean {
        switch (entry.source) {
            case "pointer":
                if (entry.button !== undefined && entry.button !== currentConditions?.button) {
                    return false;
                }
                return this._matchModifiers(entry.modifiers, currentConditions?.modifiers);
            case "wheel":
                return this._matchModifiers(entry.modifiers, currentConditions?.modifiers);
            case "touch":
                if (entry.touchCount !== undefined && entry.touchCount !== currentConditions?.touchCount) {
                    return false;
                }
                return true;
            case "keyboard":
                if (entry.key !== undefined) {
                    if (Array.isArray(entry.key) ? entry.key.indexOf(currentConditions?.key ?? -1) === -1 : entry.key !== currentConditions?.key) {
                        return false;
                    }
                }
                return this._matchModifiers(entry.modifiers, currentConditions?.modifiers);
        }
    }

    /**
     * Restores the inputMap to the default configuration for this camera type.
     * The base class resets to an empty array. Subclasses override this to restore
     * their camera-specific default mappings.
     */
    public resetInputMap(): void {
        this.inputMap = [];
    }

    /**
     * Finds the first inputMap entry matching the given source and interaction.
     * Useful for modifying entry properties (e.g. sensitivity) without rebuilding the entire inputMap.
     * @param source - The physical input source to match
     * @param interaction - The interaction type to match
     * @returns The matching entry, or undefined if not found
     */
    public getEntry(source: InputSource, interaction: string): InputMapEntry | undefined {
        return this.inputMap.find((e) => e.source === source && e.interaction === interaction);
    }

    /**
     * Adds an entry to the inputMap at the correct position based on specificity.
     * More specific entries (with more conditions like button, key, modifiers) are placed
     * before less specific ones, ensuring they match first. Among equally specific entries,
     * the new entry is placed after existing ones.
     * @param entry - The entry to add
     */
    public addEntry(entry: InputMapEntry): void {
        const score = this._entrySpecificity(entry);
        let insertIndex = this.inputMap.length;
        for (let i = 0; i < this.inputMap.length; i++) {
            if (this._entrySpecificity(this.inputMap[i]) < score) {
                insertIndex = i;
                break;
            }
        }
        this.inputMap.splice(insertIndex, 0, entry);
    }

    private _entrySpecificity(entry: InputMapEntry): number {
        let score = 0;
        if ("button" in entry && entry.button !== undefined) {
            score++;
        }
        if ("key" in entry && entry.key !== undefined) {
            score++;
        }
        if ("touchCount" in entry && entry.touchCount !== undefined) {
            score++;
        }
        if ("modifiers" in entry && entry.modifiers) {
            score++;
        }
        return score;
    }

    private _matchModifiers(entryModifiers?: InputModifiers, currentModifiers?: InputModifiers): boolean {
        if (!entryModifiers) {
            return true;
        }
        if (entryModifiers.ctrl !== undefined && entryModifiers.ctrl !== (currentModifiers?.ctrl ?? false)) {
            return false;
        }
        if (entryModifiers.shift !== undefined && entryModifiers.shift !== (currentModifiers?.shift ?? false)) {
            return false;
        }
        if (entryModifiers.alt !== undefined && entryModifiers.alt !== (currentModifiers?.alt ?? false)) {
            return false;
        }
        return true;
    }

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
        this._panVelocity.scaleToRef(this.speed * this.panSpeed * this._panSpeedMultiplier * deltaTimeMs, this.panDeltaCurrentFrame);

        this._rotationVelocity.copyFromFloats(
            this._calculateCurrentVelocity(this._rotationVelocity.x, this.rotationAccumulatedPixels.x, this.rotationInertia),
            this._calculateCurrentVelocity(this._rotationVelocity.y, this.rotationAccumulatedPixels.y, this.rotationInertia),
            this._calculateCurrentVelocity(this._rotationVelocity.z, this.rotationAccumulatedPixels.z, this.rotationInertia)
        );
        this.rotationDeltaCurrentFrame.copyFromFloats(
            this._rotationVelocity.x * this.speed * this.rotationXSpeed * deltaTimeMs,
            this._rotationVelocity.y * this.speed * this.rotationYSpeed * deltaTimeMs,
            this._rotationVelocity.z * this.speed * this.rotationYSpeed * deltaTimeMs
        );

        this._zoomVelocity = this._calculateCurrentVelocity(this._zoomVelocity, this.zoomAccumulatedPixels, this.zoomInertia);
        this.zoomDeltaCurrentFrame = this._zoomVelocity * (this.speed * this.zoomSpeed * this._zoomSpeedMultiplier) * deltaTimeMs;

        this._prevFrameTimeMs = deltaTimeMs;
        this.zoomAccumulatedPixels = 0;
        this.panAccumulatedPixels.setAll(0);
        this.rotationAccumulatedPixels.setAll(0);
        this.activeInput = false;
    }

    public get isInterpolating(): boolean {
        return !!this._behavior?.isInterpolating;
    }

    private _calculateCurrentVelocity(velocityRef: number, pixelDelta: number, inertialDecayFactor: number): number {
        let inputVelocity = velocityRef;
        const deltaTimeMs = this._scene.getEngine().getDeltaTime();

        if (deltaTimeMs === 0) {
            return inputVelocity;
        }

        // If we are actively receiving input or have accumulated some pixel delta since last frame, calculate inputVelocity (inertia doesn't kick in yet)
        if (pixelDelta !== 0 || this.activeInput) {
            inputVelocity = pixelDelta / deltaTimeMs;
        } else if (!this.activeInput && inputVelocity !== 0) {
            // If we are not receiving input and velocity isn't already zero, apply inertial decay to decelerate velocity
            const frameIndependentDecay = Math.pow(inertialDecayFactor, this._prevFrameTimeMs / FrameDurationAt60FPS);
            inputVelocity *= frameIndependentDecay;
            if (Math.abs(inputVelocity) < 1e-6) {
                inputVelocity = 0;
            }
        }

        return inputVelocity;
    }
}
