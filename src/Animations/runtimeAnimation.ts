import { DeepImmutable } from "../types";
import { Quaternion, Vector3, Vector2, Size, Color3, Matrix } from "../Maths/math";
import { Animation } from "./animation";
import { AnimationEvent } from "./animationEvent";

declare type Animatable = import("./animatable").Animatable;

import { Scene } from "../scene";

// Static values to help the garbage collector

// Quaternion
const _staticOffsetValueQuaternion: DeepImmutable<Quaternion> = Object.freeze(new Quaternion(0, 0, 0, 0));

// Vector3
const _staticOffsetValueVector3: DeepImmutable<Vector3> = Object.freeze(Vector3.Zero());

// Vector2
const _staticOffsetValueVector2: DeepImmutable<Vector2> = Object.freeze(Vector2.Zero());

// Size
const _staticOffsetValueSize: DeepImmutable<Size> = Object.freeze(Size.Zero());

// Color3
const _staticOffsetValueColor3: DeepImmutable<Color3> = Object.freeze(Color3.Black());

/**
 * Defines a runtime animation
 */
export class RuntimeAnimation {
    private _events = new Array<AnimationEvent>();

    /**
     * The current frame of the runtime animation
     */
    private _currentFrame: number = 0;

    /**
     * The animation used by the runtime animation
     */
    private _animation: Animation;

    /**
     * The target of the runtime animation
     */
    private _target: any;

    /**
     * The initiating animatable
     */
    private _host: Animatable;

    /**
     * The original value of the runtime animation
     */
    private _originalValue = new Array<any>();

    /**
     * The original blend value of the runtime animation
     */
    private _originalBlendValue: any;

    /**
     * The offsets cache of the runtime animation
     */
    private _offsetsCache: { [key: string]: any } = {};

    /**
     * The high limits cache of the runtime animation
     */
    private _highLimitsCache: { [key: string]: any } = {};

    /**
     * Specifies if the runtime animation has been stopped
     */
    private _stopped = false;

    /**
     * The blending factor of the runtime animation
     */
    private _blendingFactor = 0;

    /**
     * The BabylonJS scene
     */
    private _scene: Scene;

    /**
     * The current value of the runtime animation
     */
    private _currentValue: any;

    /** @hidden */
    public _workValue: any;

    /**
     * The active target of the runtime animation
     */
    private _activeTarget: any;

    /**
     * The target path of the runtime animation
     */
    private _targetPath: string = "";

    /**
     * The weight of the runtime animation
     */
    private _weight = 1.0;

    /**
     * The ratio offset of the runtime animation
     */
    private _ratioOffset = 0;

    /**
     * The previous delay of the runtime animation
     */
    private _previousDelay: number = 0;

    /**
     * The previous ratio of the runtime animation
     */
    private _previousRatio: number = 0;

    private _enableBlending: boolean;
    private _correctLoopMode: number | undefined;

    /**
     * Gets the current frame of the runtime animation
     */
    public get currentFrame(): number {
        return this._currentFrame;
    }

    /**
     * Gets the weight of the runtime animation
     */
    public get weight(): number {
        return this._weight;
    }

    /**
     * Gets the current value of the runtime animation
     */
    public get currentValue(): any {
        return this._currentValue;
    }

    /**
     * Gets the target path of the runtime animation
     */
    public get targetPath(): string {
        return this._targetPath;
    }

    /**
     * Gets the actual target of the runtime animation
     */
    public get target(): any {
        return this._activeTarget;
    }

    /**
     * Create a new RuntimeAnimation object
     * @param target defines the target of the animation
     * @param animation defines the source animation object
     * @param scene defines the hosting scene
     * @param host defines the initiating Animatable
     */
    public constructor(target: any, animation: Animation, scene: Scene, host: Animatable) {
        this._animation = animation;
        this._target = target;
        this._scene = scene;
        this._host = host;

        animation._runtimeAnimations.push(this);

        // Cloning events locally
        var events = animation.getEvents();
        if (events && events.length > 0) {
            events.forEach((e) => {
                this._events.push(e._clone());
            });
        }

        this._correctLoopMode = this._getCorrectLoopMode();
        this._enableBlending = target && target.animationPropertiesOverride ? target.animationPropertiesOverride.enableBlending : this._animation.enableBlending;
    }

    /**
     * Gets the animation from the runtime animation
     */
    public get animation(): Animation {
        return this._animation;
    }

