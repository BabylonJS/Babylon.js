import type { Behavior } from "../behavior";
import { CubicEase, EasingFunction } from "../../Animations/easing";
import type { Nullable } from "../../types";
import type { Animatable } from "../../Animations/animatable.core";
import { Animation } from "../../Animations/animation";
import type { Camera } from "../../Cameras/camera";
import type { IColor3Like, IColor4Like, IMatrixLike, IQuaternionLike, IVector2Like, IVector3Like } from "../../Maths/math.like";

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

    private _attachedCamera: Nullable<C> = null;
    private _animatables: Map<string, Animatable> = new Map<string, Animatable>();
    private _promiseResolve?: () => void;

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

    public updateProperties<K extends keyof C>(properties: Map<K, AllowedAnimValue>): void {
        properties.forEach((value, key) => {
            if (value !== undefined) {
                const animatable = this._animatables.get(String(key));
                animatable && (animatable.target = value as unknown as any);
            }
        });
    }

    public async animatePropertiesAsync<K extends keyof C>(
        properties: Map<K, AllowedAnimValue>,
        transitionDuration: number = this.transitionDuration,
        easingFn: EasingFunction = this.easingFunction
    ): Promise<void> {
        const promise = new Promise<void>((resolve) => {
            this._promiseResolve = resolve;
            this.stopAllAnimations();
            if (!this._attachedCamera) {
                this._promiseResolve = undefined;
                return resolve();
            }
            const camera = this._attachedCamera;
            const scene = camera.getScene();

            const checkClear = (propertyName: string) => {
                // Remove the associated animation from camera once the transition to target is complete so that property animations don't accumulate
                for (let i = camera.animations.length - 1; i >= 0; --i) {
                    if (camera.animations[i].name === propertyName + "Animation") {
                        camera.animations.splice(i, 1);
                    }
                }

                this._animatables.delete(propertyName);
                if (this._animatables.size === 0) {
                    this._promiseResolve = undefined;
                    resolve();
                }
            };

            properties.forEach((value, key) => {
                if (value !== undefined) {
                    const propertyName = String(key);
                    const animation = Animation.CreateAnimation(propertyName, GetAnimationType(value), 60, easingFn);
                    // Pass false for stopCurrent so that we can interpolate multiple properties at once
                    const animatable = Animation.TransitionTo(propertyName, value, camera, scene, 60, animation, transitionDuration, () => checkClear(propertyName), false);
                    if (animatable) {
                        this._animatables.set(propertyName, animatable);
                    }
                }
            });
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
