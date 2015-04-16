var BABYLON;
(function (BABYLON) {
    var Animation = (function () {
        function Animation(name, targetProperty, framePerSecond, dataType, loopMode) {
            this.name = name;
            this.targetProperty = targetProperty;
            this.framePerSecond = framePerSecond;
            this.dataType = dataType;
            this.loopMode = loopMode;
            this._offsetsCache = {};
            this._highLimitsCache = {};
            this._stopped = false;
            this.targetPropertyPath = targetProperty.split(".");
            this.dataType = dataType;
            this.loopMode = loopMode === undefined ? Animation.ANIMATIONLOOPMODE_CYCLE : loopMode;
        }
        Animation.CreateAndStartAnimation = function (name, mesh, tartgetProperty, framePerSecond, totalFrame, from, to, loopMode) {
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
            if (dataType == undefined) {
                return null;
            }
            var animation = new Animation(name, tartgetProperty, framePerSecond, dataType, loopMode);
            var keys = [];
            keys.push({ frame: 0, value: from });
            keys.push({ frame: totalFrame, value: to });
            animation.setKeys(keys);
            mesh.animations.push(animation);
            return mesh.getScene().beginAnimation(mesh, 0, totalFrame, (animation.loopMode === 1));
        };
        // Methods   
        Animation.prototype.isStopped = function () {
            return this._stopped;
        };
        Animation.prototype.getKeys = function () {
            return this._keys;
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
        Animation.prototype.color3InterpolateFunction = function (startValue, endValue, gradient) {
            return BABYLON.Color3.Lerp(startValue, endValue, gradient);
        };
        Animation.prototype.matrixInterpolateFunction = function (startValue, endValue, gradient) {
            var startScale = new BABYLON.Vector3(0, 0, 0);
            var startRotation = new BABYLON.Quaternion();
            var startTranslation = new BABYLON.Vector3(0, 0, 0);
            startValue.decompose(startScale, startRotation, startTranslation);
            var endScale = new BABYLON.Vector3(0, 0, 0);
            var endRotation = new BABYLON.Quaternion();
            var endTranslation = new BABYLON.Vector3(0, 0, 0);
            endValue.decompose(endScale, endRotation, endTranslation);
            var resultScale = this.vector3InterpolateFunction(startScale, endScale, gradient);
            var resultRotation = this.quaternionInterpolateFunction(startRotation, endRotation, gradient);
            var resultTranslation = this.vector3InterpolateFunction(startTranslation, endTranslation, gradient);
            var result = BABYLON.Matrix.Compose(resultScale, resultRotation, resultTranslation);
            return result;
        };
        Animation.prototype.clone = function () {
            var clone = new Animation(this.name, this.targetPropertyPath.join("."), this.framePerSecond, this.dataType, this.loopMode);
            clone.setKeys(this._keys);
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
                        case Animation.ANIMATIONTYPE_FLOAT:
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return this.floatInterpolateFunction(startValue, endValue, gradient);
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return offsetValue * repeatCount + this.floatInterpolateFunction(startValue, endValue, gradient);
                            }
                            break;
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
                        case Animation.ANIMATIONTYPE_VECTOR3:
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return this.vector3InterpolateFunction(startValue, endValue, gradient);
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return this.vector3InterpolateFunction(startValue, endValue, gradient).add(offsetValue.scale(repeatCount));
                            }
                        case Animation.ANIMATIONTYPE_VECTOR2:
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return this.vector2InterpolateFunction(startValue, endValue, gradient);
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return this.vector2InterpolateFunction(startValue, endValue, gradient).add(offsetValue.scale(repeatCount));
                            }
                        case Animation.ANIMATIONTYPE_COLOR3:
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return this.color3InterpolateFunction(startValue, endValue, gradient);
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return this.color3InterpolateFunction(startValue, endValue, gradient).add(offsetValue.scale(repeatCount));
                            }
                        case Animation.ANIMATIONTYPE_MATRIX:
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
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
        Animation.prototype.animate = function (delay, from, to, loop, speedRatio) {
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
                            case Animation.ANIMATIONTYPE_FLOAT:
                                this._offsetsCache[keyOffset] = toValue - fromValue;
                                break;
                            case Animation.ANIMATIONTYPE_QUATERNION:
                                this._offsetsCache[keyOffset] = toValue.subtract(fromValue);
                                break;
                            case Animation.ANIMATIONTYPE_VECTOR3:
                                this._offsetsCache[keyOffset] = toValue.subtract(fromValue);
                            case Animation.ANIMATIONTYPE_VECTOR2:
                                this._offsetsCache[keyOffset] = toValue.subtract(fromValue);
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
                    case Animation.ANIMATIONTYPE_FLOAT:
                        offsetValue = 0;
                        break;
                    case Animation.ANIMATIONTYPE_QUATERNION:
                        offsetValue = new BABYLON.Quaternion(0, 0, 0, 0);
                        break;
                    case Animation.ANIMATIONTYPE_VECTOR3:
                        offsetValue = BABYLON.Vector3.Zero();
                        break;
                    case Animation.ANIMATIONTYPE_VECTOR2:
                        offsetValue = BABYLON.Vector2.Zero();
                        break;
                    case Animation.ANIMATIONTYPE_COLOR3:
                        offsetValue = BABYLON.Color3.Black();
                }
            }
            // Compute value
            var repeatCount = (ratio / range) >> 0;
            var currentFrame = returnValue ? from + ratio % range : to;
            var currentValue = this._interpolate(currentFrame, repeatCount, this.loopMode, offsetValue, highLimitValue);
            // Set value
            if (this.targetPropertyPath.length > 1) {
                var property = this._target[this.targetPropertyPath[0]];
                for (var index = 1; index < this.targetPropertyPath.length - 1; index++) {
                    property = property[this.targetPropertyPath[index]];
                }
                property[this.targetPropertyPath[this.targetPropertyPath.length - 1]] = currentValue;
            }
            else {
                this._target[this.targetPropertyPath[0]] = currentValue;
            }
            if (this._target.markAsDirty) {
                this._target.markAsDirty(this.targetProperty);
            }
            if (!returnValue) {
                this._stopped = true;
            }
            return returnValue;
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
        // Statics
        Animation._ANIMATIONTYPE_FLOAT = 0;
        Animation._ANIMATIONTYPE_VECTOR3 = 1;
        Animation._ANIMATIONTYPE_QUATERNION = 2;
        Animation._ANIMATIONTYPE_MATRIX = 3;
        Animation._ANIMATIONTYPE_COLOR3 = 4;
        Animation._ANIMATIONTYPE_VECTOR2 = 5;
        Animation._ANIMATIONLOOPMODE_RELATIVE = 0;
        Animation._ANIMATIONLOOPMODE_CYCLE = 1;
        Animation._ANIMATIONLOOPMODE_CONSTANT = 2;
        return Animation;
    })();
    BABYLON.Animation = Animation;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.animation.js.map