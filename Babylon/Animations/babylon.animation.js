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
            this.targetPropertyPath = targetProperty.split(".");
            this.dataType = dataType;
            this.loopMode = loopMode === undefined ? Animation.ANIMATIONLOOPMODE_CYCLE : loopMode;
        }
        // Methods
        Animation.prototype.getKeys = function () {
            return this._keys;
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

        Animation.prototype.color3InterpolateFunction = function (startValue, endValue, gradient) {
            return BABYLON.Color3.Lerp(startValue, endValue, gradient);
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

        Animation.prototype._interpolate = function (currentFrame, repeatCount, loopMode, offsetValue, highLimitValue) {
            if (loopMode === Animation.ANIMATIONLOOPMODE_CONSTANT && repeatCount > 0) {
                return highLimitValue.clone ? highLimitValue.clone() : highLimitValue;
            }

            this.currentFrame = currentFrame;

            for (var key = 0; key < this._keys.length; key++) {
                if (this._keys[key + 1].frame >= currentFrame) {
                    var startValue = this._keys[key].value;
                    var endValue = this._keys[key + 1].value;
                    var gradient = (currentFrame - this._keys[key].frame) / (this._keys[key + 1].frame - this._keys[key].frame);

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
            return this._keys[this._keys.length - 1].value;
        };

        Animation.prototype.animate = function (target, delay, from, to, loop, speedRatio) {
            if (!this.targetPropertyPath || this.targetPropertyPath.length < 1) {
                return false;
            }

            var returnValue = true;

            // Adding a start key at frame 0 if missing
            if (this._keys[0].frame != 0) {
                var newKey = {
                    frame: 0,
                    value: this._keys[0].value
                };

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
            var ratio = delay * (this.framePerSecond * speedRatio) / 1000.0;

            if (ratio > range && !loop) {
                offsetValue = 0;
                returnValue = false;
                highLimitValue = this._keys[this._keys.length - 1].value;
            } else {
                // Get max value if required
                var offsetValue = 0;
                var highLimitValue = 0;
                if (this.loopMode != Animation.ANIMATIONLOOPMODE_CYCLE) {
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

            // Compute value
            var repeatCount = (ratio / range) >> 0;
            var currentFrame = returnValue ? from + ratio % range : to;
            var currentValue = this._interpolate(currentFrame, repeatCount, this.loopMode, offsetValue, highLimitValue);

            // Set value
            if (this.targetPropertyPath.length > 1) {
                var property = target[this.targetPropertyPath[0]];

                for (var index = 1; index < this.targetPropertyPath.length - 1; index++) {
                    property = property[this.targetPropertyPath[index]];
                }

                property[this.targetPropertyPath[this.targetPropertyPath.length - 1]] = currentValue;
            } else {
                target[this.targetPropertyPath[0]] = currentValue;
            }

            if (target.markAsDirty) {
                target.markAsDirty(this.targetProperty);
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
        Animation._ANIMATIONTYPE_FLOAT = 0;
        Animation._ANIMATIONTYPE_VECTOR3 = 1;
        Animation._ANIMATIONTYPE_QUATERNION = 2;
        Animation._ANIMATIONTYPE_MATRIX = 3;
        Animation._ANIMATIONTYPE_COLOR3 = 4;
        Animation._ANIMATIONLOOPMODE_RELATIVE = 0;
        Animation._ANIMATIONLOOPMODE_CYCLE = 1;
        Animation._ANIMATIONLOOPMODE_CONSTANT = 2;
        return Animation;
    })();
    BABYLON.Animation = Animation;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.animation.js.map
