import { type Behavior } from "../behavior";
import { CubicEase, EasingFunction } from "../../Animations/easing";
import { type Nullable } from "../../types";
import { type Animatable } from "../../Animations/animatable.core";
import { Animation } from "../../Animations/animation.pure";
import { type Camera } from "../../Cameras/camera";
import { type IColor3Like, type IColor4Like, type IMatrixLike, type IQuaternionLike, type IVector2Like, type IVector3Like } from "../../Maths/math.like";

export type AllowedAnimValue = number | IVector2Like | IVector3Like | IQuaternionLike | IMatrixLike | IColor3Like | IColor4Like | SizeLike | undefined;

/**
 * Animate camera property changes with an interpolation effect
 * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors/cameraBehaviors
 */
export class InterpolatingBehavior<C extends Camera = Camera> implements Behavior<C> {
    /**
     * Gets the name of the behavior.
     */
    public get name(): string {
        return "Interpolating";
    }

    /**
     * The easing function to use for interpolation
     */
    public easingFunction: EasingFunction = new CubicEase();

    /**
     * The easing mode (default is EASINGMODE_EASEINOUT)
     */
    public easingMode = EasingFunction.EASINGMODE_EASEINOUT;

    /**
     * Duration of the animation in milliseconds
     */
    public transitionDuration = 450;

    /**
     * Attached node of this behavior
     */
    public get attachedNode(): Nullable<C> {
        return this._attachedCamera;
    }

    private _attachedCamera: Nullable<C> = null;
    private _animatables: Map<string, Animatable> = new Map<string, Animatable>();
    private _promiseResolve?: () => void;

    // Frame rate used for all generated transition animations. Kept as a single constant so the duration
    // math in remainingDurationMs stays consistent with the animations created in animatePropertiesAsync.
    private static readonly _FrameRate = 60;

    /**
     * Initializes the behavior
     */
    constructor() {
        this.easingFunction.setEasingMode(this.easingMode);
    }

    /**
     * Initializes the behavior
     */
    public init(): void {
        // Nothing to do on init
    }

    /**
     * Attaches the behavior to a camera
     * @param camera The camera to attach to
     */
    public attach(camera: C): void {
        this._attachedCamera = camera;
    }

    /**
     * Detaches the behavior from the camera
     */
    public detach(): void {
        if (!this._attachedCamera) {
            return;
        }

        this.stopAllAnimations();
        this._attachedCamera = null;
    }

    public get isInterpolating(): boolean {
        return this._animatables.size > 0;
    }

    /**
     * Gets the longest remaining duration (in milliseconds) across all in-flight property animations.
     * Returns 0 when nothing is currently animating.
     */
    public get remainingDurationMs(): number {
        let remaining = 0;
        this._animatables.forEach((animatable) => {
            const remainingFrames = Math.max(animatable.toFrame - animatable.masterFrame, 0);
            remaining = Math.max(remaining, (remainingFrames / InterpolatingBehavior._FrameRate) * 1000);
        });
        return remaining;
    }

    /**
     * Stops and removes all animations
     */
    public stopAllAnimations(): void {
        if (this._attachedCamera) {
            this._animatables.forEach((animatable) => animatable.stop());
        }
        this._animatables.clear();
        this._promiseResolve?.();
        this._promiseResolve = undefined;
    }

    /**
     * Called when a single property's transition completes (or is applied instantly). Cleans up the
     * spent animation and resolves the in-flight promise once every property has reached its target.
     * @param propertyName name of the property whose animation has finished
     */
    private _onPropertyAnimationEnd(propertyName: string): void {
        const camera = this._attachedCamera;
        if (camera) {
            // Remove the associated animation from camera once the transition to target is complete so that property animations don't accumulate
            for (let i = camera.animations.length - 1; i >= 0; --i) {
                if (camera.animations[i].name === propertyName + "Animation") {
                    camera.animations.splice(i, 1);
                }
            }
        }

        this._animatables.delete(propertyName);
        if (this._animatables.size === 0) {
            const resolve = this._promiseResolve;
            this._promiseResolve = undefined;
            resolve?.();
        }
    }

    /**
     * Redirects any in-flight transition toward the given property values, reusing the time remaining in the
     * current transition. No-op when nothing is currently animating.
     * @deprecated Prefer `animatePropertiesAsync(properties, remainingDurationMs)`, which makes the duration
     * explicit. This method is retained for backward compatibility.
     * @param properties defines the property values to redirect toward
     */
    public updateProperties<K extends keyof C>(properties: Map<K, AllowedAnimValue>): void {
        if (!this.isInterpolating) {
            return;
        }
        void this.animatePropertiesAsync(properties, this.remainingDurationMs);
    }

