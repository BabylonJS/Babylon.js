import { DeepImmutable, Nullable } from "../types";
import { Quaternion, Vector3, Vector2, Matrix } from "../Maths/math.vector";
import { Color3 } from '../Maths/math.color';
import { Animation, _IAnimationState } from "./animation";
import { AnimationEvent } from "./animationEvent";

declare type Animatable = import("./animatable").Animatable;

import { Scene } from "../scene";
import { IAnimationKey } from './animationKey';
import { Size } from '../Maths/math.size';

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
    private _originalBlendValue: Nullable<any> = null;

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
    private _currentValue: Nullable<any> = null;

    /** @hidden */
    public _animationState: _IAnimationState;

    /**
     * The active target of the runtime animation
     */
    private _activeTargets: any[];
    private _currentActiveTarget: Nullable<any> = null;
    private _directTarget: Nullable<any> = null;

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

    private _keys: IAnimationKey[];
    private _minFrame: number;
    private _maxFrame: number;
    private _minValue: any;
    private _maxValue: any;
    private _targetIsArray = false;

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
        return this._currentActiveTarget;
    }

    /**
     * Gets the additive state of the runtime animation
     */
    public get isAdditive(): boolean {
        return this._host && this._host.isAdditive;
    }

    /** @hidden */
    public _onLoop: () => void;

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
        this._activeTargets = [];

        animation._runtimeAnimations.push(this);

        // State
        this._animationState = {
            key: 0,
            repeatCount: 0,
            loopMode: this._getCorrectLoopMode()
        };

        if (this._animation.dataType === Animation.ANIMATIONTYPE_MATRIX) {
            this._animationState.workValue = Matrix.Zero();
        }

        // Limits
        this._keys = this._animation.getKeys();
        this._minFrame = this._keys[0].frame;
        this._maxFrame = this._keys[this._keys.length - 1].frame;
        this._minValue = this._keys[0].value;
        this._maxValue = this._keys[this._keys.length - 1].value;

        // Add a start key at frame 0 if missing
        if (this._minFrame !== 0) {
            const newKey = { frame: 0, value: this._minValue };
            this._keys.splice(0, 0, newKey);
        }

        // Check data
        if (this._target instanceof Array) {
            var index = 0;
            for (const target of this._target) {
                this._preparePath(target, index);
                this._getOriginalValues(index);
                index++;
            }
            this._targetIsArray = true;
        }
        else {
            this._preparePath(this._target);
            this._getOriginalValues();
            this._targetIsArray = false;
            this._directTarget = this._activeTargets[0];
        }

        // Cloning events locally
        var events = animation.getEvents();
        if (events && events.length > 0) {
            events.forEach((e) => {
                this._events.push(e._clone());
            });
        }

        this._enableBlending = target && target.animationPropertiesOverride ? target.animationPropertiesOverride.enableBlending : this._animation.enableBlending;
    }

    private _preparePath(target: any, targetIndex = 0) {
        let targetPropertyPath = this._animation.targetPropertyPath;

        if (targetPropertyPath.length > 1) {
            var property = target[targetPropertyPath[0]];

            for (var index = 1; index < targetPropertyPath.length - 1; index++) {
                property = property[targetPropertyPath[index]];
            }

            this._targetPath = targetPropertyPath[targetPropertyPath.length - 1];
            this._activeTargets[targetIndex] = property;
        } else {
            this._targetPath = targetPropertyPath[0];
            this._activeTargets[targetIndex] = target;
        }
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
                        this._setValue(target, this._activeTargets[index], this._originalValue[index], -1, index);
                    }
                    index++;
                }
            }
            else {
                if (this._originalValue[0] !== undefined) {
                    this._setValue(this._target, this._directTarget, this._originalValue[0], -1, 0);
                }
            }
        }

        this._offsetsCache = {};
        this._highLimitsCache = {};
        this._currentFrame = 0;
        this._blendingFactor = 0;

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
     * Apply the interpolated value to the target
     * @param currentValue defines the value computed by the animation
     * @param weight defines the weight to apply to this value (Defaults to 1.0)
     */
    public setValue(currentValue: any, weight: number) {
        if (this._targetIsArray) {
            for (var index = 0; index < this._target.length; index++) {
                const target = this._target[index];
                this._setValue(target, this._activeTargets[index], currentValue, weight, index);
            }
            return;
        }
        this._setValue(this._target, this._directTarget, currentValue, weight, 0);
    }

    private _getOriginalValues(targetIndex = 0) {
        let originalValue: any;
        let target = this._activeTargets[targetIndex];

        if (target.getRestPose && this._targetPath === "_matrix") { // For bones
            originalValue = target.getRestPose();
        } else {
            originalValue = target[this._targetPath];
        }

        if (originalValue && originalValue.clone) {
            this._originalValue[targetIndex] = originalValue.clone();
        } else {
            this._originalValue[targetIndex] = originalValue;
        }
    }

    private _setValue(target: any, destination: any, currentValue: any, weight: number, targetIndex: number): void {
        // Set value
        this._currentActiveTarget = destination;

        this._weight = weight;

        if (this._enableBlending && this._blendingFactor <= 1.0) {
            if (!this._originalBlendValue) {
                let originalValue = destination[this._targetPath];

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
            destination[this._targetPath] = this._currentValue;
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

        // Need to reset animation events
        const events = this._events;
        if (events.length) {
            for (var index = 0; index < events.length; index++) {
                if (!events[index].onlyOnce) {
                    // reset events in the future
                    events[index].isDone = events[index].frame < frame;
                }
            }
        }

        this._currentFrame = frame;
        var currentValue = this._animation._interpolate(frame, this._animationState);

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
    public animate(delay: number, from: number, to: number, loop: boolean, speedRatio: number, weight = -1.0): boolean {
        let animation = this._animation;
        let targetPropertyPath = animation.targetPropertyPath;
        if (!targetPropertyPath || targetPropertyPath.length < 1) {
            this._stopped = true;
            return false;
        }

        let returnValue = true;

        // Check limits
        if (from < this._minFrame || from > this._maxFrame) {
            from = this._minFrame;
        }
        if (to < this._minFrame || to > this._maxFrame) {
            to = this._maxFrame;
        }

        const range = to - from;
        let offsetValue: any;

        // Compute ratio which represents the frame delta between from and to
        const ratio = (delay * (animation.framePerSecond * speedRatio) / 1000.0) + this._ratioOffset;
        let highLimitValue = 0;

        this._previousDelay = delay;
        this._previousRatio = ratio;

        if (!loop && (to >= from && ratio >= range)) { // If we are out of range and not looping get back to caller
            returnValue = false;
            highLimitValue = animation._getKeyValue(this._maxValue);
        } else if (!loop && (from >= to && ratio <= range)) {
            returnValue = false;
            highLimitValue = animation._getKeyValue(this._minValue);
        } else if (this._animationState.loopMode !== Animation.ANIMATIONLOOPMODE_CYCLE) {
            var keyOffset = to.toString() + from.toString();
            if (!this._offsetsCache[keyOffset]) {
                this._animationState.repeatCount = 0;
                this._animationState.loopMode = Animation.ANIMATIONLOOPMODE_CYCLE;
                var fromValue = animation._interpolate(from, this._animationState);
                var toValue = animation._interpolate(to, this._animationState);

                this._animationState.loopMode = this._getCorrectLoopMode();
                switch (animation.dataType) {
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

        if (offsetValue === undefined) {
            switch (animation.dataType) {
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
        let currentFrame: number;

        if (this._host && this._host.syncRoot) {
            const syncRoot = this._host.syncRoot;
            const hostNormalizedFrame = (syncRoot.masterFrame - syncRoot.fromFrame) / (syncRoot.toFrame - syncRoot.fromFrame);
            currentFrame = from + (to - from) * hostNormalizedFrame;
        } else {
            currentFrame = (returnValue && range !== 0) ? from + ratio % range : to;
        }

        // Reset events if looping
        const events = this._events;
        if (range > 0 && this.currentFrame > currentFrame ||
            range < 0 && this.currentFrame < currentFrame) {
            this._onLoop();

            // Need to reset animation events
            if (events.length) {
                for (var index = 0; index < events.length; index++) {
                    if (!events[index].onlyOnce) {
                        // reset event, the animation is looping
                        events[index].isDone = false;
                    }
                }
            }
        }
        this._currentFrame = currentFrame;
        this._animationState.repeatCount = range === 0 ? 0 : (ratio / range) >> 0;
        this._animationState.highLimitValue = highLimitValue;
        this._animationState.offsetValue = offsetValue;

        const currentValue = animation._interpolate(currentFrame, this._animationState);

        // Set value
        this.setValue(currentValue, weight);

        // Check events
        if (events.length) {
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
        }

        if (!returnValue) {
            this._stopped = true;
        }

        return returnValue;
    }
}
