import type { Nullable } from "../types";
import { Matrix } from "../Maths/math.vector";
import type { _IAnimationState } from "./animation";
import {
    Animation,
    _staticOffsetValueColor3,
    _staticOffsetValueColor4,
    _staticOffsetValueQuaternion,
    _staticOffsetValueSize,
    _staticOffsetValueVector2,
    _staticOffsetValueVector3,
} from "./animation";
import type { AnimationEvent } from "./animationEvent";
import type { Animatable } from "./animatable";
import type { Scene } from "../scene";
import type { IAnimationKey } from "./animationKey";

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

    /** @internal */
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
     * The absolute frame offset of the runtime animation
     */
    private _absoluteFrameOffset = 0;

    /**
     * The previous elapsed time (since start of animation) of the runtime animation
     */
    private _previousElapsedTime: number = 0;

    /**
     * The previous absolute frame of the runtime animation (meaning, without taking into account the from/to values, only the elapsed time and the fps)
     */
    private _previousAbsoluteFrame: number = 0;

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
     * Gets or sets the target path of the runtime animation
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

    /** @internal */
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
            loopMode: this._getCorrectLoopMode(),
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
            let index = 0;
            for (const target of this._target) {
                this._preparePath(target, index);
                this._getOriginalValues(index);
                index++;
            }
            this._targetIsArray = true;
        } else {
            this._preparePath(this._target);
            this._getOriginalValues();
            this._targetIsArray = false;
            this._directTarget = this._activeTargets[0];
        }

        // Cloning events locally
        const events = animation.getEvents();
        if (events && events.length > 0) {
            events.forEach((e) => {
                this._events.push(e._clone());
            });
        }

        this._enableBlending = target && target.animationPropertiesOverride ? target.animationPropertiesOverride.enableBlending : this._animation.enableBlending;
    }

    private _preparePath(target: any, targetIndex = 0) {
        const targetPropertyPath = this._animation.targetPropertyPath;

        if (targetPropertyPath.length > 1) {
            let property = target[targetPropertyPath[0]];

            for (let index = 1; index < targetPropertyPath.length - 1; index++) {
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
                let index = 0;
                for (const target of this._target) {
                    if (this._originalValue[index] !== undefined) {
                        this._setValue(target, this._activeTargets[index], this._originalValue[index], -1, index);
                    }
                    index++;
                }
            } else {
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
        for (let index = 0; index < this._events.length; index++) {
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
        const index = this._animation.runtimeAnimations.indexOf(this);

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
            for (let index = 0; index < this._target.length; index++) {
                const target = this._target[index];
                this._setValue(target, this._activeTargets[index], currentValue, weight, index);
            }
            return;
        }
        this._setValue(this._target, this._directTarget, currentValue, weight, 0);
    }

    private _getOriginalValues(targetIndex = 0) {
        let originalValue: any;
        const target = this._activeTargets[targetIndex];

        if (target.getLocalMatrix && this._targetPath === "_matrix") {
            // For bones
            originalValue = target.getLocalMatrix();
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
                const originalValue = destination[this._targetPath];

                if (originalValue.clone) {
                    this._originalBlendValue = originalValue.clone();
                } else {
                    this._originalBlendValue = originalValue;
                }
            }

            if (this._originalBlendValue.m) {
                // Matrix
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
            if (!this._currentValue) {
                if (currentValue?.clone) {
                    this._currentValue = currentValue.clone();
                } else {
                    this._currentValue = currentValue;
                }
            } else if (this._currentValue.copyFrom) {
                this._currentValue.copyFrom(currentValue);
            } else {
                this._currentValue = currentValue;
            }
        }

        if (weight !== -1.0) {
            this._scene._registerTargetForLateAnimationBinding(this, this._originalValue[targetIndex]);
        } else {
            if (this._animationState.loopMode === Animation.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT) {
                if (this._currentValue.addToRef) {
                    this._currentValue.addToRef(this._originalValue[targetIndex], destination[this._targetPath]);
                } else {
                    destination[this._targetPath] = this._originalValue[targetIndex] + this._currentValue;
                }
            } else {
                destination[this._targetPath] = this._currentValue;
            }
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
        const keys = this._animation.getKeys();

        if (frame < keys[0].frame) {
            frame = keys[0].frame;
        } else if (frame > keys[keys.length - 1].frame) {
            frame = keys[keys.length - 1].frame;
        }

        // Need to reset animation events
        const events = this._events;
        if (events.length) {
            for (let index = 0; index < events.length; index++) {
                if (!events[index].onlyOnce) {
                    // reset events in the future
                    events[index].isDone = events[index].frame < frame;
                }
            }
        }

        this._currentFrame = frame;
        const currentValue = this._animation._interpolate(frame, this._animationState);

        this.setValue(currentValue, -1);
    }

    /**
     * @internal Internal use only
     */
    public _prepareForSpeedRatioChange(newSpeedRatio: number): void {
        const newAbsoluteFrame = (this._previousElapsedTime * (this._animation.framePerSecond * newSpeedRatio)) / 1000.0;

        this._absoluteFrameOffset = this._previousAbsoluteFrame - newAbsoluteFrame;
    }

    /**
     * Execute the current animation
     * @param elapsedTimeSinceAnimationStart defines the elapsed time (in milliseconds) since the animation was started
     * @param from defines the lower frame of the animation range
     * @param to defines the upper frame of the animation range
     * @param loop defines if the current animation must loop
     * @param speedRatio defines the current speed ratio
     * @param weight defines the weight of the animation (default is -1 so no weight)
     * @returns a boolean indicating if the animation is running
     */
    public animate(elapsedTimeSinceAnimationStart: number, from: number, to: number, loop: boolean, speedRatio: number, weight = -1.0): boolean {
        const animation = this._animation;
        const targetPropertyPath = animation.targetPropertyPath;
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

        const frameRange = to - from;
        let offsetValue: any;

        // Compute the frame according to the elapsed time and the fps of the animation ("from" and "to" are not factored in!)
        let absoluteFrame = (elapsedTimeSinceAnimationStart * (animation.framePerSecond * speedRatio)) / 1000.0 + this._absoluteFrameOffset;
        let highLimitValue = 0;

        // Apply the yoyo function if required
        if (loop && this._animationState.loopMode === Animation.ANIMATIONLOOPMODE_YOYO) {
            const position = (absoluteFrame - from) / frameRange;

            // Apply the yoyo curve
            const yoyoPosition = Math.abs(Math.sin(position * Math.PI));

            // Map the yoyo position back to the range
            absoluteFrame = yoyoPosition * frameRange + from;
        }

        this._previousElapsedTime = elapsedTimeSinceAnimationStart;
        this._previousAbsoluteFrame = absoluteFrame;

        if (!loop && to >= from && ((absoluteFrame >= frameRange && speedRatio > 0) || (absoluteFrame <= 0 && speedRatio < 0))) {
            // If we are out of range and not looping get back to caller
            returnValue = false;
            highLimitValue = animation._getKeyValue(this._maxValue);
        } else if (!loop && from >= to && ((absoluteFrame <= frameRange && speedRatio < 0) || (absoluteFrame >= 0 && speedRatio > 0))) {
            returnValue = false;
            highLimitValue = animation._getKeyValue(this._minValue);
        } else if (this._animationState.loopMode !== Animation.ANIMATIONLOOPMODE_CYCLE) {
            const keyOffset = to.toString() + from.toString();
            if (!this._offsetsCache[keyOffset]) {
                this._animationState.repeatCount = 0;
                this._animationState.loopMode = Animation.ANIMATIONLOOPMODE_CYCLE; // force a specific codepath in animation._interpolate()!
                const fromValue = animation._interpolate(from, this._animationState);
                const toValue = animation._interpolate(to, this._animationState);

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
                        break;
                    // Vector2
                    case Animation.ANIMATIONTYPE_VECTOR2:
                        this._offsetsCache[keyOffset] = toValue.subtract(fromValue);
                        break;
                    // Size
                    case Animation.ANIMATIONTYPE_SIZE:
                        this._offsetsCache[keyOffset] = toValue.subtract(fromValue);
                        break;
                    // Color3
                    case Animation.ANIMATIONTYPE_COLOR3:
                        this._offsetsCache[keyOffset] = toValue.subtract(fromValue);
                        break;
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
                    break;
                case Animation.ANIMATIONTYPE_COLOR4:
                    offsetValue = _staticOffsetValueColor4;
                    break;
            }
        }

        // Compute value
        let currentFrame: number;

        if (this._host && this._host.syncRoot) {
            // If we must sync with an animatable, calculate the current frame based on the frame of the root animatable
            const syncRoot = this._host.syncRoot;
            const hostNormalizedFrame = (syncRoot.masterFrame - syncRoot.fromFrame) / (syncRoot.toFrame - syncRoot.fromFrame);
            currentFrame = from + frameRange * hostNormalizedFrame;
        } else {
            if ((absoluteFrame > 0 && from > to) || (absoluteFrame < 0 && from < to)) {
                currentFrame = returnValue && frameRange !== 0 ? to + (absoluteFrame % frameRange) : from;
            } else {
                currentFrame = returnValue && frameRange !== 0 ? from + (absoluteFrame % frameRange) : to;
            }
        }

        const events = this._events;

        // Reset event/state if looping
        if ((speedRatio > 0 && this.currentFrame > currentFrame) || (speedRatio < 0 && this.currentFrame < currentFrame)) {
            this._onLoop();

            // Need to reset animation events
            for (let index = 0; index < events.length; index++) {
                if (!events[index].onlyOnce) {
                    // reset event, the animation is looping
                    events[index].isDone = false;
                }
            }

            this._animationState.key = speedRatio > 0 ? 0 : animation.getKeys().length - 1;
        }
        this._currentFrame = currentFrame;
        this._animationState.repeatCount = frameRange === 0 ? 0 : (absoluteFrame / frameRange) >> 0;
        this._animationState.highLimitValue = highLimitValue;
        this._animationState.offsetValue = offsetValue;

        const currentValue = animation._interpolate(currentFrame, this._animationState);

        // Set value
        this.setValue(currentValue, weight);

        // Check events
        if (events.length) {
            for (let index = 0; index < events.length; index++) {
                // Make sure current frame has passed event frame and that event frame is within the current range
                // Also, handle both forward and reverse animations
                if (
                    (frameRange >= 0 && currentFrame >= events[index].frame && events[index].frame >= from) ||
                    (frameRange < 0 && currentFrame <= events[index].frame && events[index].frame <= from)
                ) {
                    const event = events[index];
                    if (!event.isDone) {
                        // If event should be done only once, remove it.
                        if (event.onlyOnce) {
                            events.splice(index, 1);
                            index--;
                        }
                        event.isDone = true;
                        event.action(currentFrame);
                    } // Don't do anything if the event has already been done.
                }
            }
        }

        if (!returnValue) {
            this._stopped = true;
        }

        return returnValue;
    }
}
