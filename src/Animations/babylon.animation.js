var BABYLON;
(function (BABYLON) {
    var AnimationRange = (function () {
        function AnimationRange(name, from, to) {
            this.name = name;
            this.from = from;
            this.to = to;
        }
        AnimationRange.prototype.clone = function () {
            return new AnimationRange(this.name, this.from, this.to);
        };
        return AnimationRange;
    }());
    BABYLON.AnimationRange = AnimationRange;
    /**
     * Composed of a frame, and an action function
     */
    var AnimationEvent = (function () {
        function AnimationEvent(frame, action, onlyOnce) {
            this.frame = frame;
            this.action = action;
            this.onlyOnce = onlyOnce;
            this.isDone = false;
        }
        return AnimationEvent;
    }());
    BABYLON.AnimationEvent = AnimationEvent;
    var PathCursor = (function () {
        function PathCursor(path) {
            this.path = path;
            this._onchange = new Array();
            this.value = 0;
            this.animations = new Array();
        }
        PathCursor.prototype.getPoint = function () {
            var point = this.path.getPointAtLengthPosition(this.value);
            return new BABYLON.Vector3(point.x, 0, point.y);
        };
        PathCursor.prototype.moveAhead = function (step) {
            if (step === void 0) { step = 0.002; }
            this.move(step);
            return this;
        };
        PathCursor.prototype.moveBack = function (step) {
            if (step === void 0) { step = 0.002; }
            this.move(-step);
            return this;
        };
        PathCursor.prototype.move = function (step) {
            if (Math.abs(step) > 1) {
                throw "step size should be less than 1.";
            }
            this.value += step;
            this.ensureLimits();
            this.raiseOnChange();
            return this;
        };
        PathCursor.prototype.ensureLimits = function () {
            while (this.value > 1) {
                this.value -= 1;
            }
            while (this.value < 0) {
                this.value += 1;
            }
            return this;
        };
        // used by animation engine
        PathCursor.prototype.markAsDirty = function (propertyName) {
            this.ensureLimits();
            this.raiseOnChange();
            return this;
        };
        PathCursor.prototype.raiseOnChange = function () {
            var _this = this;
            this._onchange.forEach(function (f) { return f(_this); });
            return this;
        };
        PathCursor.prototype.onchange = function (f) {
            this._onchange.push(f);
            return this;
        };
        return PathCursor;
    }());
    BABYLON.PathCursor = PathCursor;
    var Animation = (function () {
        function Animation(name, targetProperty, framePerSecond, dataType, loopMode, enableBlending) {
            this.name = name;
            this.targetProperty = targetProperty;
            this.framePerSecond = framePerSecond;
            this.dataType = dataType;
            this.loopMode = loopMode;
            this.enableBlending = enableBlending;
            this._offsetsCache = {};
            this._highLimitsCache = {};
            this._stopped = false;
            this._blendingFactor = 0;
            // The set of event that will be linked to this animation
            this._events = new Array();
            this.allowMatricesInterpolation = false;
            this.blendingSpeed = 0.01;
            this._ranges = {};
            this.targetPropertyPath = targetProperty.split(".");
            this.dataType = dataType;
            this.loopMode = loopMode === undefined ? Animation.ANIMATIONLOOPMODE_CYCLE : loopMode;
        }
        Animation._PrepareAnimation = function (name, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction) {
            var dataType = undefined;
            if (!isNaN(parseFloat(from)) && isFinite(from)) {
                dataType = Animation.ANIMATIONTYPE_FLOAT;
            }
            else if (from instanceof BABYLON.Quaternion) {
                dataType = Animation.ANIMATIONTYPE_QUATERNION;
            }
            else if (from instanceof BABYLON.Vector3) {
                dataType = Animation.ANIMATIONTYPE_VECTOR3;
            }
            else if (from instanceof BABYLON.Vector2) {
                dataType = Animation.ANIMATIONTYPE_VECTOR2;
            }
            else if (from instanceof BABYLON.Color3) {
                dataType = Animation.ANIMATIONTYPE_COLOR3;
            }
            else if (from instanceof BABYLON.Size) {
                dataType = Animation.ANIMATIONTYPE_SIZE;
            }
            if (dataType == undefined) {
                return null;
            }
            var animation = new Animation(name, targetProperty, framePerSecond, dataType, loopMode);
            var keys = [{ frame: 0, value: from }, { frame: totalFrame, value: to }];
            animation.setKeys(keys);
            if (easingFunction !== undefined) {
                animation.setEasingFunction(easingFunction);
            }
            return animation;
        };
        Animation.CreateAndStartAnimation = function (name, node, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction, onAnimationEnd) {
            var animation = Animation._PrepareAnimation(name, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction);
            return node.getScene().beginDirectAnimation(node, [animation], 0, totalFrame, (animation.loopMode === 1), 1.0, onAnimationEnd);
        };
        Animation.CreateMergeAndStartAnimation = function (name, node, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction, onAnimationEnd) {
            var animation = Animation._PrepareAnimation(name, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction);
            node.animations.push(animation);
            return node.getScene().beginAnimation(node, 0, totalFrame, (animation.loopMode === 1), 1.0, onAnimationEnd);
        };
        // Methods
        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        Animation.prototype.toString = function (fullDetails) {
            var ret = "Name: " + this.name + ", property: " + this.targetProperty;
            ret += ", datatype: " + (["Float", "Vector3", "Quaternion", "Matrix", "Color3", "Vector2"])[this.dataType];
            ret += ", nKeys: " + (this._keys ? this._keys.length : "none");
            ret += ", nRanges: " + (this._ranges ? Object.keys(this._ranges).length : "none");
            if (fullDetails) {
                ret += ", Ranges: {";
                var first = true;
                for (var name in this._ranges) {
                    if (first) {
                        ret += ", ";
                        first = false;
                    }
                    ret += name;
                }
                ret += "}";
            }
            return ret;
        };
        /**
         * Add an event to this animation.
         */
        Animation.prototype.addEvent = function (event) {
            this._events.push(event);
        };
        /**
         * Remove all events found at the given frame
         * @param frame
         */
        Animation.prototype.removeEvents = function (frame) {
            for (var index = 0; index < this._events.length; index++) {
                if (this._events[index].frame === frame) {
                    this._events.splice(index, 1);
                    index--;
                }
            }
        };
        Animation.prototype.createRange = function (name, from, to) {
            // check name not already in use; could happen for bones after serialized
            if (!this._ranges[name]) {
                this._ranges[name] = new AnimationRange(name, from, to);
            }
        };
        Animation.prototype.deleteRange = function (name, deleteFrames) {
            if (deleteFrames === void 0) { deleteFrames = true; }
            if (this._ranges[name]) {
                if (deleteFrames) {
                    var from = this._ranges[name].from;
                    var to = this._ranges[name].to;
                    // this loop MUST go high to low for multiple splices to work
                    for (var key = this._keys.length - 1; key >= 0; key--) {
                        if (this._keys[key].frame >= from && this._keys[key].frame <= to) {
                            this._keys.splice(key, 1);
                        }
                    }
                }
                this._ranges[name] = undefined; // said much faster than 'delete this._range[name]' 
            }
        };
        Animation.prototype.getRange = function (name) {
            return this._ranges[name];
        };
        Animation.prototype.reset = function () {
            this._offsetsCache = {};
            this._highLimitsCache = {};
            this.currentFrame = 0;
            this._blendingFactor = 0;
            this._originalBlendValue = null;
        };
        Animation.prototype.isStopped = function () {
            return this._stopped;
        };
        Animation.prototype.getKeys = function () {
            return this._keys;
        };
        Animation.prototype.getHighestFrame = function () {
            var ret = 0;
            for (var key = 0, nKeys = this._keys.length; key < nKeys; key++) {
                if (ret < this._keys[key].frame) {
                    ret = this._keys[key].frame;
                }
            }
            return ret;
        };
        Animation.prototype.getEasingFunction = function () {
            return this._easingFunction;
        };
        Animation.prototype.setEasingFunction = function (easingFunction) {
            this._easingFunction = easingFunction;
        };
        Animation.prototype.floatInterpolateFunction = function (startValue, endValue, gradient) {
            return startValue + (endValue - startValue) * gradient;
        };
        Animation.prototype.quaternionInterpolateFunction = function (startValue, endValue, gradient) {
            return BABYLON.Quaternion.Slerp(startValue, endValue, gradient);
        };
        Animation.prototype.vector3InterpolateFunction = function (startValue, endValue, gradient) {
            return BABYLON.Vector3.Lerp(startValue, endValue, gradient);
        };
        Animation.prototype.vector2InterpolateFunction = function (startValue, endValue, gradient) {
            return BABYLON.Vector2.Lerp(startValue, endValue, gradient);
        };
        Animation.prototype.sizeInterpolateFunction = function (startValue, endValue, gradient) {
            return BABYLON.Size.Lerp(startValue, endValue, gradient);
        };
        Animation.prototype.color3InterpolateFunction = function (startValue, endValue, gradient) {
            return BABYLON.Color3.Lerp(startValue, endValue, gradient);
        };
        Animation.prototype.matrixInterpolateFunction = function (startValue, endValue, gradient) {
            return BABYLON.Matrix.Lerp(startValue, endValue, gradient);
        };
        Animation.prototype.clone = function () {
            var clone = new Animation(this.name, this.targetPropertyPath.join("."), this.framePerSecond, this.dataType, this.loopMode);
            if (this._keys) {
                clone.setKeys(this._keys);
            }
            if (this._ranges) {
                clone._ranges = {};
                for (var name in this._ranges) {
                    clone._ranges[name] = this._ranges[name].clone();
                }
            }
            return clone;
        };
        Animation.prototype.setKeys = function (values) {
            this._keys = values.slice(0);
            this._offsetsCache = {};
            this._highLimitsCache = {};
        };
        Animation.prototype._getKeyValue = function (value) {
            if (typeof value === "function") {
                return value();
            }
            return value;
        };
        Animation.prototype._interpolate = function (currentFrame, repeatCount, loopMode, offsetValue, highLimitValue) {
            if (loopMode === Animation.ANIMATIONLOOPMODE_CONSTANT && repeatCount > 0) {
                return highLimitValue.clone ? highLimitValue.clone() : highLimitValue;
            }
            this.currentFrame = currentFrame;
            // Try to get a hash to find the right key
            var startKey = Math.max(0, Math.min(this._keys.length - 1, Math.floor(this._keys.length * (currentFrame - this._keys[0].frame) / (this._keys[this._keys.length - 1].frame - this._keys[0].frame)) - 1));
            if (this._keys[startKey].frame >= currentFrame) {
                while (startKey - 1 >= 0 && this._keys[startKey].frame >= currentFrame) {
                    startKey--;
                }
            }
            for (var key = startKey; key < this._keys.length; key++) {
                if (this._keys[key + 1].frame >= currentFrame) {
                    var startValue = this._getKeyValue(this._keys[key].value);
                    var endValue = this._getKeyValue(this._keys[key + 1].value);
                    // gradient : percent of currentFrame between the frame inf and the frame sup
                    var gradient = (currentFrame - this._keys[key].frame) / (this._keys[key + 1].frame - this._keys[key].frame);
                    // check for easingFunction and correction of gradient
                    if (this._easingFunction != null) {
                        gradient = this._easingFunction.ease(gradient);
                    }
                    switch (this.dataType) {
                        // Float
                        case Animation.ANIMATIONTYPE_FLOAT:
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return this.floatInterpolateFunction(startValue, endValue, gradient);
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return offsetValue * repeatCount + this.floatInterpolateFunction(startValue, endValue, gradient);
                            }
                            break;
                        // Quaternion
                        case Animation.ANIMATIONTYPE_QUATERNION:
                            var quaternion = null;
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    quaternion = this.quaternionInterpolateFunction(startValue, endValue, gradient);
                                    break;
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    quaternion = this.quaternionInterpolateFunction(startValue, endValue, gradient).add(offsetValue.scale(repeatCount));
                                    break;
                            }
                            return quaternion;
                        // Vector3
                        case Animation.ANIMATIONTYPE_VECTOR3:
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return this.vector3InterpolateFunction(startValue, endValue, gradient);
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return this.vector3InterpolateFunction(startValue, endValue, gradient).add(offsetValue.scale(repeatCount));
                            }
                        // Vector2
                        case Animation.ANIMATIONTYPE_VECTOR2:
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return this.vector2InterpolateFunction(startValue, endValue, gradient);
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return this.vector2InterpolateFunction(startValue, endValue, gradient).add(offsetValue.scale(repeatCount));
                            }
                        // Size
                        case Animation.ANIMATIONTYPE_SIZE:
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return this.sizeInterpolateFunction(startValue, endValue, gradient);
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return this.sizeInterpolateFunction(startValue, endValue, gradient).add(offsetValue.scale(repeatCount));
                            }
                        // Color3
                        case Animation.ANIMATIONTYPE_COLOR3:
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return this.color3InterpolateFunction(startValue, endValue, gradient);
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return this.color3InterpolateFunction(startValue, endValue, gradient).add(offsetValue.scale(repeatCount));
                            }
                        // Matrix
                        case Animation.ANIMATIONTYPE_MATRIX:
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    if (this.allowMatricesInterpolation) {
                                        return this.matrixInterpolateFunction(startValue, endValue, gradient);
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
            return this._getKeyValue(this._keys[this._keys.length - 1].value);
        };
        Animation.prototype.setValue = function (currentValue, blend) {
            if (blend === void 0) { blend = false; }
            // Set value
            var path;
            var destination;
            if (this.targetPropertyPath.length > 1) {
                var property = this._target[this.targetPropertyPath[0]];
                for (var index = 1; index < this.targetPropertyPath.length - 1; index++) {
                    property = property[this.targetPropertyPath[index]];
                }
                path = this.targetPropertyPath[this.targetPropertyPath.length - 1];
                destination = property;
            }
            else {
                path = this.targetPropertyPath[0];
                destination = this._target;
            }
            // Blending
            if (this.enableBlending && this._blendingFactor <= 1.0) {
                if (!this._originalBlendValue) {
                    if (destination[path].clone) {
                        this._originalBlendValue = destination[path].clone();
                    }
                    else {
                        this._originalBlendValue = destination[path];
                    }
                }
                if (this._originalBlendValue.prototype) {
                    if (this._originalBlendValue.prototype.Lerp) {
                        destination[path] = this._originalBlendValue.construtor.prototype.Lerp(currentValue, this._originalBlendValue, this._blendingFactor);
                    }
                    else {
                        destination[path] = currentValue;
                    }
                }
                else if (this._originalBlendValue.m) {
                    destination[path] = BABYLON.Matrix.Lerp(this._originalBlendValue, currentValue, this._blendingFactor);
                }
                else {
                    destination[path] = this._originalBlendValue * (1.0 - this._blendingFactor) + this._blendingFactor * currentValue;
                }
                this._blendingFactor += this.blendingSpeed;
            }
            else {
                destination[path] = currentValue;
            }
            if (this._target.markAsDirty) {
                this._target.markAsDirty(this.targetProperty);
            }
        };
        Animation.prototype.goToFrame = function (frame) {
            if (frame < this._keys[0].frame) {
                frame = this._keys[0].frame;
            }
            else if (frame > this._keys[this._keys.length - 1].frame) {
                frame = this._keys[this._keys.length - 1].frame;
            }
            var currentValue = this._interpolate(frame, 0, this.loopMode);
            this.setValue(currentValue);
        };
        Animation.prototype.animate = function (delay, from, to, loop, speedRatio, blend) {
            if (blend === void 0) { blend = false; }
            if (!this.targetPropertyPath || this.targetPropertyPath.length < 1) {
                this._stopped = true;
                return false;
            }
            var returnValue = true;
            // Adding a start key at frame 0 if missing
            if (this._keys[0].frame !== 0) {
                var newKey = { frame: 0, value: this._keys[0].value };
                this._keys.splice(0, 0, newKey);
            }
            // Check limits
            if (from < this._keys[0].frame || from > this._keys[this._keys.length - 1].frame) {
                from = this._keys[0].frame;
            }
            if (to < this._keys[0].frame || to > this._keys[this._keys.length - 1].frame) {
                to = this._keys[this._keys.length - 1].frame;
            }
            // Compute ratio
            var range = to - from;
            var offsetValue;
            // ratio represents the frame delta between from and to
            var ratio = delay * (this.framePerSecond * speedRatio) / 1000.0;
            var highLimitValue = 0;
            if (ratio > range && !loop) {
                returnValue = false;
                highLimitValue = this._getKeyValue(this._keys[this._keys.length - 1].value);
            }
            else {
                // Get max value if required
                if (this.loopMode !== Animation.ANIMATIONLOOPMODE_CYCLE) {
                    var keyOffset = to.toString() + from.toString();
                    if (!this._offsetsCache[keyOffset]) {
                        var fromValue = this._interpolate(from, 0, Animation.ANIMATIONLOOPMODE_CYCLE);
                        var toValue = this._interpolate(to, 0, Animation.ANIMATIONLOOPMODE_CYCLE);
                        switch (this.dataType) {
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
                switch (this.dataType) {
                    // Float
                    case Animation.ANIMATIONTYPE_FLOAT:
                        offsetValue = 0;
                        break;
                    // Quaternion
                    case Animation.ANIMATIONTYPE_QUATERNION:
                        offsetValue = new BABYLON.Quaternion(0, 0, 0, 0);
                        break;
                    // Vector3
                    case Animation.ANIMATIONTYPE_VECTOR3:
                        offsetValue = BABYLON.Vector3.Zero();
                        break;
                    // Vector2
                    case Animation.ANIMATIONTYPE_VECTOR2:
                        offsetValue = BABYLON.Vector2.Zero();
                        break;
                    // Size
                    case Animation.ANIMATIONTYPE_SIZE:
                        offsetValue = BABYLON.Size.Zero();
                        break;
                    // Color3
                    case Animation.ANIMATIONTYPE_COLOR3:
                        offsetValue = BABYLON.Color3.Black();
                }
            }
            // Compute value
            var repeatCount = (ratio / range) >> 0;
            var currentFrame = returnValue ? from + ratio % range : to;
            var currentValue = this._interpolate(currentFrame, repeatCount, this.loopMode, offsetValue, highLimitValue);
            // Set value
            this.setValue(currentValue);
            // Check events
            for (var index = 0; index < this._events.length; index++) {
                if (currentFrame >= this._events[index].frame) {
                    var event = this._events[index];
                    if (!event.isDone) {
                        // If event should be done only once, remove it.
                        if (event.onlyOnce) {
                            this._events.splice(index, 1);
                            index--;
                        }
                        event.isDone = true;
                        event.action();
                    } // Don't do anything if the event has already be done.
                }
                else if (this._events[index].isDone && !this._events[index].onlyOnce) {
                    // reset event, the animation is looping
                    this._events[index].isDone = false;
                }
            }
            if (!returnValue) {
                this._stopped = true;
            }
            return returnValue;
        };
        Animation.prototype.serialize = function () {
            var serializationObject = {};
            serializationObject.name = this.name;
            serializationObject.property = this.targetProperty;
            serializationObject.framePerSecond = this.framePerSecond;
            serializationObject.dataType = this.dataType;
            serializationObject.loopBehavior = this.loopMode;
            var dataType = this.dataType;
            serializationObject.keys = [];
            var keys = this.getKeys();
            for (var index = 0; index < keys.length; index++) {
                var animationKey = keys[index];
                var key = {};
                key.frame = animationKey.frame;
                switch (dataType) {
                    case Animation.ANIMATIONTYPE_FLOAT:
                        key.values = [animationKey.value];
                        break;
                    case Animation.ANIMATIONTYPE_QUATERNION:
                    case Animation.ANIMATIONTYPE_MATRIX:
                    case Animation.ANIMATIONTYPE_VECTOR3:
                    case Animation.ANIMATIONTYPE_COLOR3:
                        key.values = animationKey.value.asArray();
                        break;
                }
                serializationObject.keys.push(key);
            }
            serializationObject.ranges = [];
            for (var name in this._ranges) {
                var range = {};
                range.name = name;
                range.from = this._ranges[name].from;
                range.to = this._ranges[name].to;
                serializationObject.ranges.push(range);
            }
            return serializationObject;
        };
        Object.defineProperty(Animation, "ANIMATIONTYPE_FLOAT", {
            get: function () {
                return Animation._ANIMATIONTYPE_FLOAT;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation, "ANIMATIONTYPE_VECTOR3", {
            get: function () {
                return Animation._ANIMATIONTYPE_VECTOR3;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation, "ANIMATIONTYPE_VECTOR2", {
            get: function () {
                return Animation._ANIMATIONTYPE_VECTOR2;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation, "ANIMATIONTYPE_SIZE", {
            get: function () {
                return Animation._ANIMATIONTYPE_SIZE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation, "ANIMATIONTYPE_QUATERNION", {
            get: function () {
                return Animation._ANIMATIONTYPE_QUATERNION;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation, "ANIMATIONTYPE_MATRIX", {
            get: function () {
                return Animation._ANIMATIONTYPE_MATRIX;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation, "ANIMATIONTYPE_COLOR3", {
            get: function () {
                return Animation._ANIMATIONTYPE_COLOR3;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation, "ANIMATIONLOOPMODE_RELATIVE", {
            get: function () {
                return Animation._ANIMATIONLOOPMODE_RELATIVE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation, "ANIMATIONLOOPMODE_CYCLE", {
            get: function () {
                return Animation._ANIMATIONLOOPMODE_CYCLE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation, "ANIMATIONLOOPMODE_CONSTANT", {
            get: function () {
                return Animation._ANIMATIONLOOPMODE_CONSTANT;
            },
            enumerable: true,
            configurable: true
        });
        Animation.Parse = function (parsedAnimation) {
            var animation = new Animation(parsedAnimation.name, parsedAnimation.property, parsedAnimation.framePerSecond, parsedAnimation.dataType, parsedAnimation.loopBehavior);
            var dataType = parsedAnimation.dataType;
            var keys = [];
            var data;
            var index;
            for (index = 0; index < parsedAnimation.keys.length; index++) {
                var key = parsedAnimation.keys[index];
                switch (dataType) {
                    case Animation.ANIMATIONTYPE_FLOAT:
                        data = key.values[0];
                        break;
                    case Animation.ANIMATIONTYPE_QUATERNION:
                        data = BABYLON.Quaternion.FromArray(key.values);
                        break;
                    case Animation.ANIMATIONTYPE_MATRIX:
                        data = BABYLON.Matrix.FromArray(key.values);
                        break;
                    case Animation.ANIMATIONTYPE_COLOR3:
                        data = BABYLON.Color3.FromArray(key.values);
                        break;
                    case Animation.ANIMATIONTYPE_VECTOR3:
                    default:
                        data = BABYLON.Vector3.FromArray(key.values);
                        break;
                }
                keys.push({
                    frame: key.frame,
                    value: data
                });
            }
            animation.setKeys(keys);
            if (parsedAnimation.ranges) {
                for (index = 0; index < parsedAnimation.ranges.length; index++) {
                    data = parsedAnimation.ranges[index];
                    animation.createRange(data.name, data.from, data.to);
                }
            }
            return animation;
        };
        Animation.AppendSerializedAnimations = function (source, destination) {
            if (source.animations) {
                destination.animations = [];
                for (var animationIndex = 0; animationIndex < source.animations.length; animationIndex++) {
                    var animation = source.animations[animationIndex];
                    destination.animations.push(animation.serialize());
                }
            }
        };
        // Statics
        Animation._ANIMATIONTYPE_FLOAT = 0;
        Animation._ANIMATIONTYPE_VECTOR3 = 1;
        Animation._ANIMATIONTYPE_QUATERNION = 2;
        Animation._ANIMATIONTYPE_MATRIX = 3;
        Animation._ANIMATIONTYPE_COLOR3 = 4;
        Animation._ANIMATIONTYPE_VECTOR2 = 5;
        Animation._ANIMATIONTYPE_SIZE = 6;
        Animation._ANIMATIONLOOPMODE_RELATIVE = 0;
        Animation._ANIMATIONLOOPMODE_CYCLE = 1;
        Animation._ANIMATIONLOOPMODE_CONSTANT = 2;
        return Animation;
    }());
    BABYLON.Animation = Animation;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.animation.js.map