module BABYLON {

    export class RuntimeAnimation {
        public currentFrame: number;
        private _animation: Animation;
        private _target: any;

        private _originalBlendValue: any;
        private _offsetsCache: {[key: string]: any} = {};
        private _highLimitsCache: {[key: string]: any} = {};
        private _stopped = false;
        private _blendingFactor = 0;
        
        public constructor(target: any, animation: Animation) {
            this._animation = animation;
            this._target = target;

            animation._runtimeAnimations.push(this);
        }

        public get animation(): Animation {
            return this._animation;
        }

        public reset(): void {
            this._offsetsCache = {};
            this._highLimitsCache = {};
            this.currentFrame = 0;
            this._blendingFactor = 0;
            this._originalBlendValue = null;
        }

        public isStopped(): boolean {
            return this._stopped;
        }        

        public dispose(): void {
            let index = this._animation.runtimeAnimations.indexOf(this);

            if (index > -1) {
                this._animation.runtimeAnimations.splice(index, 1);
            }
        }

        private _getKeyValue(value: any): any {
            if (typeof value === "function") {
                return value();
            }

            return value;
        }      
        
        private _interpolate(currentFrame: number, repeatCount: number, loopMode?: number, offsetValue?: any, highLimitValue?: any) {
            if (loopMode === Animation.ANIMATIONLOOPMODE_CONSTANT && repeatCount > 0) {
                return highLimitValue.clone ? highLimitValue.clone() : highLimitValue;
            }

            this.currentFrame = currentFrame;

            let keys = this._animation.getKeys();

            // Try to get a hash to find the right key
            var startKeyIndex = Math.max(0, Math.min(keys.length - 1, Math.floor(keys.length * (currentFrame - keys[0].frame) / (keys[keys.length - 1].frame - keys[0].frame)) - 1));

            if (keys[startKeyIndex].frame >= currentFrame) {
                while (startKeyIndex - 1 >= 0 && keys[startKeyIndex].frame >= currentFrame) {
                    startKeyIndex--;
                }
            }

            for (var key = startKeyIndex; key < keys.length; key++) {
                var endKey = keys[key + 1];

                if (endKey.frame >= currentFrame) {

                    var startKey = keys[key];
                    var startValue = this._getKeyValue(startKey.value);
                    var endValue = this._getKeyValue(endKey.value);

                    var useTangent = startKey.outTangent !== undefined && endKey.inTangent !== undefined;
                    var frameDelta = endKey.frame - startKey.frame;

                    // gradient : percent of currentFrame between the frame inf and the frame sup
                    var gradient = (currentFrame - startKey.frame) / frameDelta;

                    // check for easingFunction and correction of gradient
                    let easingFunction = this._animation.getEasingFunction();
                    if (easingFunction != null) {
                        gradient = easingFunction.ease(gradient);
                    }

                    switch (this._animation.dataType) {
                        // Float
                        case Animation.ANIMATIONTYPE_FLOAT:
                            var floatValue = useTangent ? this._animation.floatInterpolateFunctionWithTangents(startValue, startKey.outTangent * frameDelta, endValue, endKey.inTangent * frameDelta, gradient) : this._animation.floatInterpolateFunction(startValue, endValue, gradient);
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return floatValue;
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return offsetValue * repeatCount + floatValue;
                            }
                            break;
                        // Quaternion
                        case Animation.ANIMATIONTYPE_QUATERNION:
                            var quatValue = useTangent ? this._animation.quaternionInterpolateFunctionWithTangents(startValue, startKey.outTangent.scale(frameDelta), endValue, endKey.inTangent.scale(frameDelta), gradient) : this._animation.quaternionInterpolateFunction(startValue, endValue, gradient);
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return quatValue;
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return quatValue.add(offsetValue.scale(repeatCount));
                            }

                            return quatValue;
                        // Vector3
                        case Animation.ANIMATIONTYPE_VECTOR3:
                            var vec3Value = useTangent ? this._animation.vector3InterpolateFunctionWithTangents(startValue, startKey.outTangent.scale(frameDelta), endValue, endKey.inTangent.scale(frameDelta), gradient) : this._animation.vector3InterpolateFunction(startValue, endValue, gradient);
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return vec3Value;
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return vec3Value.add(offsetValue.scale(repeatCount));
                            }
                        // Vector2
                        case Animation.ANIMATIONTYPE_VECTOR2:
                            var vec2Value = useTangent ? this._animation.vector2InterpolateFunctionWithTangents(startValue, startKey.outTangent.scale(frameDelta), endValue, endKey.inTangent.scale(frameDelta), gradient) : this._animation.vector2InterpolateFunction(startValue, endValue, gradient);
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return vec2Value;
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return vec2Value.add(offsetValue.scale(repeatCount));
                            }
                        // Size
                        case Animation.ANIMATIONTYPE_SIZE:
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return this._animation.sizeInterpolateFunction(startValue, endValue, gradient);
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return this._animation.sizeInterpolateFunction(startValue, endValue, gradient).add(offsetValue.scale(repeatCount));
                            }
                        // Color3
                        case Animation.ANIMATIONTYPE_COLOR3:
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return this._animation.color3InterpolateFunction(startValue, endValue, gradient);
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return this._animation.color3InterpolateFunction(startValue, endValue, gradient).add(offsetValue.scale(repeatCount));
                            }
                        // Matrix
                        case Animation.ANIMATIONTYPE_MATRIX:
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    if (Animation.AllowMatricesInterpolation) {
                                        return this._animation.matrixInterpolateFunction(startValue, endValue, gradient);
                                    }
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return startValue;
                            }
                        default:
                            break;
                    }
                    break;
                }
            }
            return this._getKeyValue(keys[keys.length - 1].value);
        }

        public setValue(currentValue: any, blend: boolean = false): void {
            // Set value
            var path: any;
            var destination: any;

            let targetPropertyPath = this._animation.targetPropertyPath

            if (targetPropertyPath.length > 1) {
                var property = this._target[targetPropertyPath[0]];

                for (var index = 1; index < targetPropertyPath.length - 1; index++) {
                    property = property[targetPropertyPath[index]];
                }

                path = targetPropertyPath[targetPropertyPath.length - 1];
                destination = property;
            } else {
                path = targetPropertyPath[0];
                destination = this._target;
            }

            // Blending
            if (this._animation.enableBlending && this._blendingFactor <= 1.0) {
                if (!this._originalBlendValue) {
                    if (destination[path].clone) {
                        this._originalBlendValue = destination[path].clone();
                    } else {
                        this._originalBlendValue = destination[path];
                    }
                }

                if (this._originalBlendValue.prototype) { // Complex value
                    
                    if (this._originalBlendValue.prototype.Lerp) { // Lerp supported
                        destination[path] = this._originalBlendValue.construtor.prototype.Lerp(currentValue, this._originalBlendValue, this._blendingFactor);
                    } else { // Blending not supported
                        destination[path] = currentValue;
                    }

                } else if (this._originalBlendValue.m) { // Matrix
                    destination[path] = Matrix.Lerp(this._originalBlendValue, currentValue, this._blendingFactor);
                } else { // Direct value
                    destination[path] = this._originalBlendValue * (1.0 - this._blendingFactor) + this._blendingFactor * currentValue;
                }
                this._blendingFactor += this._animation.blendingSpeed;
            } else {
                destination[path] = currentValue;
            }

            if (this._target.markAsDirty) {
                this._target.markAsDirty(this._animation.targetProperty);
            }
        }

        public goToFrame(frame: number): void {
            let keys = this._animation.getKeys();

            if (frame < keys[0].frame) {
                frame = keys[0].frame;
            } else if (frame > keys[keys.length - 1].frame) {
                frame = keys[keys.length - 1].frame;
            }

            var currentValue = this._interpolate(frame, 0, this._animation.loopMode);

            this.setValue(currentValue);
        }

        public _prepareForSpeedRatioChange(newSpeedRatio: number): void {
            let newRatio = this._previousDelay * (this._animation.framePerSecond * newSpeedRatio) / 1000.0;

            this._ratioOffset = this._previousRatio - newRatio;
        }

        private _ratioOffset = 0;
        private _previousDelay: number;
        private _previousRatio: number;

        public animate(delay: number, from: number, to: number, loop: boolean, speedRatio: number, blend: boolean = false): boolean {
            let targetPropertyPath = this._animation.targetPropertyPath
            if (!targetPropertyPath || targetPropertyPath.length < 1) {
                this._stopped = true;
                return false;
            }
            var returnValue = true;
            let keys = this._animation.getKeys();

            // Adding a start key at frame 0 if missing
            if (keys[0].frame !== 0) {
                var newKey = { frame: 0, value: keys[0].value };
                keys.splice(0, 0, newKey);
            }

            // Check limits
            if (from < keys[0].frame || from > keys[keys.length - 1].frame) {
                from = keys[0].frame;
            }
            if (to < keys[0].frame || to > keys[keys.length - 1].frame) {
                to = keys[keys.length - 1].frame;
            }

            //to and from cannot be the same key
            if(from === to) {
                if (from > keys[0].frame) {
                    from--;
                } else if (to < keys[keys.length - 1].frame) {
                    to++;
                }
            }
            
            // Compute ratio
            var range = to - from;
            var offsetValue;
            // ratio represents the frame delta between from and to
            var ratio = (delay * (this._animation.framePerSecond * speedRatio) / 1000.0) + this._ratioOffset;
            var highLimitValue = 0;

            this._previousDelay = delay;
            this._previousRatio = ratio;

            if (((to > from && ratio > range) || (from > to && ratio < range)) && !loop) { // If we are out of range and not looping get back to caller
                returnValue = false;
                highLimitValue = this._getKeyValue(keys[keys.length - 1].value);
            } else {
                // Get max value if required

                if (this._animation.loopMode !== Animation.ANIMATIONLOOPMODE_CYCLE) {

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
                        offsetValue = new Quaternion(0, 0, 0, 0);
                        break;
                    // Vector3
                    case Animation.ANIMATIONTYPE_VECTOR3:
                        offsetValue = Vector3.Zero();
                        break;
                    // Vector2
                    case Animation.ANIMATIONTYPE_VECTOR2:
                        offsetValue = Vector2.Zero();
                        break;
                    // Size
                    case Animation.ANIMATIONTYPE_SIZE:
                        offsetValue = Size.Zero();
                        break;
                    // Color3
                    case Animation.ANIMATIONTYPE_COLOR3:
                        offsetValue = Color3.Black();
                }
            }

            // Compute value
            var repeatCount = (ratio / range) >> 0;
            var currentFrame = returnValue ? from + ratio % range : to;
            var currentValue = this._interpolate(currentFrame, repeatCount, this._animation.loopMode, offsetValue, highLimitValue);

            // Set value
            this.setValue(currentValue);
            // Check events
            let events = this._animation.getEvents();
            for (var index = 0; index < events.length; index++) {
                // Make sure current frame has passed event frame and that event frame is within the current range
                // Also, handle both forward and reverse animations
                if (
                    (range > 0 && currentFrame >= events[index].frame && events[index].frame >= from) ||
                    (range < 0 && currentFrame <= events[index].frame && events[index].frame <= from)
                ){
                    var event = events[index];
                    if (!event.isDone) {
                        // If event should be done only once, remove it.
                        if (event.onlyOnce) {
                            events.splice(index, 1);
                            index--;
                        }
                        event.isDone = true;
                        event.action();
                    } // Don't do anything if the event has already be done.
                } else if (events[index].isDone && !events[index].onlyOnce) {
                    // reset event, the animation is looping
                    events[index].isDone = false;
                }
            }
            if (!returnValue) {
                this._stopped = true;
            }

            return returnValue;
        }
    }
} 


