module BABYLON {
    export class AnimationRange {
        constructor(public name: string, public from: number, public to: number) {
        }

        public clone(): AnimationRange {
            return new AnimationRange(this.name, this.from, this.to);
        }
    }

    /**
     * Composed of a frame, and an action function
     */
    export class AnimationEvent {
        public isDone: boolean = false;
        constructor(public frame: number, public action: () => void, public onlyOnce?: boolean) {
        }
    }

    export class PathCursor {
        private _onchange = new Array<(cursor: PathCursor) => void>();

        value: number = 0;
        animations = new Array<Animation>();

        constructor(private path: Path2) {
        }

        public getPoint(): Vector3 {
            var point = this.path.getPointAtLengthPosition(this.value);
            return new Vector3(point.x, 0, point.y);
        }

        public moveAhead(step: number = 0.002): PathCursor {
            this.move(step);

            return this;
        }

        public moveBack(step: number = 0.002): PathCursor {
            this.move(-step);

            return this;
        }

        public move(step: number): PathCursor {

            if (Math.abs(step) > 1) {
                throw "step size should be less than 1.";
            }

            this.value += step;
            this.ensureLimits();
            this.raiseOnChange();

            return this;
        }

        private ensureLimits(): PathCursor {
            while (this.value > 1) {
                this.value -= 1;
            }
            while (this.value < 0) {
                this.value += 1;
            }

            return this;
        }

        // used by animation engine
        private markAsDirty(propertyName: string): PathCursor {
            this.ensureLimits();
            this.raiseOnChange();

            return this;
        }

        private raiseOnChange(): PathCursor {
            this._onchange.forEach(f => f(this));

            return this;
        }

        public onchange(f: (cursor: PathCursor) => void): PathCursor {
            this._onchange.push(f);

            return this;
        }
    }

    export class Animation {
        private _keys: Array<{frame:number, value: any}>;
        private _offsetsCache = {};
        private _highLimitsCache = {};
        private _stopped = false;
        public _target;
        private _blendingFactor = 0;
        private _easingFunction: IEasingFunction;

        // The set of event that will be linked to this animation
        private _events = new Array<AnimationEvent>();

        public targetPropertyPath: string[];
        public currentFrame: number;

        public allowMatricesInterpolation = false;

        public blendingSpeed = 0.01;
        private _originalBlendValue: any;

        private _ranges: { [name: string]: AnimationRange; } = {};

        static _PrepareAnimation(name: string, targetProperty: string, framePerSecond: number, totalFrame: number,
            from: any, to: any, loopMode?: number, easingFunction?: EasingFunction): Animation {
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
            } else if (from instanceof Size) {
                dataType = Animation.ANIMATIONTYPE_SIZE;
            }

            if (dataType == undefined) {
                return null;
            }

            var animation = new Animation(name, targetProperty, framePerSecond, dataType, loopMode);

            var keys: Array<{frame: number, value:any}> = [{ frame: 0, value: from }, { frame: totalFrame, value: to }];
            animation.setKeys(keys);

            if (easingFunction !== undefined) {
                animation.setEasingFunction(easingFunction);
            }

            return animation;
        }

        public static CreateAndStartAnimation(name: string, node: Node, targetProperty: string,
            framePerSecond: number, totalFrame: number,
            from: any, to: any, loopMode?: number, easingFunction?: EasingFunction, onAnimationEnd?: () => void) {

            var animation = Animation._PrepareAnimation(name, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction);

            return node.getScene().beginDirectAnimation(node, [animation], 0, totalFrame, (animation.loopMode === 1), 1.0, onAnimationEnd);
        }

        public static CreateMergeAndStartAnimation(name: string, node: Node, targetProperty: string,
            framePerSecond: number, totalFrame: number,
            from: any, to: any, loopMode?: number, easingFunction?: EasingFunction, onAnimationEnd?: () => void) {

            var animation = Animation._PrepareAnimation(name, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction);

            node.animations.push(animation);

            return node.getScene().beginAnimation(node, 0, totalFrame, (animation.loopMode === 1), 1.0, onAnimationEnd);
        }

        constructor(public name: string, public targetProperty: string, public framePerSecond: number, public dataType: number, public loopMode?: number, public enableBlending?: boolean) {
            this.targetPropertyPath = targetProperty.split(".");
            this.dataType = dataType;
            this.loopMode = loopMode === undefined ? Animation.ANIMATIONLOOPMODE_CYCLE : loopMode;
        }

        // Methods
        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        public toString(fullDetails? : boolean) : string {
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
        } 
        
        /**
         * Add an event to this animation.
         */
        public addEvent(event: AnimationEvent): void {
            this._events.push(event);
        }

        /**
         * Remove all events found at the given frame
         * @param frame
         */
        public removeEvents(frame: number): void {
            for (var index = 0; index < this._events.length; index++) {
                if (this._events[index].frame === frame) {
                    this._events.splice(index, 1);
                    index--;
                }
            }
        }

        public createRange(name: string, from: number, to: number): void {
            // check name not already in use; could happen for bones after serialized
            if (!this._ranges[name]) {
                this._ranges[name] = new AnimationRange(name, from, to);
            }
        }

