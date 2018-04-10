module BABYLON {
    /**
     * Represents the range of an animation.
     */
    export class AnimationRange {
        /**
         * Initializes the range of an animation.
         * @param {string} name - The name of the animation range.
         * @param {number} from - The starting frame of the animation.
         * @param {number} to - The ending frame of the animation.
         */
        constructor(public name: string, public from: number, public to: number) {
        }

        /**
         * Makes a copy of the animation range.
         * @returns {AnimationRange} - A copy of the animation range.
         */
        public clone(): AnimationRange {
            return new AnimationRange(this.name, this.from, this.to);
        }
    }

    /**
     * Composed of a frame, and an action function
     */
    export class AnimationEvent {
        /**
         * Specifies if the animation event is done.
         */
        public isDone: boolean = false;

        /**
         * This callback is an event to perform when triggered by a frame.
         * @callback actionCallback
         */

        /**
         * Initializes the animation event.
         * @param {number} frame - The frame for which the event is triggered.
         * @param {actionCallback} action - The event to perform when triggered.
         * @param {boolean} onlyOnce - Specifies if the event should be triggered only once.
         */
        constructor(public frame: number, public action: () => void, public onlyOnce?: boolean) {
        }
    }

    /**
     * A cursor which tracks a point on a path.
     */
    export class PathCursor {
        /**
         * Stores path cursor callbacks for when an onchange event is triggered.
         */
        private _onchange = new Array<(cursor: PathCursor) => void>();

        /**
         * The value of the path cursor.
         */
        value: number = 0;

        /**
         * The animation array of the path cursor.
         */
        animations = new Array<Animation>();

        /**
         * Initializes the path cursor.
         * @param path - The path to track.
         */
        constructor(private path: Path2) {
        }

        /**
         * Gets the cursor point on the path.
         * @returns {Vector3} - A point on the path cursor at the cursor location.
         */
        public getPoint(): Vector3 {
            var point = this.path.getPointAtLengthPosition(this.value);
            return new Vector3(point.x, 0, point.y);
        }

        /**
         * Moves the cursor ahead by the step amount.
         * @param {number} step - The amount to move the cursor forward.
         * @returns {PathCursor} - This path cursor.
         */
        public moveAhead(step: number = 0.002): PathCursor {
            this.move(step);

            return this;
        }

        /**
         * Moves the cursor behind by the step amount.
         * @param {number} step - The amount to move the cursor back.
         * @returns {PathCursor} - This path cursor.
         */
        public moveBack(step: number = 0.002): PathCursor {
            this.move(-step);

            return this;
        }

        /**
         * Moves the cursor by the step amount.
         * If the step amount is greater than one, an exception is thrown.
         * @param {number} step - The amount to move the cursor.
         * @returns {PathCursor} - This path cursor.
         */
        public move(step: number): PathCursor {

            if (Math.abs(step) > 1) {
                throw "step size should be less than 1.";
            }

            this.value += step;
            this.ensureLimits();
            this.raiseOnChange();

            return this;
        }

        /**
         * Ensures that the value is limited between zero and one.
         * @returns {PathCursor} - This path cursor.
         */
        private ensureLimits(): PathCursor {
            while (this.value > 1) {
                this.value -= 1;
            }
            while (this.value < 0) {
                this.value += 1;
            }

            return this;
        }

        /**
         * Runs onchange callbacks on change.  Used by the animation engine.
         * @returns {PathCursor} - This path cursor.
         */
        private raiseOnChange(): PathCursor {
            this._onchange.forEach(f => f(this));

            return this;
        }

        /**
         * This callback is performed when an onchange event is triggered in PathCursor.
         * @callback pathCursorCallback
         * @param {PathCursor} cursor - A cursor which tracks a point on a path.
         */

        /**
         * Executes a function on change.
         * @param {pathCursorCallback} f - A path cursor onchange callback.
         * @returns {PathCursor} - This path cursor.
         */
        public onchange(f: (cursor: PathCursor) => void): PathCursor {
            this._onchange.push(f);

            return this;
        }
    }

    /**
     * Defines an interface which represents an animation key frame.
     */
    export interface IAnimationKey {
        /**
         * Frame of the key frame.
         */
        frame: number;
        /**
         * Value at the specifies key frame.
         */
        value: any;
        /**
         * The input tangent for the cubic hermite spline.
         */
        inTangent?: any;
        /**
         * The output tangent for the cubic hermite spline.
         */
        outTangent?: any;
        /**
         * The animation interpolation type.
         */
        interpolation?: AnimationKeyInterpolation;
    }

    /**
     * Enum for the animation key frame interpolation type.
     */
    export enum AnimationKeyInterpolation {
        /**
         * Do not interpolate between keys and use the start key value only. Tangents are ignored.
         */
        STEP = 1
    }

    /**
     * Class used to store any kind of animation
     */
    export class Animation {
        /**
         * Use matrix interpolation instead of using direct key value when animating matrices
         */
        public static AllowMatricesInterpolation = false;

        /**
         * When matrix interpolation is enabled, this boolean forces the system to use Matrix.DecomposeLerp instead of Matrix.Lerp. Interpolation is more precise but slower
         */
        public static AllowMatrixDecomposeForInterpolation = true;

        /**
         * Stores the key frames of the animation.
         */
        private _keys: Array<IAnimationKey>;

        /**
         * Stores the easing function of the animation.
         */
        private _easingFunction: IEasingFunction;

        /**
         * Stores the runtime animations of the animation.
         */
        public _runtimeAnimations = new Array<RuntimeAnimation>();

        /**
         * The set of event that will be linked to this animation.
         */
        private _events = new Array<AnimationEvent>();

        /**
         * Stores an array of target property paths.
         */
        public targetPropertyPath: string[];

        /**
         * Stores the blending speed of the animation.
         */
        public blendingSpeed = 0.01;

        /**
         * Stores the animation ranges for the animation.
         */
        private _ranges: { [name: string]: Nullable<AnimationRange> } = {};

        /**
         * Gets the animation initialized.
         * @param name - Name of the animation.
         * @param targetProperty - The property targeted by the animation.
         * @param framePerSecond - The frames per second of the animation.
         * @param totalFrame - The total number of frames in the animation.
         * @param from - The starting frame of the animation.
         * @param to - The ending frame of the animation.
         * @param loopMode - (Optional) The loop mode of the animation.
         * @param easingFunction - (Optional) The easing function of the animation, which allow custom mathematical formulas for animations.
         * @returns {Nullable<Animation>} - Nullable animation.
         */
        public static _PrepareAnimation(name: string, targetProperty: string, framePerSecond: number, totalFrame: number,
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

            var keys: Array<IAnimationKey> = [{ frame: 0, value: from }, { frame: totalFrame, value: to }];
            animation.setKeys(keys);

            if (easingFunction !== undefined) {
                animation.setEasingFunction(easingFunction);
            }

            return animation;
        }

        /**
		 * Sets up an animation.
		 * @param property The property to animate.
		 * @param animationType The animation type to apply.
		 * @param easingFunction The easing function used in the animation.
		 * @returns {Animation} The created animation.
		 */
        public static CreateAnimation(property: string, animationType: number, framePerSecond: number, easingFunction: EasingFunction): Animation {
            var animation: Animation = new Animation(property + "Animation",
                property,
                framePerSecond,
                animationType,
                Animation.ANIMATIONLOOPMODE_CONSTANT);

            animation.setEasingFunction(easingFunction);

            return animation;
        }

        /**
         * Create and start an animation on a node
         * @param {string} name defines the name of the global animation that will be run on all nodes
         * @param {BABYLON.Node} node defines the root node where the animation will take place
         * @param {string} targetProperty defines property to animate
         * @param {number} framePerSecond defines the number of frame per second yo use
         * @param {number} totalFrame defines the number of frames in total
         * @param {any} from defines the initial value
         * @param {any} to defines the final value
         * @param {number} loopMode defines which loop mode you want to use (off by default)
         * @param {BABYLON.EasingFunction} easingFunction defines the easing function to use (linear by default)
         * @param onAnimationEnd defines the callback to call when animation end
         * @returns {Nullable<Animatable>} the animatable created for this animation
         */
        public static CreateAndStartAnimation(name: string, node: Node, targetProperty: string,
            framePerSecond: number, totalFrame: number,
            from: any, to: any, loopMode?: number, easingFunction?: EasingFunction, onAnimationEnd?: () => void): Nullable<Animatable> {

            var animation = Animation._PrepareAnimation(name, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction);

            if (!animation) {
                return null;
            }

            return node.getScene().beginDirectAnimation(node, [animation], 0, totalFrame, (animation.loopMode === 1), 1.0, onAnimationEnd);
        }

        /**
         * This callback is triggered when the animation has completed.
         * @callback - onAnimationEndCallback
         */

        /**
         * Create and start an animation on a node and its descendants
         * @param {string} name defines the name of the global animation that will be run on all nodes
         * @param {BABYLON.Node} node defines the root node where the animation will take place
         * @param {boolean} directDescendantsOnly if true only direct descendants will be used, if false direct and also indirect (children of children, an so on in a recursive manner) descendants will be used.
         * @param {string} targetProperty defines property to animate
         * @param {number} framePerSecond defines the number of frame per second yo use
         * @param {number} totalFrame defines the number of frames in total
         * @param {any} from defines the initial value
         * @param {any} to defines the final value
         * @param {number} loopMode defines which loop mode you want to use (off by default)
         * @param {BABYLON.EasingFunction} easingFunction defines the easing function to use (linear by default)
         * @param {onAnimationEndCallback | undefined} onAnimationEnd defines the callback to call when an animation ends (will be called once per node)
         * @returns {Nullable<Animatable[]>}  the list of animatables created for all nodes
         * @example https://www.babylonjs-playground.com/#MH0VLI
         */
        public static CreateAndStartHierarchyAnimation(name: string, node: Node, directDescendantsOnly: boolean, targetProperty: string,
            framePerSecond: number, totalFrame: number,
            from: any, to: any, loopMode?: number, easingFunction?: EasingFunction, onAnimationEnd?: () => void): Nullable<Animatable[]> {

            var animation = Animation._PrepareAnimation(name, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction);

            if (!animation) {
                return null;
            }

            let scene = node.getScene();
            return scene.beginDirectHierarchyAnimation(node, directDescendantsOnly, [animation], 0, totalFrame, (animation.loopMode === 1), 1.0, onAnimationEnd);
        }

        /**
         * Creates a new animation, merges it with the existing animations and starts it.
         * @param {string} name - Name of the animation.
         * @param {Node} node - Node which contains the scene that begins the animations. 
         * @param {string} targetProperty - Specifies which property to animate.
         * @param {number} framePerSecond - The frames per second of the animation.
         * @param {number} totalFrame - The total number of frames.
         * @param {number} from - The frame at the beginning of the animation.
         * @param {number} to - The frame at the end of the animation.
         * @param {number | undefined} loopMode - Specifies the loop mode of the animation.
         * @param {EasingFunction | undefined} easingFunction - (Optional) The easing function of the animation, which allow custom mathematical formulas for animations.
         * @param {onAnimationEndCallback | undefined} onAnimationEnd - Callback to run once the animation is complete.
         * @returns {Nullable<Animatable>}- Nullable animation.
         */
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
		 * @param {string} property The property to transition
		 * @param {any} targetValue The target Value of the property
         * @param {any} host The object where the property to animate belongs
         * @param {Scene} scene Scene used to run the animation
         * @param {number} frameRate Framerate (in frame/s) to use
		 * @param {Animation} transition The transition type we want to use
		 * @param {number} duration The duration of the animation, in milliseconds
		 * @param {Nullable<onAnimationEndCallback>} onAnimationEnd Call back trigger at the end of the animation.
         * @returns {Nullable<Animatable>}- Nullable animation.
		 */
        public static TransitionTo(property: string, targetValue: any, host: any, scene: Scene, frameRate: number, transition: Animation, duration: number, onAnimationEnd: Nullable<() => void> = null): Nullable<Animatable> {
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

            var animation: Animatable = scene.beginAnimation(host, 0, endFrame, false);
            animation.onAnimationEnd = onAnimationEnd;
            return animation;
        }

        /**
         * Return the array of runtime animations currently using this animation.
         */
        public get runtimeAnimations(): RuntimeAnimation[] {
            return this._runtimeAnimations;
        }

        /**
         * Specifies if any of the runtime animations are currently running.
         */
        public get hasRunningRuntimeAnimations(): boolean {
            for (var runtimeAnimation of this._runtimeAnimations) {
                if (!runtimeAnimation.isStopped) {
                    return true;
                }
            }

            return false;
        }

        /**
         * Initializes the animation.
         * @param {string} name - Name of the animation.
         * @param {string} targetProperty - Property to animate.
         * @param {number} framePerSecond - The frames per second of the animation.
         * @param {number} dataType - The data type of the animation.
         * @param {number} loopMode - The loop mode of the animation.
         * @param {boolean} enableBlendings - Specifies if blending should be enabled.
         */
        constructor(public name: string, public targetProperty: string, public framePerSecond: number, public dataType: number, public loopMode?: number, public enableBlending?: boolean) {
            this.targetPropertyPath = targetProperty.split(".");
            this.dataType = dataType;
            this.loopMode = loopMode === undefined ? Animation.ANIMATIONLOOPMODE_CYCLE : loopMode;
        }

        // Methods
        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         * @returns {string} - String form of the animation.
         */
        public toString(fullDetails?: boolean): string {
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
         * @param {number} frame - The frame to remove events from.
         */
        public removeEvents(frame: number): void {
            for (var index = 0; index < this._events.length; index++) {
                if (this._events[index].frame === frame) {
                    this._events.splice(index, 1);
                    index--;
                }
            }
        }

        /**
         * Retrieves all the events from the animation.
         * @returns {AnimationEvent[]} - Events from the animation.
         */
        public getEvents(): AnimationEvent[] {
            return this._events;
        }

        /**
         * Creates an animation range.
         * @param {string} name - Name of the animation range.
         * @param {number} from - Starting frame of the animation range.
         * @param {number} to - Ending frame of the animation.
         */
        public createRange(name: string, from: number, to: number): void {
            // check name not already in use; could happen for bones after serialized
            if (!this._ranges[name]) {
                this._ranges[name] = new AnimationRange(name, from, to);
            }
        }

        /**
         * Deletes an animation range by name.
         * @param {string} name - Name of the animation range to delete.
         * @param {boolean} deleteFrames - Specifies if the key frames for the range should also be deleted (true) or not (false). 
         */
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

        /**
         * Gets the animation range by name, or null if not defined.
         * @param {string} name - Name of the animation range.
         * @returns {Nullable<AnimationRange>}- Nullable animation range.
         */
        public getRange(name: string): Nullable<AnimationRange> {
            return this._ranges[name];
        }

        /**
         * Gets the key frames from the animation.
         * @returns {Array<IAnimationKey>} - The key frames of the animation. 
         */
        public getKeys(): Array<IAnimationKey> {
            return this._keys;
        }

        /**
         * Gets the highest frame rate of the animation.
         * @returns {number} - Highest frame rate of the animation.
         */
        public getHighestFrame(): number {
            var ret = 0;

            for (var key = 0, nKeys = this._keys.length; key < nKeys; key++) {
                if (ret < this._keys[key].frame) {
                    ret = this._keys[key].frame;
                }
            }
            return ret;
        }

        /**
         * Gets the easing function of the animation.
         * @returns {IEasingFunction} - Easing function of the animation.
         */
        public getEasingFunction(): IEasingFunction {
            return this._easingFunction;
        }

        /**
         * Sets the easing function of the animation
         * @param {EasingFunction} easingFunction - A custom mathematical formula for animation.
         */
        public setEasingFunction(easingFunction: EasingFunction): void {
            this._easingFunction = easingFunction;
        }

        /**
         * Interpolates a scalar linearly.
         * @param {number} startValue - Start value of the animation curve.
         * @param {number} endValue - End value of the animation curve.
         * @param {number} gradient - Scalar amount to interpolate.
         * @returns {number} - Interpolated scalar value.
         */
        public floatInterpolateFunction(startValue: number, endValue: number, gradient: number): number {
            return Scalar.Lerp(startValue, endValue, gradient);
        }

        /**
         * Interpolates a scalar cubically. 
         * @param {number} startValue - Start value of the animation curve.
         * @param {number} outTangent - End tangent of the animation.
         * @param {number} endValue - End value of the animation curve.
         * @param {number} inTangent - Start tangent of the animation curve..
         * @param {number} gradient - Scalar amount to interpolate. 
         * @returns {number} - Interpolated scalar value.
         */
        public floatInterpolateFunctionWithTangents(startValue: number, outTangent: number, endValue: number, inTangent: number, gradient: number): number {
            return Scalar.Hermite(startValue, outTangent, endValue, inTangent, gradient);
        }

        /**
         * Interpolates a quaternion using a spherical linear interpolation.
         * @param {Quaternion} startValue - Start value of the animation curve.
         * @param {Quaternion} endValue - End value of the animation curve.
         * @param {number} gradient - Scalar amount to interpolate.
         * @returns {Quaternion} - Interpolated quaternion value.
         */
        public quaternionInterpolateFunction(startValue: Quaternion, endValue: Quaternion, gradient: number): Quaternion {
            return Quaternion.Slerp(startValue, endValue, gradient);
        }

        /**
         * Interpolates a quaternion cubically.
         * @param {Quaternion} startValue - Start value of the animation curve.
         * @param {Quaternion} outTangent - End tangent of the animation curve.
         * @param {Quaternion} endValue - End value of the animation curve.
         * @param {Quaternion} inTangent - Start tangent of the animation curve.
         * @param {number} gradient - Scalar amount to interpolate.
         * @returns {Quaternion} - Interpolated quaternion value.
         */
        public quaternionInterpolateFunctionWithTangents(startValue: Quaternion, outTangent: Quaternion, endValue: Quaternion, inTangent: Quaternion, gradient: number): Quaternion {
            return Quaternion.Hermite(startValue, outTangent, endValue, inTangent, gradient).normalize();
        }

        /**
         * Interpolates a Vector3 linearly.
         * @param {Vector3} startValue - Start value of the animation curve.
         * @param {Vector3} endValue - End value of the animation curve.
         * @param {number} gradient - Scalar amount to interpolate.
         * @returns {Vector3} - Interpolated scalar value.
         */
        public vector3InterpolateFunction(startValue: Vector3, endValue: Vector3, gradient: number): Vector3 {
            return Vector3.Lerp(startValue, endValue, gradient);
        }

        /**
         * Interpolates a Vector3 cubically. 
         * @param {Vector3} startValue - Start value of the animation curve.
         * @param {Vector3} outTangent - End tangent of the animation.
         * @param {Vector3} endValue - End value of the animation curve.
         * @param {Vector3} inTangent - Start tangent of the animation curve..
         * @param {number} gradient - Scalar amount to interpolate. 
         * @returns {Vector3} Interpolated Vector3 value.
         */
        public vector3InterpolateFunctionWithTangents(startValue: Vector3, outTangent: Vector3, endValue: Vector3, inTangent: Vector3, gradient: number): Vector3 {
            return Vector3.Hermite(startValue, outTangent, endValue, inTangent, gradient);
        }

        /**
         * Interpolates a Vector2 linearly.
         * @param {Vector2} startValue - Start value of the animation curve.
         * @param {Vector2} endValue - End value of the animation curve.
         * @param {number} gradient - Scalar amount to interpolate.
         * @returns {Vector2} - Interpolated Vector2 value.
         */
        public vector2InterpolateFunction(startValue: Vector2, endValue: Vector2, gradient: number): Vector2 {
            return Vector2.Lerp(startValue, endValue, gradient);
        }

        /**
         * Interpolates a Vector2 cubically. 
         * @param {Vector2} startValue - Start value of the animation curve.
         * @param {Vector2} outTangent - End tangent of the animation.
         * @param {Vector2} endValue - End value of the animation curve.
         * @param {Vector2} inTangent - Start tangent of the animation curve..
         * @param {number} gradient - Scalar amount to interpolate. 
         * @returns {Vector2} - Interpolated Vector2 value.
         */
        public vector2InterpolateFunctionWithTangents(startValue: Vector2, outTangent: Vector2, endValue: Vector2, inTangent: Vector2, gradient: number): Vector2 {
            return Vector2.Hermite(startValue, outTangent, endValue, inTangent, gradient);
        }

        /**
         * Interpolates a size linearly.
         * @param {Size} startValue - Start value of the animation curve.
         * @param {Size} endValue - End value of the animation curve.
         * @param {number} gradient - Scalar amount to interpolate.
         * @returns {Size} - Interpolated Size value.
         */
        public sizeInterpolateFunction(startValue: Size, endValue: Size, gradient: number): Size {
            return Size.Lerp(startValue, endValue, gradient);
        }

        /**
         * Interpolates a Color3 linearly.
         * @param {Color3} startValue - Start value of the animation curve.
         * @param {Color3} endValue - End value of the animation curve.
         * @param {number} gradient - Scalar amount to interpolate.
         * @returns {Color3} - Interpolated Color3 value.
         */
        public color3InterpolateFunction(startValue: Color3, endValue: Color3, gradient: number): Color3 {
            return Color3.Lerp(startValue, endValue, gradient);
        }

        /**
         * Gets the value from the key.
         * @param {any} value - The key storing the value, or the value itself.
         * @returns {any} - The value. 
         */
        public _getKeyValue(value: any): any {
            if (typeof value === "function") {
                return value();
            }

            return value;
        } 

        /**
         * Interpolates the animation from the current frame.
         * @param {number} currentFrame - The frame to interpolate the animation to.
         * @param {number} repeatCount - The number of times that the animation should loop.
         * @param {any} workValue - A caching value used for interpolation calculations.
         * @param {number} loopMode - The type of looping mode to use.
         * @param {any} offsetValue - Animation offset value.
         * @param {any} highLimitValue - The high limit value.
         * @returns {any} - The interpolated value.
         */
        public _interpolate(currentFrame: number, repeatCount: number, workValue?: any, loopMode?: number, offsetValue?: any, highLimitValue?: any): any {
            if (loopMode === Animation.ANIMATIONLOOPMODE_CONSTANT && repeatCount > 0) {
                return highLimitValue.clone ? highLimitValue.clone() : highLimitValue;
            }

            let keys = this.getKeys();

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
                    if (startKey.interpolation === AnimationKeyInterpolation.STEP) {
                        return startValue;
                    }

                    var endValue = this._getKeyValue(endKey.value);

                    var useTangent = startKey.outTangent !== undefined && endKey.inTangent !== undefined;
                    var frameDelta = endKey.frame - startKey.frame;

                    // gradient : percent of currentFrame between the frame inf and the frame sup
                    var gradient = (currentFrame - startKey.frame) / frameDelta;

                    // check for easingFunction and correction of gradient
                    let easingFunction = this.getEasingFunction();
                    if (easingFunction != null) {
                        gradient = easingFunction.ease(gradient);
                    }

                    switch (this.dataType) {
                        // Float
                        case Animation.ANIMATIONTYPE_FLOAT:
                            var floatValue = useTangent ? this.floatInterpolateFunctionWithTangents(startValue, startKey.outTangent * frameDelta, endValue, endKey.inTangent * frameDelta, gradient) : this.floatInterpolateFunction(startValue, endValue, gradient);
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
                            var quatValue = useTangent ? this.quaternionInterpolateFunctionWithTangents(startValue, startKey.outTangent.scale(frameDelta), endValue, endKey.inTangent.scale(frameDelta), gradient) : this.quaternionInterpolateFunction(startValue, endValue, gradient);
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return quatValue;
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return quatValue.addInPlace(offsetValue.scale(repeatCount));
                            }

                            return quatValue;
                        // Vector3
                        case Animation.ANIMATIONTYPE_VECTOR3:
                            var vec3Value = useTangent ? this.vector3InterpolateFunctionWithTangents(startValue, startKey.outTangent.scale(frameDelta), endValue, endKey.inTangent.scale(frameDelta), gradient) : this.vector3InterpolateFunction(startValue, endValue, gradient);
                            switch (loopMode) {
                                case Animation.ANIMATIONLOOPMODE_CYCLE:
                                case Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return vec3Value;
                                case Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return vec3Value.add(offsetValue.scale(repeatCount));
                            }
                        // Vector2
                        case Animation.ANIMATIONTYPE_VECTOR2:
                            var vec2Value = useTangent ? this.vector2InterpolateFunctionWithTangents(startValue, startKey.outTangent.scale(frameDelta), endValue, endKey.inTangent.scale(frameDelta), gradient) : this.vector2InterpolateFunction(startValue, endValue, gradient);
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
                                    if (Animation.AllowMatricesInterpolation) {
                                        workValue = this.matrixInterpolateFunction(startValue, endValue, gradient, workValue);
                                        return workValue;
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

        /**
         * Defines the function to use to interpolate matrices
         * @param {Matrix} startValue defines the start matrix
         * @param {Matrix} endValue defines the end matrix
         * @param {number} gradient defines the gradient between both matrices 
         * @param {Matrix} result defines an optional target matrix where to store the interpolation
         * @returns {Matrix} the interpolated matrix
         */
        public matrixInterpolateFunction(startValue: Matrix, endValue: Matrix, gradient: number, result?: Matrix): Matrix {
            if (Animation.AllowMatrixDecomposeForInterpolation) {
                if (result) {
                    Matrix.DecomposeLerpToRef(startValue, endValue, gradient, result);    
                    return result;
                }
                return Matrix.DecomposeLerp(startValue, endValue, gradient);
            }

            if (result) {
                Matrix.LerpToRef(startValue, endValue, gradient, result);
                return result;
            }
            return Matrix.Lerp(startValue, endValue, gradient);
        }

        /**
         * Makes a copy of the animation.
         * @returns {Animation} - Cloned animation. 
         */
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

        /**
         * Sets the key frames of the animation.
         * @param values - The animation key frames to set.
         */
        public setKeys(values: Array<IAnimationKey>): void {
            this._keys = values.slice(0);
        }

        /**
         * Serializes the animation to an object.
         * @returns {any} - Serialized object.
         */
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
                let source = this._ranges[name];

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
        /**
         * Float animation type.
         */
        private static _ANIMATIONTYPE_FLOAT = 0;
        /**
         * Vector3 animation type.
         */
        private static _ANIMATIONTYPE_VECTOR3 = 1;
        /**
         * Quaternion animation type.
         */
        private static _ANIMATIONTYPE_QUATERNION = 2;
        /**
         * Matrix animation type.
         */
        private static _ANIMATIONTYPE_MATRIX = 3;
        /**
         * Color3 animation type.
         */
        private static _ANIMATIONTYPE_COLOR3 = 4;
        /**
         * Vector2 animation type.
         */
        private static _ANIMATIONTYPE_VECTOR2 = 5;
        /**
         * Size animation type.
         */
        private static _ANIMATIONTYPE_SIZE = 6;
        /**
         * Relative Loop Mode.
         */
        private static _ANIMATIONLOOPMODE_RELATIVE = 0;
        /**
         * Cycle Loop Mode.
         */
        private static _ANIMATIONLOOPMODE_CYCLE = 1;
        /**
         * Constant Loop Mode.
         */
        private static _ANIMATIONLOOPMODE_CONSTANT = 2;

        /**
         * Get the float animation type.
         */
        public static get ANIMATIONTYPE_FLOAT(): number {
            return Animation._ANIMATIONTYPE_FLOAT;
        }

        /**
         * Get the Vector3 animation type.
         */
        public static get ANIMATIONTYPE_VECTOR3(): number {
            return Animation._ANIMATIONTYPE_VECTOR3;
        }

        /**
         * Get the Vectpr2 animation type.
         */
        public static get ANIMATIONTYPE_VECTOR2(): number {
            return Animation._ANIMATIONTYPE_VECTOR2;
        }

        /**
         * Get the Size animation type.
         */
        public static get ANIMATIONTYPE_SIZE(): number {
            return Animation._ANIMATIONTYPE_SIZE;
        }

        /**
         * Get the Quaternion animation type.
         */
        public static get ANIMATIONTYPE_QUATERNION(): number {
            return Animation._ANIMATIONTYPE_QUATERNION;
        }

        /**
         * Get the Matrix animation type.
         */
        public static get ANIMATIONTYPE_MATRIX(): number {
            return Animation._ANIMATIONTYPE_MATRIX;
        }

        /**
         * Get the Color3 animation type.
         */
        public static get ANIMATIONTYPE_COLOR3(): number {
            return Animation._ANIMATIONTYPE_COLOR3;
        }

        /**
         * Get the Relative Loop Mode.
         */
        public static get ANIMATIONLOOPMODE_RELATIVE(): number {
            return Animation._ANIMATIONLOOPMODE_RELATIVE;
        }

        /**
         * Get the Cycle Loop Mode.
         */
        public static get ANIMATIONLOOPMODE_CYCLE(): number {
            return Animation._ANIMATIONLOOPMODE_CYCLE;
        }

        /**
         * Get the Constant Loop Mode.
         */
        public static get ANIMATIONLOOPMODE_CONSTANT(): number {
            return Animation._ANIMATIONLOOPMODE_CONSTANT;
        }

        /**
         * Parses an animation object and creates an animation.
         * @param parsedAnimation - Parsed animation object.
         * @returns {Animation} - Animation object.
         */
        public static Parse(parsedAnimation: any): Animation {
            var animation = new Animation(parsedAnimation.name, parsedAnimation.property, parsedAnimation.framePerSecond, parsedAnimation.dataType, parsedAnimation.loopBehavior);

            var dataType = parsedAnimation.dataType;
            var keys: Array<IAnimationKey> = [];
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
                var inTangent: any;
                var outTangent: any;

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

                var keyData: any = {};
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

        /**
         * Appends the serialized animations from the source animations.
         * @param {IAnimatable} source - Source containing the animations.
         * @param {any} destination  - Target to store the animations.
         */
        public static AppendSerializedAnimations(source: IAnimatable, destination: any): void {
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


