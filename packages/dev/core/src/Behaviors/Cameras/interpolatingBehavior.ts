import type { Behavior } from "../behavior";
import { CubicEase, EasingFunction } from "../../Animations/easing";
import type { Nullable } from "../../types";
import type { Animatable } from "../../Animations/animatable.core";
import { Animation } from "../../Animations/animation";
import type { Camera } from "../../Cameras/camera";

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

    public updateProperties(properties: Map<string, any>): void {
        properties.forEach((value, key) => {
            const animatable = this._animatables.get(key);
            animatable && (animatable.target = value);
        });
    }

    public async animatePropertiesAsync(
        properties: Map<string, any>,
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

            const checkClear = (animation: string) => {
                this._animatables.delete(animation);
                if (this._animatables.size === 0) {
                    this._promiseResolve = undefined;
                    resolve();
                }
            };

            properties.forEach((value, key) => {
                const animation = Animation.CreateAnimation(key, Animation.ANIMATIONTYPE_FLOAT, 60, easingFn);
                const animatable = Animation.TransitionTo(key, value, camera, scene, 60, animation, transitionDuration, () => checkClear(key));
                if (animatable) {
                    this._animatables.set(key, animatable);
                }
            });
        });
        return await promise;
    }
}
