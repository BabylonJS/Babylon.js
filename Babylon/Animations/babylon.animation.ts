﻿module BABYLON {
    export class Animation {
        private _keys: Array<any>;
        private _offsetsCache = {};
        private _highLimitsCache = {};
        private _stopped = false;
        public _target;
        private _easingFunction: IEasingFunction;

        public targetPropertyPath: string[];
        public currentFrame: number;

        public static CreateAndStartAnimation(name: string, mesh: AbstractMesh, tartgetProperty: string,
            framePerSecond: number, totalFrame: number,
            from: any, to: any, loopMode?: number) {

            var dataType = undefined;

            if (!isNaN(parseFloat(from)) && isFinite(from)) {
                dataType = Animation.ANIMATIONTYPE_FLOAT;
            } else if (from instanceof Quaternion) {
                dataType = Animation.ANIMATIONTYPE_QUATERNION;
            } else if (from instanceof Vector3) {
                dataType = Animation.ANIMATIONTYPE_VECTOR3;
            } else if (from instanceof Vector2) {
                dataType = Animation.ANIMATIONTYPE_VECTOR2;
            } else if (from instanceof Color3) {
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

            return mesh.getScene().beginAnimation(mesh, 0, totalFrame,(animation.loopMode === 1));

        }

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

        public getEasingFunction() {
            return this._easingFunction;
        }

        public setEasingFunction(easingFunction: EasingFunction) {
            this._easingFunction = easingFunction;
        }

        public floatInterpolateFunction(startValue: number, endValue: number, gradient: number): number {
            return startValue + (endValue - startValue) * gradient;
        }

        public quaternionInterpolateFunction(startValue: Quaternion, endValue: Quaternion, gradient: number): Quaternion {
            return Quaternion.Slerp(startValue, endValue, gradient);
        }

        public vector3InterpolateFunction(startValue: Vector3, endValue: Vector3, gradient: number): Vector3 {
            return Vector3.Lerp(startValue, endValue, gradient);
        }

        public vector2InterpolateFunction(startValue: Vector2, endValue: Vector2, gradient: number): Vector2 {
            return Vector2.Lerp(startValue, endValue, gradient);
        }

        public color3InterpolateFunction(startValue: Color3, endValue: Color3, gradient: number): Color3 {
            return Color3.Lerp(startValue, endValue, gradient);
        }

        public matrixInterpolateFunction(startValue: Matrix, endValue: Matrix, gradient: number): Matrix {
            var startScale = new Vector3(0, 0, 0);
            var startRotation = new Quaternion();
            var startTranslation = new Vector3(0, 0, 0);
            startValue.decompose(startScale, startRotation, startTranslation);

            var endScale = new Vector3(0, 0, 0);
            var endRotation = new Quaternion();
            var endTranslation = new Vector3(0, 0, 0);
            endValue.decompose(endScale, endRotation, endTranslation);

            var resultScale = this.vector3InterpolateFunction(startScale, endScale, gradient);
            var resultRotation = this.quaternionInterpolateFunction(startRotation, endRotation, gradient);
            var resultTranslation = this.vector3InterpolateFunction(startTranslation, endTranslation, gradient);

            var result = Matrix.Compose(resultScale, resultRotation, resultTranslation);

            return result;
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

        private _getKeyValue(value: any): any {
            if (typeof value === "function") {
                return value();
            }

            return value;
        }

        private _interpolate(currentFrame: number, repeatCount: number, loopMode: number, offsetValue?, highLimitValue?) {
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

            for (var key = startKey; key < this._keys.length ; key++) {
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
                                   // return this.matrixInterpolateFunction(startValue, endValue, gradient);
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
        }


        public animate(delay: number, from: number, to: number, loop: boolean, speedRatio: number): boolean {
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

            if (ratio > range && !loop) { // If we are out of range and not looping get back to caller
                returnValue = false;
                highLimitValue = this._getKeyValue(this._keys[this._keys.length - 1].value);
            } else {
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
                    // Color3
                    case Animation.ANIMATIONTYPE_COLOR3:
                        offsetValue = Color3.Black();
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
        private static _ANIMATIONTYPE_VECTOR2 = 5;
        private static _ANIMATIONLOOPMODE_RELATIVE = 0;
        private static _ANIMATIONLOOPMODE_CYCLE = 1;
        private static _ANIMATIONLOOPMODE_CONSTANT = 2;

        public static get ANIMATIONTYPE_FLOAT(): number {
            return Animation._ANIMATIONTYPE_FLOAT;
        }

        public static get ANIMATIONTYPE_VECTOR3(): number {
            return Animation._ANIMATIONTYPE_VECTOR3;
        }

        public static get ANIMATIONTYPE_VECTOR2(): number {
            return Animation._ANIMATIONTYPE_VECTOR2;
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