    /**
     * Resets the runtime animation to the beginning
     * @param restoreOriginal defines whether to restore the target property to the original value
     */
    public reset(restoreOriginal = false): void {
        if (restoreOriginal) {
            if (this._target instanceof Array) {
                var index = 0;
                for (const target of this._target) {
                    if (this._originalValue[index] !== undefined) {
                        this._setValue(target, this._originalValue[index], -1);
                    }
                    index++;
                }
            }
            else {
                if (this._originalValue[0] !== undefined) {
                    this._setValue(this._target, this._originalValue[0], -1);
                }
            }
        }

        this._offsetsCache = {};
        this._highLimitsCache = {};
        this._currentFrame = 0;
        this._blendingFactor = 0;
        this._originalValue = new Array<any>();

        // Events
        for (var index = 0; index < this._events.length; index++) {
            this._events[index].isDone = false;
        }
    }

    /**
     * Specifies if the runtime animation is stopped
     * @returns Boolean specifying if the runtime animation is stopped
     */
    public isStopped(): boolean {
        return this._stopped;
    }

    /**
     * Disposes of the runtime animation
     */
    public dispose(): void {
        let index = this._animation.runtimeAnimations.indexOf(this);

        if (index > -1) {
            this._animation.runtimeAnimations.splice(index, 1);
        }
    }

    /**
     * Interpolates the animation from the current frame
     * @param currentFrame The frame to interpolate the animation to
     * @param repeatCount The number of times that the animation should loop
     * @param loopMode The type of looping mode to use
     * @param offsetValue Animation offset value
     * @param highLimitValue The high limit value
     * @returns The interpolated value
     */
    private _interpolate(currentFrame: number, repeatCount: number, loopMode?: number, offsetValue?: any, highLimitValue?: any): any {
        this._currentFrame = currentFrame;

        if (this._animation.dataType === Animation.ANIMATIONTYPE_MATRIX && !this._workValue) {
            this._workValue = Matrix.Zero();
        }

        return this._animation._interpolate(currentFrame, repeatCount, this._workValue, loopMode, offsetValue, highLimitValue);
    }

    /**
     * Apply the interpolated value to the target
     * @param currentValue defines the value computed by the animation
     * @param weight defines the weight to apply to this value (Defaults to 1.0)
     */
    public setValue(currentValue: any, weight = 1.0): void {
        if (this._target instanceof Array) {
            var index = 0;
            for (const target of this._target) {
                this._setValue(target, currentValue, weight, index);
                index++;
            }
        }
        else {
            this._setValue(this._target, currentValue, weight);
        }
    }

    private _setValue(target: any, currentValue: any, weight: number, targetIndex = 0): void {
        // Set value
        var path: any;
        var destination: any;

        if (!this._targetPath) {
            let targetPropertyPath = this._animation.targetPropertyPath;

            if (targetPropertyPath.length > 1) {
                var property = target[targetPropertyPath[0]];

                for (var index = 1; index < targetPropertyPath.length - 1; index++) {
                    property = property[targetPropertyPath[index]];
                }

                path = targetPropertyPath[targetPropertyPath.length - 1];
                destination = property;
            } else {
                path = targetPropertyPath[0];
                destination = target;
            }

            this._targetPath = path;
            this._activeTarget = destination;
        } else {
            path = this._targetPath;
            destination = this._activeTarget;
        }
        this._weight = weight;

        if (this._originalValue[targetIndex] === undefined) {
            let originalValue: any;

            if (destination.getRestPose && path === "_matrix") { // For bones
                originalValue = destination.getRestPose();
            } else {
                originalValue = destination[path];
            }

            if (originalValue && originalValue.clone) {
                this._originalValue[targetIndex] = originalValue.clone();
            } else {
                this._originalValue[targetIndex] = originalValue;
            }
        }

        // Blending
        if (this._enableBlending && this._blendingFactor <= 1.0) {
            if (!this._originalBlendValue) {
                let originalValue = destination[path];

                if (originalValue.clone) {
                    this._originalBlendValue = originalValue.clone();
                } else {
                    this._originalBlendValue = originalValue;
                }
            }

            if (this._originalBlendValue.m) { // Matrix
                if (Animation.AllowMatrixDecomposeForInterpolation) {
                    if (this._currentValue) {
                        Matrix.DecomposeLerpToRef(this._originalBlendValue, currentValue, this._blendingFactor, this._currentValue);
                    } else {
                        this._currentValue = Matrix.DecomposeLerp(this._originalBlendValue, currentValue, this._blendingFactor);
                    }
                } else {
                    if (this._currentValue) {
                        Matrix.LerpToRef(this._originalBlendValue, currentValue, this._blendingFactor, this._currentValue);
                    } else {
                        this._currentValue = Matrix.Lerp(this._originalBlendValue, currentValue, this._blendingFactor);
                    }
                }
            } else {
                this._currentValue = Animation._UniversalLerp(this._originalBlendValue, currentValue, this._blendingFactor);
            }

            const blendingSpeed = target && target.animationPropertiesOverride ? target.animationPropertiesOverride.blendingSpeed : this._animation.blendingSpeed;
            this._blendingFactor += blendingSpeed;
        } else {
            this._currentValue = currentValue;
        }

        if (weight !== -1.0) {
            this._scene._registerTargetForLateAnimationBinding(this, this._originalValue[targetIndex]);
        } else {
            destination[path] = this._currentValue;
        }

        if (target.markAsDirty) {
            target.markAsDirty(this._animation.targetProperty);
        }
    }

