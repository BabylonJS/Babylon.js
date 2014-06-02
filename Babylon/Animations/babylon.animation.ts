module BABYLON {
    export class Animation {
        private _keys: Array<any>;
        private _offsetsCache = {};
        private _highLimitsCache = {};
        private _stopped = false;
        public _target;

        public targetPropertyPath: string[];
        public currentFrame: number;

        constructor(public name: string, public targetProperty: string, public framePerSecond: number, public dataType: number, public loopMode?: number) {
            this.targetPropertyPath = targetProperty.split(".");
            this.dataType = dataType;
            this.loopMode = loopMode === undefined ? Animation.ANIMATIONLOOPMODE_CYCLE : loopMode;
        }

        // Methods   
        public isStopped(): boolean {
            return this._stopped;
        }

        public getKeys(): any[] {
            return this._keys;
        }

        public floatInterpolateFunction(startValue: number, endValue: number, gradient: number): number {
            return startValue + (endValue - startValue) * gradient;
        }

        public quaternionInterpolateFunction(startValue: Quaternion, endValue: Quaternion, gradient: number): Quaternion {
            return BABYLON.Quaternion.Slerp(startValue, endValue, gradient);
        }

        public vector3InterpolateFunction(startValue: Vector3, endValue: Vector3, gradient: number): Vector3 {
            return BABYLON.Vector3.Lerp(startValue, endValue, gradient);
        }

        public color3InterpolateFunction(startValue: Color3, endValue: Color3, gradient: number): Color3 {
            return BABYLON.Color3.Lerp(startValue, endValue, gradient);
        }

        public clone(): Animation {
            var clone = new Animation(this.name, this.targetPropertyPath.join("."), this.framePerSecond, this.dataType, this.loopMode);

            clone.setKeys(this._keys);

            return clone;
        }

        public setKeys(values: Array<any>): void {
            this._keys = values.slice(0);
            this._offsetsCache = {};
            this._highLimitsCache = {};
        }

        private _interpolate(currentFrame: number, repeatCount: number, loopMode: number, offsetValue? , highLimitValue?) {
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
        }

        public animate(delay: number, from: number, to: number, loop: boolean, speedRatio: number): boolean {
            if (!this.targetPropertyPath || this.targetPropertyPath.length < 1) {
                this._stopped = true;
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

            if (ratio > range && !loop) { // If we are out of range and not looping get back to caller
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
            } else {
                this._target[this.targetPropertyPath[0]] = currentValue;
            }

            if (this._target.markAsDirty) {
                this._target.markAsDirty(this.targetProperty);
            }

            if (!returnValue) {
                this._stopped = true;
            }

            return returnValue;
        }

        // Statics
        private static _ANIMATIONTYPE_FLOAT = 0;
        private static _ANIMATIONTYPE_VECTOR3 = 1;
        private static _ANIMATIONTYPE_QUATERNION = 2;
        private static _ANIMATIONTYPE_MATRIX = 3;
        private static _ANIMATIONTYPE_COLOR3 = 4;
        private static _ANIMATIONLOOPMODE_RELATIVE = 0;
        private static _ANIMATIONLOOPMODE_CYCLE = 1;
        private static _ANIMATIONLOOPMODE_CONSTANT = 2;

        public static get ANIMATIONTYPE_FLOAT(): number {
            return Animation._ANIMATIONTYPE_FLOAT;
        }

        public static get ANIMATIONTYPE_VECTOR3(): number {
            return Animation._ANIMATIONTYPE_VECTOR3;
        }

        public static get ANIMATIONTYPE_QUATERNION(): number {
            return Animation._ANIMATIONTYPE_QUATERNION;
        }

        public static get ANIMATIONTYPE_MATRIX(): number {
            return Animation._ANIMATIONTYPE_MATRIX;
        }

        public static get ANIMATIONTYPE_COLOR3(): number {
            return Animation._ANIMATIONTYPE_COLOR3;
        }

        public static get ANIMATIONLOOPMODE_RELATIVE(): number {
            return Animation._ANIMATIONLOOPMODE_RELATIVE;
        }

        public static get ANIMATIONLOOPMODE_CYCLE(): number {
            return Animation._ANIMATIONLOOPMODE_CYCLE;
        }

        public static get ANIMATIONLOOPMODE_CONSTANT(): number {
            return Animation._ANIMATIONLOOPMODE_CONSTANT;
        }
    }
} 