var BABYLON = BABYLON || {};

(function () {
    BABYLON.Animation = function (name, targetProperty, framePerSecond, dataType, loopMode) {
        this.name = name;
        this.targetPropertyPath = targetProperty.split(".");
        this.framePerSecond = framePerSecond;
        this.dataType = dataType;
        this.loopMode = loopMode === undefined ? BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE : loopMode;

        this._keys = [];
        
        // Cache
        this._offsetsCache = {};
        this._highLimitsCache = {};
    };

    // Methods   
    BABYLON.Animation.prototype.clone = function() {
        var clone = new BABYLON.Animation(this.name, this.targetPropertyPath.join("."), this.framePerSecond, this.dataType, this.loopMode);

        clone.setKeys(this._keys);

        return clone;
    };

    BABYLON.Animation.prototype.setKeys = function(values) {
        this._keys = values.slice(0);
        this._offsetsCache = {};
        this._highLimitsCache = {};
    };

    BABYLON.Animation.prototype._interpolate = function (currentFrame, repeatCount, loopMode, offsetValue, highLimitValue) {
        if (loopMode === BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT && repeatCount > 0) {
            return highLimitValue.clone ? highLimitValue.clone() : highLimitValue;
        }
        
        for (var key = 0; key < this._keys.length; key++) {
            if (this._keys[key + 1].frame >= currentFrame) {
                var startValue = this._keys[key].value;
                var endValue = this._keys[key + 1].value;
                var gradient = (currentFrame - this._keys[key].frame) / (this._keys[key + 1].frame - this._keys[key].frame);

                switch (this.dataType) {
                    // Float
                    case BABYLON.Animation.ANIMATIONTYPE_FLOAT:
                        switch (loopMode) {
                            case BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE:
                            case BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT:
                                return startValue + (endValue - startValue) * gradient;                                
                            case BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE:
                                return offsetValue * repeatCount + (startValue + (endValue - startValue) * gradient);
                        }
                        break;
                    // Quaternion
                    case BABYLON.Animation.ANIMATIONTYPE_QUATERNION:
                        var quaternion = null;
                        switch (loopMode) {
                            case BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE:
                            case BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT:
                                quaternion = BABYLON.Quaternion.Slerp(startValue, endValue, gradient);
                                break;
                            case BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE:
                                quaternion = BABYLON.Quaternion.Slerp(startValue, endValue, gradient).add(offsetValue.scale(repeatCount));
                                break;
                        }

                        return quaternion;
                    // Vector3
                    case BABYLON.Animation.ANIMATIONTYPE_VECTOR3:
                        switch (loopMode) {
                            case BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE:
                            case BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT:
                                return BABYLON.Vector3.Lerp(startValue, endValue, gradient);
                            case BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE:
                                return BABYLON.Vector3.Lerp(startValue, endValue, gradient).add(offsetValue.scale(repeatCount));
                        }
                    // Matrix
                    case BABYLON.Animation.ANIMATIONTYPE_MATRIX:
                        switch (loopMode) {
                            case BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE:
                            case BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT:
                            case BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE:
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

    BABYLON.Animation.prototype.animate = function (target, delay, from, to, loop, speedRatio) {
        if (!this.targetPropertyPath || this.targetPropertyPath.length < 1) {
            return false;
        }
        
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

        if (ratio > range && !loop) { // If we are out of range and not looping get back to caller
            return false;
        }
        
        // Get max value if required
        var offsetValue = 0;
        var highLimitValue = 0;
        if (this.loopMode != BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE) {
            var keyOffset = to.toString() + from.toString();
            if (!this._offsetsCache[keyOffset]) {
                var fromValue = this._interpolate(from, 0, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
                var toValue = this._interpolate(to, 0, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
                switch (this.dataType) {
                    // Float
                    case BABYLON.Animation.ANIMATIONTYPE_FLOAT:
                        this._offsetsCache[keyOffset] = toValue - fromValue;
                        break;
                    // Quaternion
                    case BABYLON.Animation.ANIMATIONTYPE_QUATERNION:
                        this._offsetsCache[keyOffset] = toValue.subtract(fromValue);
                        break;
                    // Vector3
                    case BABYLON.Animation.ANIMATIONTYPE_VECTOR3:
                        this._offsetsCache[keyOffset] = toValue.subtract(fromValue);
                    default:
                        break;
                }

                this._highLimitsCache[keyOffset] = toValue;
            }

            highLimitValue = this._highLimitsCache[keyOffset];
            offsetValue = this._offsetsCache[keyOffset];
        }

        // Compute value
        var repeatCount = (ratio / range) >> 0;
        var currentFrame = from + ratio % range;
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
            target.markAsDirty();
        }

        return true;
    };

    // Statics
    BABYLON.Animation.ANIMATIONTYPE_FLOAT = 0;
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3 = 1;
    BABYLON.Animation.ANIMATIONTYPE_QUATERNION = 2;
    BABYLON.Animation.ANIMATIONTYPE_MATRIX = 3;

    BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE = 0;
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE = 1;
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT = 2;
})();
