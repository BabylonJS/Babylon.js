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
        public static AllowMatricesInterpolation = false;

        private _keys: Array<{frame:number, value: any, inTangent?: any, outTangent?: any}>;
        private _easingFunction: IEasingFunction;

        public _runtimeAnimations = new Array<RuntimeAnimation>();

        // The set of event that will be linked to this animation
        private _events = new Array<AnimationEvent>();

        public targetPropertyPath: string[];

        public blendingSpeed = 0.01;

        private _ranges: { [name: string]: Nullable<AnimationRange> } = {};

        static _PrepareAnimation(name: string, targetProperty: string, framePerSecond: number, totalFrame: number,
            from: any, to: any, loopMode?: number, easingFunction?: EasingFunction): Nullable<Animation> {
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

        /**
		 * Sets up an animation.
		 * @param property the property to animate
		 * @param animationType the animation type to apply
		 * @param easingFunction the easing function used in the animation
		 * @returns The created animation
		 */
		public static CreateAnimation(property: string, animationType: number, framePerSecond: number, easingFunction: BABYLON.EasingFunction): BABYLON.Animation {
			var animation: BABYLON.Animation = new BABYLON.Animation(property + "Animation",
				property,
				framePerSecond,
				animationType,
				BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

			animation.setEasingFunction(easingFunction);

			return animation;
		}

        public static CreateAndStartAnimation(name: string, node: Node, targetProperty: string,
            framePerSecond: number, totalFrame: number,
            from: any, to: any, loopMode?: number, easingFunction?: EasingFunction, onAnimationEnd?: () => void): Nullable<Animatable> {

            var animation = Animation._PrepareAnimation(name, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction);

            if (!animation) {
                return null;
            }

            return node.getScene().beginDirectAnimation(node, [animation], 0, totalFrame, (animation.loopMode === 1), 1.0, onAnimationEnd);
        }

        public static CreateMergeAndStartAnimation(name: string, node: Node, targetProperty: string,
            framePerSecond: number, totalFrame: number,
            from: any, to: any, loopMode?: number, easingFunction?: EasingFunction, onAnimationEnd?: () => void): Nullable<Animatable> {

            var animation = Animation._PrepareAnimation(name, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction);

            if (!animation) {
                return null;
            }

            node.animations.push(animation);

            return node.getScene().beginAnimation(node, 0, totalFrame, (animation.loopMode === 1), 1.0, onAnimationEnd);
        }

        /**
		 * Transition property of the Camera to the target Value.
		 * @param property The property to transition
		 * @param targetValue The target Value of the property
         * @param host The object where the property to animate belongs
         * @param scene Scene used to run the animation
         * @param frameRate Framerate (in frame/s) to use
		 * @param transition The transition type we want to use
		 * @param duration The duration of the animation, in milliseconds
		 * @param onAnimationEnd Call back trigger at the end of the animation.
		 */
		public static TransitionTo(property: string, targetValue: any, host: any, scene: Scene, frameRate: number, transition: Animation, duration: number,	onAnimationEnd: Nullable<() => void> = null): Nullable<Animatable> {

			if (duration <= 0) {
				host[property] = targetValue;
				if (onAnimationEnd) {
                    onAnimationEnd();
                }
				return null;
			}

			var endFrame: number = frameRate * (duration / 1000);

			transition.setKeys([{
				frame: 0,
				value: host[property].clone ? host[property].clone() : host[property]
			},
			{
				frame: endFrame,
				value: targetValue
			}]);

			if (!host.animations) {
				host.animations = [];
			}

			host.animations.push(transition);

			var animation: BABYLON.Animatable = scene.beginAnimation(host, 0, endFrame, false);
			animation.onAnimationEnd = onAnimationEnd;
			return animation;
        }
        
        /**
         * Return the array of runtime animations currently using this animation
         */
        public get runtimeAnimations(): RuntimeAnimation[] {
            return this._runtimeAnimations;
        }

        public get hasRunningRuntimeAnimations(): boolean {
            for (var runtimeAnimation of this._runtimeAnimations) {
                if (!runtimeAnimation.isStopped) {
                    return true;
                }
            }

            return false;
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

        public getEvents(): AnimationEvent[] {
            return this._events;
        }

        public createRange(name: string, from: number, to: number): void {
            // check name not already in use; could happen for bones after serialized
            if (!this._ranges[name]) {
                this._ranges[name] = new AnimationRange(name, from, to);
            }
        }

        public deleteRange(name: string, deleteFrames = true): void {
            let range = this._ranges[name];
            if (!range) {
                return;

            }
            if (deleteFrames) {
                var from = range.from;
                var to = range.to;

                // this loop MUST go high to low for multiple splices to work
                for (var key = this._keys.length - 1; key >= 0; key--) {
                    if (this._keys[key].frame >= from && this._keys[key].frame <= to) {
                        this._keys.splice(key, 1);
                    }
                }
            }
            this._ranges[name] = null; // said much faster than 'delete this._range[name]' 
        
        }

        public getRange(name: string): Nullable<AnimationRange> {
            return this._ranges[name];
        }


        public getKeys(): Array<{frame:number, value: any, inTangent?: any, outTangent?: any}> {
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
            return Scalar.Lerp(startValue, endValue, gradient);
        }

        public floatInterpolateFunctionWithTangents(startValue: number, outTangent: number, endValue: number, inTangent: number, gradient: number): number {
            return Scalar.Hermite(startValue, outTangent, endValue, inTangent, gradient);
        }

        public quaternionInterpolateFunction(startValue: Quaternion, endValue: Quaternion, gradient: number): Quaternion {
            return Quaternion.Slerp(startValue, endValue, gradient);
        }

        public quaternionInterpolateFunctionWithTangents(startValue: Quaternion, outTangent: Quaternion, endValue: Quaternion, inTangent: Quaternion, gradient: number): Quaternion {
            return Quaternion.Hermite(startValue, outTangent, endValue, inTangent, gradient).normalize();
        }

        public vector3InterpolateFunction(startValue: Vector3, endValue: Vector3, gradient: number): Vector3 {
            return Vector3.Lerp(startValue, endValue, gradient);
        }

        public vector3InterpolateFunctionWithTangents(startValue: Vector3, outTangent: Vector3, endValue: Vector3, inTangent: Vector3, gradient: number): Vector3 {
            return Vector3.Hermite(startValue, outTangent, endValue, inTangent, gradient);
        }

        public vector2InterpolateFunction(startValue: Vector2, endValue: Vector2, gradient: number): Vector2 {
            return Vector2.Lerp(startValue, endValue, gradient);
        }

        public vector2InterpolateFunctionWithTangents(startValue: Vector2, outTangent: Vector2, endValue: Vector2, inTangent: Vector2, gradient: number): Vector2 {
            return Vector2.Hermite(startValue, outTangent, endValue, inTangent, gradient);
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

            clone.enableBlending = this.enableBlending;
            clone.blendingSpeed = this.blendingSpeed;

            if (this._keys) {
                clone.setKeys(this._keys);
            }

            if (this._ranges) {
                clone._ranges = {};
                for (var name in this._ranges) {
                    let range = this._ranges[name];
                    if (!range) {
                        continue;
                    }
                    clone._ranges[name] = range.clone();
                }
            }

            return clone;
        }

        public setKeys(values: Array<{ frame: number, value: any }>): void {
            this._keys = values.slice(0);
        }

        public serialize(): any {
            var serializationObject: any = {};

            serializationObject.name = this.name;
            serializationObject.property = this.targetProperty;
            serializationObject.framePerSecond = this.framePerSecond;
            serializationObject.dataType = this.dataType;
            serializationObject.loopBehavior = this.loopMode;
            serializationObject.enableBlending = this.enableBlending;
            serializationObject.blendingSpeed = this.blendingSpeed;

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
                let source  =this._ranges[name];

                if (!source) {
                    continue;
                }
                var range: any = {};
                range.name = name;
                range.from = source.from;
                range.to = source.to;
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
            var keys: Array<{ frame: number, value: any, inTangent:any, outTangent:any }> = [];
            var data;
            var index: number;

            if (parsedAnimation.enableBlending) {
                animation.enableBlending = parsedAnimation.enableBlending;
            }

            if (parsedAnimation.blendingSpeed) {
                animation.blendingSpeed = parsedAnimation.blendingSpeed;
            }

            for (index = 0; index < parsedAnimation.keys.length; index++) {
                var key = parsedAnimation.keys[index];
                var inTangent:any;
                var outTangent:any;

                switch (dataType) {
                    case Animation.ANIMATIONTYPE_FLOAT:
                        data = key.values[0];
                        if (key.values.length >= 1) {
                            inTangent = key.values[1];
                        }
                        if (key.values.length >= 2) {
                            outTangent = key.values[2];
                        }
                        break;
                    case Animation.ANIMATIONTYPE_QUATERNION:
                        data = Quaternion.FromArray(key.values);
                        if (key.values.length >= 8) {
                            var _inTangent = Quaternion.FromArray(key.values.slice(4, 8));
                            if (!_inTangent.equals(Quaternion.Zero())) {
                                inTangent = _inTangent;
                            }
                        }
                        if (key.values.length >= 12) {
                            var _outTangent = Quaternion.FromArray(key.values.slice(8, 12));
                            if (!_outTangent.equals(Quaternion.Zero())) {
                                outTangent = _outTangent;
                            }
                        }
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

                var keyData:any = {};
                keyData.frame = key.frame;
                keyData.value = data;

                if (inTangent != undefined) {
                    keyData.inTangent = inTangent;
                }
                if (outTangent != undefined) {
                    keyData.outTangent = outTangent;
                }
                keys.push(keyData)
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