    /**
     * Gets the loop pmode of the runtime animation
     * @returns Loop Mode
     */
    private _getCorrectLoopMode(): number | undefined {
        if (this._target && this._target.animationPropertiesOverride) {
            return this._target.animationPropertiesOverride.loopMode;
        }

        return this._animation.loopMode;
    }

    /**
     * Move the current animation to a given frame
     * @param frame defines the frame to move to
     */
    public goToFrame(frame: number): void {
        let keys = this._animation.getKeys();

        if (frame < keys[0].frame) {
            frame = keys[0].frame;
        } else if (frame > keys[keys.length - 1].frame) {
            frame = keys[keys.length - 1].frame;
        }

        var currentValue = this._interpolate(frame, 0, this._correctLoopMode);

        this.setValue(currentValue, -1);
    }

    /**
     * @hidden Internal use only
     */
    public _prepareForSpeedRatioChange(newSpeedRatio: number): void {
        let newRatio = this._previousDelay * (this._animation.framePerSecond * newSpeedRatio) / 1000.0;

        this._ratioOffset = this._previousRatio - newRatio;
    }

    /**
     * Execute the current animation
     * @param delay defines the delay to add to the current frame
     * @param from defines the lower bound of the animation range
     * @param to defines the upper bound of the animation range
     * @param loop defines if the current animation must loop
     * @param speedRatio defines the current speed ratio
     * @param weight defines the weight of the animation (default is -1 so no weight)
     * @param onLoop optional callback called when animation loops
     * @returns a boolean indicating if the animation is running
     */
    public animate(delay: number, from: number, to: number, loop: boolean, speedRatio: number, weight = -1.0, onLoop?: () => void): boolean {
        let targetPropertyPath = this._animation.targetPropertyPath;
        if (!targetPropertyPath || targetPropertyPath.length < 1) {
            this._stopped = true;
            return false;
        }

        let returnValue = true;

        let keys = this._animation.getKeys();
        let min = keys[0].frame;
        let max = keys[keys.length - 1].frame;

        // Add a start key at frame 0 if missing
        if (min !== 0) {
            const newKey = { frame: 0, value: keys[0].value };
            keys.splice(0, 0, newKey);
        }

        // Check limits
        if (from < min || from > max) {
            from = min;
        }
        if (to < min || to > max) {
            to = max;
        }

        const range = to - from;
        let offsetValue: any;

        // Compute ratio which represents the frame delta between from and to
        const ratio = (delay * (this._animation.framePerSecond * speedRatio) / 1000.0) + this._ratioOffset;
        let highLimitValue = 0;

        this._previousDelay = delay;
        this._previousRatio = ratio;

        if ((to > from && ratio >= range) && !loop) { // If we are out of range and not looping get back to caller
            returnValue = false;
            highLimitValue = this._animation._getKeyValue(keys[keys.length - 1].value);
        } else if ((from > to && ratio <= range) && !loop) {
            returnValue = false;
            highLimitValue = this._animation._getKeyValue(keys[0].value);
        } else {
            // Get max value if required

            if (this._correctLoopMode !== Animation.ANIMATIONLOOPMODE_CYCLE) {

                var keyOffset = to.toString() + from.toString();
                if (!this._offsetsCache[keyOffset]) {
                    var fromValue = this._interpolate(from, 0, Animation.ANIMATIONLOOPMODE_CYCLE);
                    var toValue = this._interpolate(to, 0, Animation.ANIMATIONLOOPMODE_CYCLE);
                    switch (this._animation.dataType) {
                        // Float
                        case Animation.ANIMATIONTYPE_FLOAT:
                            this._offsetsCache[keyOffset] = toValue - fromValue;
                            break;
                        // Quaternion
                        case Animation.ANIMATIONTYPE_QUATERNION:
                            this._offsetsCache[keyOffset] = toValue.subtract(fromValue);
                            break;
                        // Vector3
                        case Animation.ANIMATIONTYPE_VECTOR3:
                            this._offsetsCache[keyOffset] = toValue.subtract(fromValue);
                        // Vector2
                        case Animation.ANIMATIONTYPE_VECTOR2:
                            this._offsetsCache[keyOffset] = toValue.subtract(fromValue);
                        // Size
                        case Animation.ANIMATIONTYPE_SIZE:
                            this._offsetsCache[keyOffset] = toValue.subtract(fromValue);
                        // Color3
                        case Animation.ANIMATIONTYPE_COLOR3:
                            this._offsetsCache[keyOffset] = toValue.subtract(fromValue);
                        default:
                            break;
                    }

                    this._highLimitsCache[keyOffset] = toValue;
                }

                highLimitValue = this._highLimitsCache[keyOffset];
                offsetValue = this._offsetsCache[keyOffset];
            }
        }

        if (offsetValue === undefined) {
            switch (this._animation.dataType) {
                // Float
                case Animation.ANIMATIONTYPE_FLOAT:
                    offsetValue = 0;
                    break;
                // Quaternion
                case Animation.ANIMATIONTYPE_QUATERNION:
                    offsetValue = _staticOffsetValueQuaternion;
                    break;
                // Vector3
                case Animation.ANIMATIONTYPE_VECTOR3:
                    offsetValue = _staticOffsetValueVector3;
                    break;
                // Vector2
                case Animation.ANIMATIONTYPE_VECTOR2:
                    offsetValue = _staticOffsetValueVector2;
                    break;
                // Size
                case Animation.ANIMATIONTYPE_SIZE:
                    offsetValue = _staticOffsetValueSize;
                    break;
                // Color3
                case Animation.ANIMATIONTYPE_COLOR3:
                    offsetValue = _staticOffsetValueColor3;
            }
        }

        // Compute value
        let currentFrame = (returnValue && range !== 0) ? from + ratio % range : to;

        // Need to normalize?
        if (this._host && this._host.syncRoot) {
            const syncRoot = this._host.syncRoot;
            const hostNormalizedFrame = (syncRoot.masterFrame - syncRoot.fromFrame) / (syncRoot.toFrame - syncRoot.fromFrame);
            currentFrame = from + (to - from) * hostNormalizedFrame;
        }

        // Reset events if looping
        const events = this._events;
        if (range > 0 && this.currentFrame > currentFrame ||
            range < 0 && this.currentFrame < currentFrame) {
            if (onLoop) {
                onLoop();
            }

            // Need to reset animation events
            for (var index = 0; index < events.length; index++) {
                if (!events[index].onlyOnce) {
                    // reset event, the animation is looping
                    events[index].isDone = false;
                }
            }
        }

        const repeatCount = range === 0 ? 0 : (ratio / range) >> 0;
        const currentValue = this._interpolate(currentFrame, repeatCount, this._correctLoopMode, offsetValue, highLimitValue);

        // Set value
        this.setValue(currentValue, weight);

        // Check events
        for (var index = 0; index < events.length; index++) {
            // Make sure current frame has passed event frame and that event frame is within the current range
            // Also, handle both forward and reverse animations
            if (
                (range > 0 && currentFrame >= events[index].frame && events[index].frame >= from) ||
                (range < 0 && currentFrame <= events[index].frame && events[index].frame <= from)
            ) {
                var event = events[index];
                if (!event.isDone) {
                    // If event should be done only once, remove it.
                    if (event.onlyOnce) {
                        events.splice(index, 1);
                        index--;
                    }
                    event.isDone = true;
                    event.action(currentFrame);
                } // Don't do anything if the event has already be done.
            }
        }
        if (!returnValue) {
            this._stopped = true;
        }

        return returnValue;
    }
}
