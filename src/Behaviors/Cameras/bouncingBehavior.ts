import { Behavior } from "../../Behaviors/behavior";
import { Camera } from "../../Cameras/camera";
import { ArcRotateCamera } from "../../Cameras/arcRotateCamera";
import { BackEase, EasingFunction } from "../../Animations/easing";
import { Nullable } from "../../types";
import { Observer } from "../../Misc/observable";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Animatable } from "../../Animations/animatable";
import { Animation } from "../../Animations/animation";

/**
 * Add a bouncing effect to an ArcRotateCamera when reaching a specified minimum and maximum radius
 * @see https://doc.babylonjs.com/how_to/camera_behaviors#bouncing-behavior
 */
export class BouncingBehavior implements Behavior<ArcRotateCamera> {
    /**
     * Gets the name of the behavior.
     */
    public get name(): string {
        return "Bouncing";
    }

    /**
     * The easing function used by animations
     */
    public static EasingFunction = new BackEase(0.3);

    /**
     * The easing mode used by animations
     */
    public static EasingMode = EasingFunction.EASINGMODE_EASEOUT;

    /**
     * The duration of the animation, in milliseconds
     */
    public transitionDuration = 450;

    /**
     * Length of the distance animated by the transition when lower radius is reached
     */
    public lowerRadiusTransitionRange = 2;

    /**
     * Length of the distance animated by the transition when upper radius is reached
     */
    public upperRadiusTransitionRange = -2;

    private _autoTransitionRange = false;

    /**
     * Gets a value indicating if the lowerRadiusTransitionRange and upperRadiusTransitionRange are defined automatically
     */
    public get autoTransitionRange(): boolean {
        return this._autoTransitionRange;
    }

    /**
     * Sets a value indicating if the lowerRadiusTransitionRange and upperRadiusTransitionRange are defined automatically
     * Transition ranges will be set to 5% of the bounding box diagonal in world space
     */
    public set autoTransitionRange(value: boolean) {
        if (this._autoTransitionRange === value) {
            return;
        }

        this._autoTransitionRange = value;

        let camera = this._attachedCamera;
        if (!camera) {
            return;
        }

        if (value) {
            this._onMeshTargetChangedObserver = camera.onMeshTargetChangedObservable.add((mesh) => {
                if (!mesh) {
                    return;
                }

                mesh.computeWorldMatrix(true);
                let diagonal = mesh.getBoundingInfo().diagonalLength;

                this.lowerRadiusTransitionRange = diagonal * 0.05;
                this.upperRadiusTransitionRange = diagonal * 0.05;
            });
        } else if (this._onMeshTargetChangedObserver) {
            camera.onMeshTargetChangedObservable.remove(this._onMeshTargetChangedObserver);
        }
    }

    // Connection
    private _attachedCamera: Nullable<ArcRotateCamera>;
    private _onAfterCheckInputsObserver: Nullable<Observer<Camera>>;
    private _onMeshTargetChangedObserver: Nullable<Observer<Nullable<AbstractMesh>>>;

    /**
     * Initializes the behavior.
     */
    public init(): void {
        // Do notihng
    }

    /**
     * Attaches the behavior to its arc rotate camera.
     * @param camera Defines the camera to attach the behavior to
     */
    public attach(camera: ArcRotateCamera): void {
        this._attachedCamera = camera;
        this._onAfterCheckInputsObserver = camera.onAfterCheckInputsObservable.add(() => {
            if (!this._attachedCamera) {
                return;
            }

            // Add the bounce animation to the lower radius limit
            if (this._isRadiusAtLimit(this._attachedCamera.lowerRadiusLimit)) {
                this._applyBoundRadiusAnimation(this.lowerRadiusTransitionRange);
            }

            // Add the bounce animation to the upper radius limit
            if (this._isRadiusAtLimit(this._attachedCamera.upperRadiusLimit)) {
                this._applyBoundRadiusAnimation(this.upperRadiusTransitionRange);
            }
        });
    }

    /**
     * Detaches the behavior from its current arc rotate camera.
     */
    public detach(): void {
        if (!this._attachedCamera) {
            return;
        }
        if (this._onAfterCheckInputsObserver) {
            this._attachedCamera.onAfterCheckInputsObservable.remove(this._onAfterCheckInputsObserver);
        }
        if (this._onMeshTargetChangedObserver) {
            this._attachedCamera.onMeshTargetChangedObservable.remove(this._onMeshTargetChangedObserver);
        }
        this._attachedCamera = null;
    }

    // Animations
    private _radiusIsAnimating: boolean = false;
    private _radiusBounceTransition: Nullable<Animation> = null;
    private _animatables = new Array<Animatable>();
    private _cachedWheelPrecision: number;

    /**
     * Checks if the camera radius is at the specified limit. Takes into account animation locks.
     * @param radiusLimit The limit to check against.
     * @return Bool to indicate if at limit.
     */
    private _isRadiusAtLimit(radiusLimit: Nullable<number>): boolean {
        if (!this._attachedCamera) {
            return false;
        }

        if (this._attachedCamera.radius === radiusLimit && !this._radiusIsAnimating) {
            return true;
        }
        return false;
    }

    /**
     * Applies an animation to the radius of the camera, extending by the radiusDelta.
     * @param radiusDelta The delta by which to animate to. Can be negative.
     */
    private _applyBoundRadiusAnimation(radiusDelta: number): void {
        if (!this._attachedCamera) {
            return;
        }

        if (!this._radiusBounceTransition) {
            BouncingBehavior.EasingFunction.setEasingMode(BouncingBehavior.EasingMode);
            this._radiusBounceTransition = Animation.CreateAnimation("radius", Animation.ANIMATIONTYPE_FLOAT, 60, BouncingBehavior.EasingFunction);
        }
        // Prevent zoom until bounce has completed
        this._cachedWheelPrecision = this._attachedCamera.wheelPrecision;
        this._attachedCamera.wheelPrecision = Infinity;
        this._attachedCamera.inertialRadiusOffset = 0;

        // Animate to the radius limit
        this.stopAllAnimations();
        this._radiusIsAnimating = true;
        let animatable = Animation.TransitionTo("radius", this._attachedCamera.radius + radiusDelta, this._attachedCamera, this._attachedCamera.getScene(), 60,
            this._radiusBounceTransition, this.transitionDuration, () => this._clearAnimationLocks());

        if (animatable) {
            this._animatables.push(animatable);
        }
    }

    /**
     * Removes all animation locks. Allows new animations to be added to any of the camera properties.
     */
    protected _clearAnimationLocks(): void {
        this._radiusIsAnimating = false;

        if (this._attachedCamera) {
            this._attachedCamera.wheelPrecision = this._cachedWheelPrecision;
        }
    }

    /**
     * Stops and removes all animations that have been applied to the camera
     */
    public stopAllAnimations(): void {
        if (this._attachedCamera) {
            this._attachedCamera.animations = [];
        }
        while (this._animatables.length) {
            this._animatables[0].onAnimationEnd = null;
            this._animatables[0].stop();
            this._animatables.shift();
        }
    }
}