    /**
     * Animates camera properties to new values.
     * @param properties defines the property values to animate to
     * @param transitionDuration defines the transition duration in milliseconds
     * @param easingFn defines the easing function to use
     * @param updateAnimation defines an optional callback used to update each generated animation
     * @returns a promise that resolves when the animation completes
     */
    public async animatePropertiesAsync<K extends keyof C>(
        properties: Map<K, AllowedAnimValue>,
        transitionDuration: number = this.transitionDuration,
        easingFn: EasingFunction = this.easingFunction,
        updateAnimation?: (key: string, animation: Animation) => void
    ): Promise<void> {
        const promise = new Promise<void>((resolve) => {
            this.stopAllAnimations();

            this._promiseResolve = resolve;
            if (!this._attachedCamera) {
                this._promiseResolve = undefined;
                return resolve();
            }
            const camera = this._attachedCamera;
            const scene = camera.getScene();

            properties.forEach((value, key) => {
                if (value !== undefined && camera[key] !== value) {
                    const propertyName = String(key);
                    const animation = Animation.CreateAnimation(propertyName, GetAnimationType(value), InterpolatingBehavior._FrameRate, easingFn);
                    // Optionally allow caller to further customize the animation
                    updateAnimation?.(propertyName, animation);

                    // Pass false for stopCurrent so that we can interpolate multiple properties at once
                    const animatable = Animation.TransitionTo(
                        propertyName,
                        value,
                        camera,
                        scene,
                        InterpolatingBehavior._FrameRate,
                        animation,
                        transitionDuration,
                        () => this._onPropertyAnimationEnd(propertyName),
                        false
                    );
                    if (animatable) {
                        this._animatables.set(propertyName, animatable);
                    }
                }
            });

            // Nothing needed animating (already at target): resolve immediately rather than hang.
            if (this._animatables.size === 0) {
                this._promiseResolve = undefined;
                resolve();
            }
        });
        return await promise;
    }
}

// Structural type-guards (no instanceof)
function IsQuaternionLike(v: any): v is IQuaternionLike {
    return v != null && typeof v.x === "number" && typeof v.y === "number" && typeof v.z === "number" && typeof v.w === "number";
}

function IsMatrixLike(v: any): v is IMatrixLike {
    return v != null && (Array.isArray((v as any).m) || typeof (v as any).m === "object");
}

function IsVector3Like(v: any): v is IVector3Like {
    return v != null && typeof v.x === "number" && typeof v.y === "number" && typeof v.z === "number";
}

function IsVector2Like(v: any): v is IVector2Like {
    return v != null && typeof v.x === "number" && typeof v.y === "number";
}

function IsColor3Like(v: any): v is IColor3Like {
    return v != null && typeof v.r === "number" && typeof v.g === "number" && typeof v.b === "number";
}

function IsColor4Like(v: any): v is IColor4Like {
    return v != null && typeof v.r === "number" && typeof v.g === "number" && typeof v.b === "number" && typeof v.a === "number";
}

export type SizeLike = { width: number; height: number };

function IsSizeLike(v: any): v is SizeLike {
    return v != null && typeof v.width === "number" && typeof v.height === "number";
}

const GetAnimationType = (value: AllowedAnimValue): number => {
    if (IsQuaternionLike(value)) {
        return Animation.ANIMATIONTYPE_QUATERNION;
    }
    if (IsMatrixLike(value)) {
        return Animation.ANIMATIONTYPE_MATRIX;
    }
    if (IsVector3Like(value)) {
        return Animation.ANIMATIONTYPE_VECTOR3;
    }
    if (IsVector2Like(value)) {
        return Animation.ANIMATIONTYPE_VECTOR2;
    }
    if (IsColor3Like(value)) {
        return Animation.ANIMATIONTYPE_COLOR3;
    }
    if (IsColor4Like(value)) {
        return Animation.ANIMATIONTYPE_COLOR4;
    }
    if (IsSizeLike(value)) {
        return Animation.ANIMATIONTYPE_SIZE;
    }

    // Fallback to float for numbers and unknown shapes
    return Animation.ANIMATIONTYPE_FLOAT;
};