        public deleteRange(name: string, deleteFrames = true): void {
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
        }

        public getRange(name: string): AnimationRange {
            return this._ranges[name];
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

        public getKeys(): Array<{ frame: number, value: any }> {
            return this._keys;
        }

        public getHighestFrame(): number {
            var ret = 0;

            for (var key = 0, nKeys = this._keys.length; key < nKeys; key++) {
                if (ret < this._keys[key].frame) {
                    ret = this._keys[key].frame;
                }
            }
            return ret;
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

        public sizeInterpolateFunction(startValue: Size, endValue: Size, gradient: number): Size {
            return Size.Lerp(startValue, endValue, gradient);
        }

        public color3InterpolateFunction(startValue: Color3, endValue: Color3, gradient: number): Color3 {
            return Color3.Lerp(startValue, endValue, gradient);
        }

        public matrixInterpolateFunction(startValue: Matrix, endValue: Matrix, gradient: number): Matrix {
            return Matrix.Lerp(startValue, endValue, gradient);
        }

        public clone(): Animation {
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
        }

        public setKeys(values: Array<{ frame: number, value: any }>): void {
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
        }

        public setValue(currentValue: any, blend: boolean = false): void {
            // Set value
            var path: any;
            var destination: any;

            if (this.targetPropertyPath.length > 1) {
                var property = this._target[this.targetPropertyPath[0]];

                for (var index = 1; index < this.targetPropertyPath.length - 1; index++) {
                    property = property[this.targetPropertyPath[index]];
                }

                path = this.targetPropertyPath[this.targetPropertyPath.length - 1];
                destination = property;
            } else {
                path = this.targetPropertyPath[0];
                destination = this._target;
            }

            // Blending
            if (this.enableBlending && this._blendingFactor <= 1.0) {
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
                this._blendingFactor += this.blendingSpeed;
            } else {
                destination[path] = currentValue;
            }

            if (this._target.markAsDirty) {
                this._target.markAsDirty(this.targetProperty);
            }
        }

        public goToFrame(frame: number): void {
            if (frame < this._keys[0].frame) {
                frame = this._keys[0].frame;
            } else if (frame > this._keys[this._keys.length - 1].frame) {
                frame = this._keys[this._keys.length - 1].frame;
            }

            var currentValue = this._interpolate(frame, 0, this.loopMode);

            this.setValue(currentValue);
        }

        public animate(delay: number, from: number, to: number, loop: boolean, speedRatio: number, blend: boolean = false): boolean {
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
                } else if (this._events[index].isDone && !this._events[index].onlyOnce) {
                    // reset event, the animation is looping
                    this._events[index].isDone = false;
                }
            }
            if (!returnValue) {
                this._stopped = true;
            }

            return returnValue;
        }

        public serialize(): any {
            var serializationObject: any = {};

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

                var key: any = {};
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
                var range: any = {};
                range.name = name;
                range.from = this._ranges[name].from;
                range.to = this._ranges[name].to;
                serializationObject.ranges.push(range);
            }

            return serializationObject;
        }

        // Statics
        private static _ANIMATIONTYPE_FLOAT = 0;
        private static _ANIMATIONTYPE_VECTOR3 = 1;
        private static _ANIMATIONTYPE_QUATERNION = 2;
        private static _ANIMATIONTYPE_MATRIX = 3;
        private static _ANIMATIONTYPE_COLOR3 = 4;
        private static _ANIMATIONTYPE_VECTOR2 = 5;
        private static _ANIMATIONTYPE_SIZE = 6;
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

        public static get ANIMATIONTYPE_SIZE(): number {
            return Animation._ANIMATIONTYPE_SIZE;
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

        public static Parse(parsedAnimation: any): Animation {
            var animation = new Animation(parsedAnimation.name, parsedAnimation.property, parsedAnimation.framePerSecond, parsedAnimation.dataType, parsedAnimation.loopBehavior);

            var dataType = parsedAnimation.dataType;
            var keys: Array<{ frame: number, value: any }> = [];
            var data;
            var index: number;

            for (index = 0; index < parsedAnimation.keys.length; index++) {
                var key = parsedAnimation.keys[index];


                switch (dataType) {
                    case Animation.ANIMATIONTYPE_FLOAT:
                        data = key.values[0];
                        break;
                    case Animation.ANIMATIONTYPE_QUATERNION:
                        data = Quaternion.FromArray(key.values);
                        break;
                    case Animation.ANIMATIONTYPE_MATRIX:
                        data = Matrix.FromArray(key.values);
                        break;
                    case Animation.ANIMATIONTYPE_COLOR3:
                        data = Color3.FromArray(key.values);
                        break;
                    case Animation.ANIMATIONTYPE_VECTOR3:
                    default:
                        data = Vector3.FromArray(key.values);
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
        }

        public static AppendSerializedAnimations(source: IAnimatable, destination: any): any {
            if (source.animations) {
                destination.animations = [];
                for (var animationIndex = 0; animationIndex < source.animations.length; animationIndex++) {
                    var animation = source.animations[animationIndex];

                    destination.animations.push(animation.serialize());
                }
            }
        }
    }
} 


