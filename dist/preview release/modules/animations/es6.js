var __extends = (this && this.__extends) || (function () {
var extendStatics = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
return function (d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
})();


import * as BABYLON from 'babylonjs/core/es6';
var BABYLON;
(function (BABYLON) {
    var AnimationRange = /** @class */ (function () {
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
    var AnimationEvent = /** @class */ (function () {
        function AnimationEvent(frame, action, onlyOnce) {
            this.frame = frame;
            this.action = action;
            this.onlyOnce = onlyOnce;
            this.isDone = false;
        }
        return AnimationEvent;
    }());
    BABYLON.AnimationEvent = AnimationEvent;
    var PathCursor = /** @class */ (function () {
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
    var Animation = /** @class */ (function () {
        function Animation(name, targetProperty, framePerSecond, dataType, loopMode, enableBlending) {
            this.name = name;
            this.targetProperty = targetProperty;
            this.framePerSecond = framePerSecond;
            this.dataType = dataType;
            this.loopMode = loopMode;
            this.enableBlending = enableBlending;
            this._runtimeAnimations = new Array();
            // The set of event that will be linked to this animation
            this._events = new Array();
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
        /**
         * Sets up an animation.
         * @param property the property to animate
         * @param animationType the animation type to apply
         * @param easingFunction the easing function used in the animation
         * @returns The created animation
         */
        Animation.CreateAnimation = function (property, animationType, framePerSecond, easingFunction) {
            var animation = new Animation(property + "Animation", property, framePerSecond, animationType, Animation.ANIMATIONLOOPMODE_CONSTANT);
            animation.setEasingFunction(easingFunction);
            return animation;
        };
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
         * @returns the animatable created for this animation
         */
        Animation.CreateAndStartAnimation = function (name, node, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction, onAnimationEnd) {
            var animation = Animation._PrepareAnimation(name, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction);
            if (!animation) {
                return null;
            }
            return node.getScene().beginDirectAnimation(node, [animation], 0, totalFrame, (animation.loopMode === 1), 1.0, onAnimationEnd);
        };
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
         * @param onAnimationEnd defines the callback to call when an animation ends (will be called once per node)
         * @returns the list of animatables created for all nodes
         * @example https://www.babylonjs-playground.com/#MH0VLI
         */
        Animation.CreateAndStartHierarchyAnimation = function (name, node, directDescendantsOnly, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction, onAnimationEnd) {
            var animation = Animation._PrepareAnimation(name, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction);
            if (!animation) {
                return null;
            }
            var scene = node.getScene();
            return scene.beginDirectHierarchyAnimation(node, directDescendantsOnly, [animation], 0, totalFrame, (animation.loopMode === 1), 1.0, onAnimationEnd);
        };
        Animation.CreateMergeAndStartAnimation = function (name, node, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction, onAnimationEnd) {
            var animation = Animation._PrepareAnimation(name, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction);
            if (!animation) {
                return null;
            }
            node.animations.push(animation);
            return node.getScene().beginAnimation(node, 0, totalFrame, (animation.loopMode === 1), 1.0, onAnimationEnd);
        };
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
        Animation.TransitionTo = function (property, targetValue, host, scene, frameRate, transition, duration, onAnimationEnd) {
            if (onAnimationEnd === void 0) { onAnimationEnd = null; }
            if (duration <= 0) {
                host[property] = targetValue;
                if (onAnimationEnd) {
                    onAnimationEnd();
                }
                return null;
            }
            var endFrame = frameRate * (duration / 1000);
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
            var animation = scene.beginAnimation(host, 0, endFrame, false);
            animation.onAnimationEnd = onAnimationEnd;
            return animation;
        };
        Object.defineProperty(Animation.prototype, "runtimeAnimations", {
            /**
             * Return the array of runtime animations currently using this animation
             */
            get: function () {
                return this._runtimeAnimations;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Animation.prototype, "hasRunningRuntimeAnimations", {
            get: function () {
                for (var _i = 0, _a = this._runtimeAnimations; _i < _a.length; _i++) {
                    var runtimeAnimation = _a[_i];
                    if (!runtimeAnimation.isStopped) {
                        return true;
                    }
                }
                return false;
            },
            enumerable: true,
            configurable: true
        });
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
        Animation.prototype.getEvents = function () {
            return this._events;
        };
        Animation.prototype.createRange = function (name, from, to) {
            // check name not already in use; could happen for bones after serialized
            if (!this._ranges[name]) {
                this._ranges[name] = new AnimationRange(name, from, to);
            }
        };
        Animation.prototype.deleteRange = function (name, deleteFrames) {
            if (deleteFrames === void 0) { deleteFrames = true; }
            var range = this._ranges[name];
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
        };
        Animation.prototype.getRange = function (name) {
            return this._ranges[name];
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
            return BABYLON.Scalar.Lerp(startValue, endValue, gradient);
        };
        Animation.prototype.floatInterpolateFunctionWithTangents = function (startValue, outTangent, endValue, inTangent, gradient) {
            return BABYLON.Scalar.Hermite(startValue, outTangent, endValue, inTangent, gradient);
        };
        Animation.prototype.quaternionInterpolateFunction = function (startValue, endValue, gradient) {
            return BABYLON.Quaternion.Slerp(startValue, endValue, gradient);
        };
        Animation.prototype.quaternionInterpolateFunctionWithTangents = function (startValue, outTangent, endValue, inTangent, gradient) {
            return BABYLON.Quaternion.Hermite(startValue, outTangent, endValue, inTangent, gradient).normalize();
        };
        Animation.prototype.vector3InterpolateFunction = function (startValue, endValue, gradient) {
            return BABYLON.Vector3.Lerp(startValue, endValue, gradient);
        };
        Animation.prototype.vector3InterpolateFunctionWithTangents = function (startValue, outTangent, endValue, inTangent, gradient) {
            return BABYLON.Vector3.Hermite(startValue, outTangent, endValue, inTangent, gradient);
        };
        Animation.prototype.vector2InterpolateFunction = function (startValue, endValue, gradient) {
            return BABYLON.Vector2.Lerp(startValue, endValue, gradient);
        };
        Animation.prototype.vector2InterpolateFunctionWithTangents = function (startValue, outTangent, endValue, inTangent, gradient) {
            return BABYLON.Vector2.Hermite(startValue, outTangent, endValue, inTangent, gradient);
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
            clone.enableBlending = this.enableBlending;
            clone.blendingSpeed = this.blendingSpeed;
            if (this._keys) {
                clone.setKeys(this._keys);
            }
            if (this._ranges) {
                clone._ranges = {};
                for (var name in this._ranges) {
                    var range = this._ranges[name];
                    if (!range) {
                        continue;
                    }
                    clone._ranges[name] = range.clone();
                }
            }
            return clone;
        };
        Animation.prototype.setKeys = function (values) {
            this._keys = values.slice(0);
        };
        Animation.prototype.serialize = function () {
            var serializationObject = {};
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
                var source = this._ranges[name];
                if (!source) {
                    continue;
                }
                var range = {};
                range.name = name;
                range.from = source.from;
                range.to = source.to;
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
            if (parsedAnimation.enableBlending) {
                animation.enableBlending = parsedAnimation.enableBlending;
            }
            if (parsedAnimation.blendingSpeed) {
                animation.blendingSpeed = parsedAnimation.blendingSpeed;
            }
            for (index = 0; index < parsedAnimation.keys.length; index++) {
                var key = parsedAnimation.keys[index];
                var inTangent;
                var outTangent;
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
                        data = BABYLON.Quaternion.FromArray(key.values);
                        if (key.values.length >= 8) {
                            var _inTangent = BABYLON.Quaternion.FromArray(key.values.slice(4, 8));
                            if (!_inTangent.equals(BABYLON.Quaternion.Zero())) {
                                inTangent = _inTangent;
                            }
                        }
                        if (key.values.length >= 12) {
                            var _outTangent = BABYLON.Quaternion.FromArray(key.values.slice(8, 12));
                            if (!_outTangent.equals(BABYLON.Quaternion.Zero())) {
                                outTangent = _outTangent;
                            }
                        }
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
                var keyData = {};
                keyData.frame = key.frame;
                keyData.value = data;
                if (inTangent != undefined) {
                    keyData.inTangent = inTangent;
                }
                if (outTangent != undefined) {
                    keyData.outTangent = outTangent;
                }
                keys.push(keyData);
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
        Animation.AllowMatricesInterpolation = false;
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

var BABYLON;
(function (BABYLON) {
    /**
     * This class defines the direct association between an animation and a target
     */
    var TargetedAnimation = /** @class */ (function () {
        function TargetedAnimation() {
        }
        return TargetedAnimation;
    }());
    BABYLON.TargetedAnimation = TargetedAnimation;
    /**
     * Use this class to create coordinated animations on multiple targets
     */
    var AnimationGroup = /** @class */ (function () {
        function AnimationGroup(name, scene) {
            if (scene === void 0) { scene = null; }
            this.name = name;
            this._targetedAnimations = new Array();
            this._animatables = new Array();
            this._from = Number.MAX_VALUE;
            this._to = Number.MIN_VALUE;
            this._speedRatio = 1;
            this.onAnimationEndObservable = new BABYLON.Observable();
            this._scene = scene || BABYLON.Engine.LastCreatedScene;
            this._scene.animationGroups.push(this);
        }
        Object.defineProperty(AnimationGroup.prototype, "isStarted", {
            /**
             * Define if the animations are started
             */
            get: function () {
                return this._isStarted;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationGroup.prototype, "speedRatio", {
            /**
             * Gets or sets the speed ratio to use for all animations
             */
            get: function () {
                return this._speedRatio;
            },
            /**
             * Gets or sets the speed ratio to use for all animations
             */
            set: function (value) {
                if (this._speedRatio === value) {
                    return;
                }
                this._speedRatio = value;
                for (var index = 0; index < this._animatables.length; index++) {
                    var animatable = this._animatables[index];
                    animatable.speedRatio = this._speedRatio;
                }
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Add an animation (with its target) in the group
         * @param animation defines the animation we want to add
         * @param target defines the target of the animation
         * @returns the {BABYLON.TargetedAnimation} object
         */
        AnimationGroup.prototype.addTargetedAnimation = function (animation, target) {
            var targetedAnimation = {
                animation: animation,
                target: target
            };
            var keys = animation.getKeys();
            if (this._from > keys[0].frame) {
                this._from = keys[0].frame;
            }
            if (this._to < keys[keys.length - 1].frame) {
                this._to = keys[keys.length - 1].frame;
            }
            this._targetedAnimations.push(targetedAnimation);
            return targetedAnimation;
        };
        /**
         * This function will normalize every animation in the group to make sure they all go from beginFrame to endFrame
         * It can add constant keys at begin or end
         * @param beginFrame defines the new begin frame for all animations. It can't be bigger than the smaller begin frame of all animations
         * @param endFrame defines the new end frame for all animations. It can't be smaller than the larger end frame of all animations
         */
        AnimationGroup.prototype.normalize = function (beginFrame, endFrame) {
            beginFrame = Math.min(beginFrame, this._from);
            endFrame = Math.min(endFrame, this._to);
            for (var index = 0; index < this._targetedAnimations.length; index++) {
                var targetedAnimation = this._targetedAnimations[index];
                var keys = targetedAnimation.animation.getKeys();
                var startKey = keys[0];
                var endKey = keys[keys.length - 1];
                if (startKey.frame > beginFrame) {
                    var newKey = {
                        frame: beginFrame,
                        value: startKey.value,
                        inTangent: startKey.inTangent,
                        outTangent: startKey.outTangent
                    };
                    keys.splice(0, 0, newKey);
                }
                if (endKey.frame < endFrame) {
                    var newKey = {
                        frame: endFrame,
                        value: endKey.value,
                        inTangent: startKey.outTangent,
                        outTangent: startKey.outTangent
                    };
                    keys.push(newKey);
                }
            }
            return this;
        };
        /**
         * Start all animations on given targets
         * @param loop defines if animations must loop
         * @param speedRatio defines the ratio to apply to animation speed (1 by default)
         */
        AnimationGroup.prototype.start = function (loop, speedRatio) {
            var _this = this;
            if (loop === void 0) { loop = false; }
            if (speedRatio === void 0) { speedRatio = 1; }
            if (this._isStarted || this._targetedAnimations.length === 0) {
                return this;
            }
            var _loop_1 = function () {
                var targetedAnimation = this_1._targetedAnimations[index];
                this_1._animatables.push(this_1._scene.beginDirectAnimation(targetedAnimation.target, [targetedAnimation.animation], this_1._from, this_1._to, loop, speedRatio, function () {
                    _this.onAnimationEndObservable.notifyObservers(targetedAnimation);
                }));
            };
            var this_1 = this;
            for (var index = 0; index < this._targetedAnimations.length; index++) {
                _loop_1();
            }
            this._speedRatio = speedRatio;
            this._isStarted = true;
            return this;
        };
        /**
         * Pause all animations
         */
        AnimationGroup.prototype.pause = function () {
            if (!this._isStarted) {
                return this;
            }
            for (var index = 0; index < this._animatables.length; index++) {
                var animatable = this._animatables[index];
                animatable.pause();
            }
            return this;
        };
        /**
         * Play all animations to initial state
         * This function will start() the animations if they were not started or will restart() them if they were paused
         * @param loop defines if animations must loop
         */
        AnimationGroup.prototype.play = function (loop) {
            if (this.isStarted) {
                if (loop !== undefined) {
                    for (var index = 0; index < this._animatables.length; index++) {
                        var animatable = this._animatables[index];
                        animatable.loopAnimation = loop;
                    }
                }
                this.restart();
            }
            else {
                this.start(loop, this._speedRatio);
            }
            return this;
        };
        /**
         * Reset all animations to initial state
         */
        AnimationGroup.prototype.reset = function () {
            if (!this._isStarted) {
                return this;
            }
            for (var index = 0; index < this._animatables.length; index++) {
                var animatable = this._animatables[index];
                animatable.reset();
            }
            return this;
        };
        /**
         * Restart animations from key 0
         */
        AnimationGroup.prototype.restart = function () {
            if (!this._isStarted) {
                return this;
            }
            for (var index = 0; index < this._animatables.length; index++) {
                var animatable = this._animatables[index];
                animatable.restart();
            }
            return this;
        };
        /**
         * Stop all animations
         */
        AnimationGroup.prototype.stop = function () {
            if (!this._isStarted) {
                return this;
            }
            for (var index = 0; index < this._animatables.length; index++) {
                var animatable = this._animatables[index];
                animatable.stop();
            }
            this._isStarted = false;
            return this;
        };
        /**
         * Dispose all associated resources
         */
        AnimationGroup.prototype.dispose = function () {
            this._targetedAnimations = [];
            this._animatables = [];
            var index = this._scene.animationGroups.indexOf(this);
            if (index > -1) {
                this._scene.animationGroups.splice(index, 1);
            }
        };
        return AnimationGroup;
    }());
    BABYLON.AnimationGroup = AnimationGroup;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.animationGroup.js.map

BABYLON.Effect.ShadersStore['defaultVertexShader'] = "#include<__decl__defaultVertex>\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef TANGENT\nattribute vec4 tangent;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<helperFunctions>\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nvarying vec2 vDiffuseUV;\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nvarying vec2 vAmbientUV;\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nvarying vec2 vOpacityUV;\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nvarying vec2 vEmissiveUV;\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nvarying vec2 vLightmapUV;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nvarying vec2 vSpecularUV;\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nvarying vec2 vBumpUV;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<bumpVertexDeclaration>\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#include<logDepthDeclaration>\nvoid main(void) {\nvec3 positionUpdated=position;\n#ifdef NORMAL \nvec3 normalUpdated=normal;\n#endif\n#ifdef TANGENT\nvec4 tangentUpdated=tangent;\n#endif\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvPositionUVW=positionUpdated;\n#endif \n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\nvec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nmat3 normalWorld=mat3(finalWorld);\n#ifdef NONUNIFORMSCALING\nnormalWorld=transposeMat3(inverseMat3(normalWorld));\n#endif\nvNormalW=normalize(normalWorld*normalUpdated);\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef MAINUV1\nvMainUV1=uv;\n#endif\n#ifdef MAINUV2\nvMainUV2=uv2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nif (vAmbientInfos.x == 0.)\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nif (vOpacityInfos.x == 0.)\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nif (vEmissiveInfos.x == 0.)\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nif (vLightmapInfos.x == 0.)\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nif (vSpecularInfos.x == 0.)\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nif (vBumpInfos.x == 0.)\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#include<bumpVertex>\n#include<clipPlaneVertex>\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n#ifdef VERTEXCOLOR\n\nvColor=color;\n#endif\n#include<pointCloudVertex>\n#include<logDepthVertex>\n}";
BABYLON.Effect.ShadersStore['defaultPixelShader'] = "#include<__decl__defaultFragment>\n#if defined(BUMP) || !defined(NORMAL)\n#extension GL_OES_standard_derivatives : enable\n#endif\n#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\n\n#define RECIPROCAL_PI2 0.15915494\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\n#if DIFFUSEDIRECTUV == 1\n#define vDiffuseUV vMainUV1\n#elif DIFFUSEDIRECTUV == 2\n#define vDiffuseUV vMainUV2\n#else\nvarying vec2 vDiffuseUV;\n#endif\nuniform sampler2D diffuseSampler;\n#endif\n#ifdef AMBIENT\n#if AMBIENTDIRECTUV == 1\n#define vAmbientUV vMainUV1\n#elif AMBIENTDIRECTUV == 2\n#define vAmbientUV vMainUV2\n#else\nvarying vec2 vAmbientUV;\n#endif\nuniform sampler2D ambientSampler;\n#endif\n#ifdef OPACITY \n#if OPACITYDIRECTUV == 1\n#define vOpacityUV vMainUV1\n#elif OPACITYDIRECTUV == 2\n#define vOpacityUV vMainUV2\n#else\nvarying vec2 vOpacityUV;\n#endif\nuniform sampler2D opacitySampler;\n#endif\n#ifdef EMISSIVE\n#if EMISSIVEDIRECTUV == 1\n#define vEmissiveUV vMainUV1\n#elif EMISSIVEDIRECTUV == 2\n#define vEmissiveUV vMainUV2\n#else\nvarying vec2 vEmissiveUV;\n#endif\nuniform sampler2D emissiveSampler;\n#endif\n#ifdef LIGHTMAP\n#if LIGHTMAPDIRECTUV == 1\n#define vLightmapUV vMainUV1\n#elif LIGHTMAPDIRECTUV == 2\n#define vLightmapUV vMainUV2\n#else\nvarying vec2 vLightmapUV;\n#endif\nuniform sampler2D lightmapSampler;\n#endif\n#ifdef REFRACTION\n#ifdef REFRACTIONMAP_3D\nuniform samplerCube refractionCubeSampler;\n#else\nuniform sampler2D refraction2DSampler;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\n#if SPECULARDIRECTUV == 1\n#define vSpecularUV vMainUV1\n#elif SPECULARDIRECTUV == 2\n#define vSpecularUV vMainUV2\n#else\nvarying vec2 vSpecularUV;\n#endif\nuniform sampler2D specularSampler;\n#endif\n\n#include<fresnelFunction>\n\n#ifdef REFLECTION\n#ifdef REFLECTIONMAP_3D\nuniform samplerCube reflectionCubeSampler;\n#else\nuniform sampler2D reflection2DSampler;\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#else\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#endif\n#include<reflectionFunction>\n#endif\n#include<imageProcessingDeclaration>\n#include<imageProcessingFunctions>\n#include<bumpFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=normalize(-cross(dFdx(vPositionW),dFdy(vPositionW)));\n#endif\n#include<bumpFragment>\n#ifdef TWOSIDEDLIGHTING\nnormalW=gl_FrontFacing ? normalW : -normalW;\n#endif\n#ifdef DIFFUSE\nbaseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#ifdef ALPHAFROMDIFFUSE\nalpha*=baseColor.a;\n#endif\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#include<depthPrePass>\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\nvec3 baseAmbientColor=vec3(1.,1.,1.);\n#ifdef AMBIENT\nbaseAmbientColor=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\n#endif\n\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularColor=vSpecularColor.rgb;\n#ifdef SPECULAR\nvec4 specularMapColor=texture2D(specularSampler,vSpecularUV+uvOffset);\nspecularColor=specularMapColor.rgb;\n#ifdef GLOSSINESS\nglossiness=glossiness*specularMapColor.a;\n#endif\n#endif\n#else\nfloat glossiness=0.;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif\nfloat shadow=1.;\n#ifdef LIGHTMAP\nvec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\n\nvec3 refractionColor=vec3(0.,0.,0.);\n#ifdef REFRACTION\nvec3 refractionVector=normalize(refract(-viewDirectionW,normalW,vRefractionInfos.y));\n#ifdef REFRACTIONMAP_3D\nrefractionVector.y=refractionVector.y*vRefractionInfos.w;\nif (dot(refractionVector,viewDirectionW)<1.0)\n{\nrefractionColor=textureCube(refractionCubeSampler,refractionVector).rgb*vRefractionInfos.x;\n}\n#else\nvec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\nvec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\nrefractionCoords.y=1.0-refractionCoords.y;\nrefractionColor=texture2D(refraction2DSampler,refractionCoords).rgb*vRefractionInfos.x;\n#endif\n#endif\n\nvec3 reflectionColor=vec3(0.,0.,0.);\n#ifdef REFLECTION\nvec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n#ifdef REFLECTIONMAP_3D\n#ifdef ROUGHNESS\nfloat bias=vReflectionInfos.y;\n#ifdef SPECULARTERM\n#ifdef SPECULAR\n#ifdef GLOSSINESS\nbias*=(1.0-specularMapColor.a);\n#endif\n#endif\n#endif\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW,bias).rgb*vReflectionInfos.x;\n#else\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW).rgb*vReflectionInfos.x;\n#endif\n#else\nvec2 coords=vReflectionUVW.xy;\n#ifdef REFLECTIONMAP_PROJECTION\ncoords/=vReflectionUVW.z;\n#endif\ncoords.y=1.0-coords.y;\nreflectionColor=texture2D(reflection2DSampler,coords).rgb*vReflectionInfos.x;\n#endif\n#ifdef REFLECTIONFRESNEL\nfloat reflectionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,reflectionRightColor.a,reflectionLeftColor.a);\n#ifdef REFLECTIONFRESNELFROMSPECULAR\n#ifdef SPECULARTERM\nreflectionColor*=specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#endif\n#endif\n#ifdef REFRACTIONFRESNEL\nfloat refractionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,refractionRightColor.a,refractionLeftColor.a);\nrefractionColor*=refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*refractionRightColor.rgb;\n#endif\n#ifdef OPACITY\nvec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\n#ifdef OPACITYRGB\nopacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\nalpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n#else\nalpha*=opacityMap.a*vOpacityInfos.y;\n#endif\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef OPACITYFRESNEL\nfloat opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\nalpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\n#endif\n\nvec3 emissiveColor=vEmissiveColor;\n#ifdef EMISSIVE\nemissiveColor+=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb*vEmissiveInfos.y;\n#endif\n#ifdef EMISSIVEFRESNEL\nfloat emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\nemissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\n#endif\n\n#ifdef DIFFUSEFRESNEL\nfloat diffuseFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,diffuseRightColor.a,diffuseLeftColor.a);\ndiffuseBase*=diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*diffuseRightColor.rgb;\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\n#ifdef LINKEMISSIVEWITHDIFFUSE\nvec3 finalDiffuse=clamp((diffuseBase+emissiveColor)*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#endif\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#ifdef SPECULAROVERALPHA\nalpha=clamp(alpha+dot(finalSpecular,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#ifdef REFLECTIONOVERALPHA\nalpha=clamp(alpha+dot(reflectionColor,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec4 color=vec4(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+emissiveColor+refractionColor,0.0,1.0),alpha);\n#else\nvec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+refractionColor,alpha);\n#endif\n\n#ifdef LIGHTMAP\n#ifndef LIGHTMAPEXCLUDED\n#ifdef USELIGHTMAPASSHADOWMAP\ncolor.rgb*=lightmapColor;\n#else\ncolor.rgb+=lightmapColor;\n#endif\n#endif\n#endif\n#include<logDepthFragment>\n#include<fogFragment>\n\n\n#ifdef IMAGEPROCESSINGPOSTPROCESS\ncolor.rgb=toLinearSpace(color.rgb);\n#else\n#ifdef IMAGEPROCESSING\ncolor.rgb=toLinearSpace(color.rgb);\ncolor=applyImageProcessing(color);\n#endif\n#endif\n#ifdef PREMULTIPLYALPHA\n\ncolor.rgb*=color.a;\n#endif\ngl_FragColor=color;\n}";

var BABYLON;
(function (BABYLON) {
    var RuntimeAnimation = /** @class */ (function () {
        function RuntimeAnimation(target, animation) {
            this._offsetsCache = {};
            this._highLimitsCache = {};
            this._stopped = false;
            this._blendingFactor = 0;
            this._ratioOffset = 0;
            this._animation = animation;
            this._target = target;
            animation._runtimeAnimations.push(this);
        }
        Object.defineProperty(RuntimeAnimation.prototype, "animation", {
            get: function () {
                return this._animation;
            },
            enumerable: true,
            configurable: true
        });
        RuntimeAnimation.prototype.reset = function () {
            this._offsetsCache = {};
            this._highLimitsCache = {};
            this.currentFrame = 0;
            this._blendingFactor = 0;
            this._originalBlendValue = null;
        };
        RuntimeAnimation.prototype.isStopped = function () {
            return this._stopped;
        };
        RuntimeAnimation.prototype.dispose = function () {
            var index = this._animation.runtimeAnimations.indexOf(this);
            if (index > -1) {
                this._animation.runtimeAnimations.splice(index, 1);
            }
        };
        RuntimeAnimation.prototype._getKeyValue = function (value) {
            if (typeof value === "function") {
                return value();
            }
            return value;
        };
        RuntimeAnimation.prototype._interpolate = function (currentFrame, repeatCount, loopMode, offsetValue, highLimitValue) {
            if (loopMode === BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT && repeatCount > 0) {
                return highLimitValue.clone ? highLimitValue.clone() : highLimitValue;
            }
            this.currentFrame = currentFrame;
            var keys = this._animation.getKeys();
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
                    var easingFunction = this._animation.getEasingFunction();
                    if (easingFunction != null) {
                        gradient = easingFunction.ease(gradient);
                    }
                    switch (this._animation.dataType) {
                        // Float
                        case BABYLON.Animation.ANIMATIONTYPE_FLOAT:
                            var floatValue = useTangent ? this._animation.floatInterpolateFunctionWithTangents(startValue, startKey.outTangent * frameDelta, endValue, endKey.inTangent * frameDelta, gradient) : this._animation.floatInterpolateFunction(startValue, endValue, gradient);
                            switch (loopMode) {
                                case BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE:
                                case BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return floatValue;
                                case BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return offsetValue * repeatCount + floatValue;
                            }
                            break;
                        // Quaternion
                        case BABYLON.Animation.ANIMATIONTYPE_QUATERNION:
                            var quatValue = useTangent ? this._animation.quaternionInterpolateFunctionWithTangents(startValue, startKey.outTangent.scale(frameDelta), endValue, endKey.inTangent.scale(frameDelta), gradient) : this._animation.quaternionInterpolateFunction(startValue, endValue, gradient);
                            switch (loopMode) {
                                case BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE:
                                case BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return quatValue;
                                case BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return quatValue.add(offsetValue.scale(repeatCount));
                            }
                            return quatValue;
                        // Vector3
                        case BABYLON.Animation.ANIMATIONTYPE_VECTOR3:
                            var vec3Value = useTangent ? this._animation.vector3InterpolateFunctionWithTangents(startValue, startKey.outTangent.scale(frameDelta), endValue, endKey.inTangent.scale(frameDelta), gradient) : this._animation.vector3InterpolateFunction(startValue, endValue, gradient);
                            switch (loopMode) {
                                case BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE:
                                case BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return vec3Value;
                                case BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return vec3Value.add(offsetValue.scale(repeatCount));
                            }
                        // Vector2
                        case BABYLON.Animation.ANIMATIONTYPE_VECTOR2:
                            var vec2Value = useTangent ? this._animation.vector2InterpolateFunctionWithTangents(startValue, startKey.outTangent.scale(frameDelta), endValue, endKey.inTangent.scale(frameDelta), gradient) : this._animation.vector2InterpolateFunction(startValue, endValue, gradient);
                            switch (loopMode) {
                                case BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE:
                                case BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return vec2Value;
                                case BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return vec2Value.add(offsetValue.scale(repeatCount));
                            }
                        // Size
                        case BABYLON.Animation.ANIMATIONTYPE_SIZE:
                            switch (loopMode) {
                                case BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE:
                                case BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return this._animation.sizeInterpolateFunction(startValue, endValue, gradient);
                                case BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return this._animation.sizeInterpolateFunction(startValue, endValue, gradient).add(offsetValue.scale(repeatCount));
                            }
                        // Color3
                        case BABYLON.Animation.ANIMATIONTYPE_COLOR3:
                            switch (loopMode) {
                                case BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE:
                                case BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    return this._animation.color3InterpolateFunction(startValue, endValue, gradient);
                                case BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return this._animation.color3InterpolateFunction(startValue, endValue, gradient).add(offsetValue.scale(repeatCount));
                            }
                        // Matrix
                        case BABYLON.Animation.ANIMATIONTYPE_MATRIX:
                            switch (loopMode) {
                                case BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE:
                                case BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT:
                                    if (BABYLON.Animation.AllowMatricesInterpolation) {
                                        return this._animation.matrixInterpolateFunction(startValue, endValue, gradient);
                                    }
                                case BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE:
                                    return startValue;
                            }
                        default:
                            break;
                    }
                    break;
                }
            }
            return this._getKeyValue(keys[keys.length - 1].value);
        };
        RuntimeAnimation.prototype.setValue = function (currentValue, blend) {
            if (blend === void 0) { blend = false; }
            // Set value
            var path;
            var destination;
            var targetPropertyPath = this._animation.targetPropertyPath;
            if (targetPropertyPath.length > 1) {
                var property = this._target[targetPropertyPath[0]];
                for (var index = 1; index < targetPropertyPath.length - 1; index++) {
                    property = property[targetPropertyPath[index]];
                }
                path = targetPropertyPath[targetPropertyPath.length - 1];
                destination = property;
            }
            else {
                path = targetPropertyPath[0];
                destination = this._target;
            }
            // Blending
            if (this._animation.enableBlending && this._blendingFactor <= 1.0) {
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
                this._blendingFactor += this._animation.blendingSpeed;
            }
            else {
                destination[path] = currentValue;
            }
            if (this._target.markAsDirty) {
                this._target.markAsDirty(this._animation.targetProperty);
            }
        };
        RuntimeAnimation.prototype.goToFrame = function (frame) {
            var keys = this._animation.getKeys();
            if (frame < keys[0].frame) {
                frame = keys[0].frame;
            }
            else if (frame > keys[keys.length - 1].frame) {
                frame = keys[keys.length - 1].frame;
            }
            var currentValue = this._interpolate(frame, 0, this._animation.loopMode);
            this.setValue(currentValue);
        };
        RuntimeAnimation.prototype._prepareForSpeedRatioChange = function (newSpeedRatio) {
            var newRatio = this._previousDelay * (this._animation.framePerSecond * newSpeedRatio) / 1000.0;
            this._ratioOffset = this._previousRatio - newRatio;
        };
        RuntimeAnimation.prototype.animate = function (delay, from, to, loop, speedRatio, blend) {
            if (blend === void 0) { blend = false; }
            var targetPropertyPath = this._animation.targetPropertyPath;
            if (!targetPropertyPath || targetPropertyPath.length < 1) {
                this._stopped = true;
                return false;
            }
            var returnValue = true;
            var keys = this._animation.getKeys();
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
            if (from === to) {
                if (from > keys[0].frame) {
                    from--;
                }
                else if (to < keys[keys.length - 1].frame) {
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
            if (((to > from && ratio > range) || (from > to && ratio < range)) && !loop) {
                returnValue = false;
                highLimitValue = this._getKeyValue(keys[keys.length - 1].value);
            }
            else {
                // Get max value if required
                if (this._animation.loopMode !== BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE) {
                    var keyOffset = to.toString() + from.toString();
                    if (!this._offsetsCache[keyOffset]) {
                        var fromValue = this._interpolate(from, 0, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
                        var toValue = this._interpolate(to, 0, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
                        switch (this._animation.dataType) {
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
                            // Vector2
                            case BABYLON.Animation.ANIMATIONTYPE_VECTOR2:
                                this._offsetsCache[keyOffset] = toValue.subtract(fromValue);
                            // Size
                            case BABYLON.Animation.ANIMATIONTYPE_SIZE:
                                this._offsetsCache[keyOffset] = toValue.subtract(fromValue);
                            // Color3
                            case BABYLON.Animation.ANIMATIONTYPE_COLOR3:
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
                    case BABYLON.Animation.ANIMATIONTYPE_FLOAT:
                        offsetValue = 0;
                        break;
                    // Quaternion
                    case BABYLON.Animation.ANIMATIONTYPE_QUATERNION:
                        offsetValue = new BABYLON.Quaternion(0, 0, 0, 0);
                        break;
                    // Vector3
                    case BABYLON.Animation.ANIMATIONTYPE_VECTOR3:
                        offsetValue = BABYLON.Vector3.Zero();
                        break;
                    // Vector2
                    case BABYLON.Animation.ANIMATIONTYPE_VECTOR2:
                        offsetValue = BABYLON.Vector2.Zero();
                        break;
                    // Size
                    case BABYLON.Animation.ANIMATIONTYPE_SIZE:
                        offsetValue = BABYLON.Size.Zero();
                        break;
                    // Color3
                    case BABYLON.Animation.ANIMATIONTYPE_COLOR3:
                        offsetValue = BABYLON.Color3.Black();
                }
            }
            // Compute value
            var repeatCount = (ratio / range) >> 0;
            var currentFrame = returnValue ? from + ratio % range : to;
            var currentValue = this._interpolate(currentFrame, repeatCount, this._animation.loopMode, offsetValue, highLimitValue);
            // Set value
            this.setValue(currentValue);
            // Check events
            var events = this._animation.getEvents();
            for (var index = 0; index < events.length; index++) {
                // Make sure current frame has passed event frame and that event frame is within the current range
                // Also, handle both forward and reverse animations
                if ((range > 0 && currentFrame >= events[index].frame && events[index].frame >= from) ||
                    (range < 0 && currentFrame <= events[index].frame && events[index].frame <= from)) {
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
                }
                else if (events[index].isDone && !events[index].onlyOnce) {
                    // reset event, the animation is looping
                    events[index].isDone = false;
                }
            }
            if (!returnValue) {
                this._stopped = true;
            }
            return returnValue;
        };
        return RuntimeAnimation;
    }());
    BABYLON.RuntimeAnimation = RuntimeAnimation;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.runtimeAnimation.js.map

var BABYLON;
(function (BABYLON) {
    var Animatable = /** @class */ (function () {
        function Animatable(scene, target, fromFrame, toFrame, loopAnimation, speedRatio, onAnimationEnd, animations) {
            if (fromFrame === void 0) { fromFrame = 0; }
            if (toFrame === void 0) { toFrame = 100; }
            if (loopAnimation === void 0) { loopAnimation = false; }
            if (speedRatio === void 0) { speedRatio = 1.0; }
            this.target = target;
            this.fromFrame = fromFrame;
            this.toFrame = toFrame;
            this.loopAnimation = loopAnimation;
            this.onAnimationEnd = onAnimationEnd;
            this._localDelayOffset = null;
            this._pausedDelay = null;
            this._runtimeAnimations = new Array();
            this._paused = false;
            this._speedRatio = 1;
            this.animationStarted = false;
            if (animations) {
                this.appendAnimations(target, animations);
            }
            this._speedRatio = speedRatio;
            this._scene = scene;
            scene._activeAnimatables.push(this);
        }
        Object.defineProperty(Animatable.prototype, "speedRatio", {
            get: function () {
                return this._speedRatio;
            },
            set: function (value) {
                for (var index = 0; index < this._runtimeAnimations.length; index++) {
                    var animation = this._runtimeAnimations[index];
                    animation._prepareForSpeedRatioChange(value);
                }
                this._speedRatio = value;
            },
            enumerable: true,
            configurable: true
        });
        // Methods
        Animatable.prototype.getAnimations = function () {
            return this._runtimeAnimations;
        };
        Animatable.prototype.appendAnimations = function (target, animations) {
            for (var index = 0; index < animations.length; index++) {
                var animation = animations[index];
                this._runtimeAnimations.push(new BABYLON.RuntimeAnimation(target, animation));
            }
        };
        Animatable.prototype.getAnimationByTargetProperty = function (property) {
            var runtimeAnimations = this._runtimeAnimations;
            for (var index = 0; index < runtimeAnimations.length; index++) {
                if (runtimeAnimations[index].animation.targetProperty === property) {
                    return runtimeAnimations[index].animation;
                }
            }
            return null;
        };
        Animatable.prototype.getRuntimeAnimationByTargetProperty = function (property) {
            var runtimeAnimations = this._runtimeAnimations;
            for (var index = 0; index < runtimeAnimations.length; index++) {
                if (runtimeAnimations[index].animation.targetProperty === property) {
                    return runtimeAnimations[index];
                }
            }
            return null;
        };
        Animatable.prototype.reset = function () {
            var runtimeAnimations = this._runtimeAnimations;
            for (var index = 0; index < runtimeAnimations.length; index++) {
                runtimeAnimations[index].reset();
            }
            // Reset to original value
            for (index = 0; index < runtimeAnimations.length; index++) {
                var animation = runtimeAnimations[index];
                animation.animate(0, this.fromFrame, this.toFrame, false, this._speedRatio);
            }
            this._localDelayOffset = null;
            this._pausedDelay = null;
        };
        Animatable.prototype.enableBlending = function (blendingSpeed) {
            var runtimeAnimations = this._runtimeAnimations;
            for (var index = 0; index < runtimeAnimations.length; index++) {
                runtimeAnimations[index].animation.enableBlending = true;
                runtimeAnimations[index].animation.blendingSpeed = blendingSpeed;
            }
        };
        Animatable.prototype.disableBlending = function () {
            var runtimeAnimations = this._runtimeAnimations;
            for (var index = 0; index < runtimeAnimations.length; index++) {
                runtimeAnimations[index].animation.enableBlending = false;
            }
        };
        Animatable.prototype.goToFrame = function (frame) {
            var runtimeAnimations = this._runtimeAnimations;
            if (runtimeAnimations[0]) {
                var fps = runtimeAnimations[0].animation.framePerSecond;
                var currentFrame = runtimeAnimations[0].currentFrame;
                var adjustTime = frame - currentFrame;
                var delay = adjustTime * 1000 / fps;
                if (this._localDelayOffset === null) {
                    this._localDelayOffset = 0;
                }
                this._localDelayOffset -= delay;
            }
            for (var index = 0; index < runtimeAnimations.length; index++) {
                runtimeAnimations[index].goToFrame(frame);
            }
        };
        Animatable.prototype.pause = function () {
            if (this._paused) {
                return;
            }
            this._paused = true;
        };
        Animatable.prototype.restart = function () {
            this._paused = false;
        };
        Animatable.prototype.stop = function (animationName) {
            if (animationName) {
                var idx = this._scene._activeAnimatables.indexOf(this);
                if (idx > -1) {
                    var runtimeAnimations = this._runtimeAnimations;
                    for (var index = runtimeAnimations.length - 1; index >= 0; index--) {
                        if (typeof animationName === "string" && runtimeAnimations[index].animation.name != animationName) {
                            continue;
                        }
                        runtimeAnimations[index].dispose();
                        runtimeAnimations.splice(index, 1);
                    }
                    if (runtimeAnimations.length == 0) {
                        this._scene._activeAnimatables.splice(idx, 1);
                        if (this.onAnimationEnd) {
                            this.onAnimationEnd();
                        }
                    }
                }
            }
            else {
                var index = this._scene._activeAnimatables.indexOf(this);
                if (index > -1) {
                    this._scene._activeAnimatables.splice(index, 1);
                    var runtimeAnimations = this._runtimeAnimations;
                    for (var index = 0; index < runtimeAnimations.length; index++) {
                        runtimeAnimations[index].dispose();
                    }
                    if (this.onAnimationEnd) {
                        this.onAnimationEnd();
                    }
                }
            }
        };
        Animatable.prototype._animate = function (delay) {
            if (this._paused) {
                this.animationStarted = false;
                if (this._pausedDelay === null) {
                    this._pausedDelay = delay;
                }
                return true;
            }
            if (this._localDelayOffset === null) {
                this._localDelayOffset = delay;
            }
            else if (this._pausedDelay !== null) {
                this._localDelayOffset += delay - this._pausedDelay;
                this._pausedDelay = null;
            }
            // Animating
            var running = false;
            var runtimeAnimations = this._runtimeAnimations;
            var index;
            for (index = 0; index < runtimeAnimations.length; index++) {
                var animation = runtimeAnimations[index];
                var isRunning = animation.animate(delay - this._localDelayOffset, this.fromFrame, this.toFrame, this.loopAnimation, this._speedRatio);
                running = running || isRunning;
            }
            this.animationStarted = running;
            if (!running) {
                // Remove from active animatables
                index = this._scene._activeAnimatables.indexOf(this);
                this._scene._activeAnimatables.splice(index, 1);
                // Dispose all runtime animations
                for (index = 0; index < runtimeAnimations.length; index++) {
                    runtimeAnimations[index].dispose();
                }
            }
            if (!running && this.onAnimationEnd) {
                this.onAnimationEnd();
                this.onAnimationEnd = null;
            }
            return running;
        };
        return Animatable;
    }());
    BABYLON.Animatable = Animatable;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.animatable.js.map


var BABYLON;
(function (BABYLON) {
    var EasingFunction = /** @class */ (function () {
        function EasingFunction() {
            // Properties
            this._easingMode = EasingFunction.EASINGMODE_EASEIN;
        }
        Object.defineProperty(EasingFunction, "EASINGMODE_EASEIN", {
            get: function () {
                return EasingFunction._EASINGMODE_EASEIN;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EasingFunction, "EASINGMODE_EASEOUT", {
            get: function () {
                return EasingFunction._EASINGMODE_EASEOUT;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EasingFunction, "EASINGMODE_EASEINOUT", {
            get: function () {
                return EasingFunction._EASINGMODE_EASEINOUT;
            },
            enumerable: true,
            configurable: true
        });
        EasingFunction.prototype.setEasingMode = function (easingMode) {
            var n = Math.min(Math.max(easingMode, 0), 2);
            this._easingMode = n;
        };
        EasingFunction.prototype.getEasingMode = function () {
            return this._easingMode;
        };
        EasingFunction.prototype.easeInCore = function (gradient) {
            throw new Error('You must implement this method');
        };
        EasingFunction.prototype.ease = function (gradient) {
            switch (this._easingMode) {
                case EasingFunction.EASINGMODE_EASEIN:
                    return this.easeInCore(gradient);
                case EasingFunction.EASINGMODE_EASEOUT:
                    return (1 - this.easeInCore(1 - gradient));
            }
            if (gradient >= 0.5) {
                return (((1 - this.easeInCore((1 - gradient) * 2)) * 0.5) + 0.5);
            }
            return (this.easeInCore(gradient * 2) * 0.5);
        };
        //Statics
        EasingFunction._EASINGMODE_EASEIN = 0;
        EasingFunction._EASINGMODE_EASEOUT = 1;
        EasingFunction._EASINGMODE_EASEINOUT = 2;
        return EasingFunction;
    }());
    BABYLON.EasingFunction = EasingFunction;
    var CircleEase = /** @class */ (function (_super) {
        __extends(CircleEase, _super);
        function CircleEase() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        CircleEase.prototype.easeInCore = function (gradient) {
            gradient = Math.max(0, Math.min(1, gradient));
            return (1.0 - Math.sqrt(1.0 - (gradient * gradient)));
        };
        return CircleEase;
    }(EasingFunction));
    BABYLON.CircleEase = CircleEase;
    var BackEase = /** @class */ (function (_super) {
        __extends(BackEase, _super);
        function BackEase(amplitude) {
            if (amplitude === void 0) { amplitude = 1; }
            var _this = _super.call(this) || this;
            _this.amplitude = amplitude;
            return _this;
        }
        BackEase.prototype.easeInCore = function (gradient) {
            var num = Math.max(0, this.amplitude);
            return (Math.pow(gradient, 3.0) - ((gradient * num) * Math.sin(3.1415926535897931 * gradient)));
        };
        return BackEase;
    }(EasingFunction));
    BABYLON.BackEase = BackEase;
    var BounceEase = /** @class */ (function (_super) {
        __extends(BounceEase, _super);
        function BounceEase(bounces, bounciness) {
            if (bounces === void 0) { bounces = 3; }
            if (bounciness === void 0) { bounciness = 2; }
            var _this = _super.call(this) || this;
            _this.bounces = bounces;
            _this.bounciness = bounciness;
            return _this;
        }
        BounceEase.prototype.easeInCore = function (gradient) {
            var y = Math.max(0.0, this.bounces);
            var bounciness = this.bounciness;
            if (bounciness <= 1.0) {
                bounciness = 1.001;
            }
            var num9 = Math.pow(bounciness, y);
            var num5 = 1.0 - bounciness;
            var num4 = ((1.0 - num9) / num5) + (num9 * 0.5);
            var num15 = gradient * num4;
            var num65 = Math.log((-num15 * (1.0 - bounciness)) + 1.0) / Math.log(bounciness);
            var num3 = Math.floor(num65);
            var num13 = num3 + 1.0;
            var num8 = (1.0 - Math.pow(bounciness, num3)) / (num5 * num4);
            var num12 = (1.0 - Math.pow(bounciness, num13)) / (num5 * num4);
            var num7 = (num8 + num12) * 0.5;
            var num6 = gradient - num7;
            var num2 = num7 - num8;
            return (((-Math.pow(1.0 / bounciness, y - num3) / (num2 * num2)) * (num6 - num2)) * (num6 + num2));
        };
        return BounceEase;
    }(EasingFunction));
    BABYLON.BounceEase = BounceEase;
    var CubicEase = /** @class */ (function (_super) {
        __extends(CubicEase, _super);
        function CubicEase() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        CubicEase.prototype.easeInCore = function (gradient) {
            return (gradient * gradient * gradient);
        };
        return CubicEase;
    }(EasingFunction));
    BABYLON.CubicEase = CubicEase;
    var ElasticEase = /** @class */ (function (_super) {
        __extends(ElasticEase, _super);
        function ElasticEase(oscillations, springiness) {
            if (oscillations === void 0) { oscillations = 3; }
            if (springiness === void 0) { springiness = 3; }
            var _this = _super.call(this) || this;
            _this.oscillations = oscillations;
            _this.springiness = springiness;
            return _this;
        }
        ElasticEase.prototype.easeInCore = function (gradient) {
            var num2;
            var num3 = Math.max(0.0, this.oscillations);
            var num = Math.max(0.0, this.springiness);
            if (num == 0) {
                num2 = gradient;
            }
            else {
                num2 = (Math.exp(num * gradient) - 1.0) / (Math.exp(num) - 1.0);
            }
            return (num2 * Math.sin(((6.2831853071795862 * num3) + 1.5707963267948966) * gradient));
        };
        return ElasticEase;
    }(EasingFunction));
    BABYLON.ElasticEase = ElasticEase;
    var ExponentialEase = /** @class */ (function (_super) {
        __extends(ExponentialEase, _super);
        function ExponentialEase(exponent) {
            if (exponent === void 0) { exponent = 2; }
            var _this = _super.call(this) || this;
            _this.exponent = exponent;
            return _this;
        }
        ExponentialEase.prototype.easeInCore = function (gradient) {
            if (this.exponent <= 0) {
                return gradient;
            }
            return ((Math.exp(this.exponent * gradient) - 1.0) / (Math.exp(this.exponent) - 1.0));
        };
        return ExponentialEase;
    }(EasingFunction));
    BABYLON.ExponentialEase = ExponentialEase;
    var PowerEase = /** @class */ (function (_super) {
        __extends(PowerEase, _super);
        function PowerEase(power) {
            if (power === void 0) { power = 2; }
            var _this = _super.call(this) || this;
            _this.power = power;
            return _this;
        }
        PowerEase.prototype.easeInCore = function (gradient) {
            var y = Math.max(0.0, this.power);
            return Math.pow(gradient, y);
        };
        return PowerEase;
    }(EasingFunction));
    BABYLON.PowerEase = PowerEase;
    var QuadraticEase = /** @class */ (function (_super) {
        __extends(QuadraticEase, _super);
        function QuadraticEase() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        QuadraticEase.prototype.easeInCore = function (gradient) {
            return (gradient * gradient);
        };
        return QuadraticEase;
    }(EasingFunction));
    BABYLON.QuadraticEase = QuadraticEase;
    var QuarticEase = /** @class */ (function (_super) {
        __extends(QuarticEase, _super);
        function QuarticEase() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        QuarticEase.prototype.easeInCore = function (gradient) {
            return (gradient * gradient * gradient * gradient);
        };
        return QuarticEase;
    }(EasingFunction));
    BABYLON.QuarticEase = QuarticEase;
    var QuinticEase = /** @class */ (function (_super) {
        __extends(QuinticEase, _super);
        function QuinticEase() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        QuinticEase.prototype.easeInCore = function (gradient) {
            return (gradient * gradient * gradient * gradient * gradient);
        };
        return QuinticEase;
    }(EasingFunction));
    BABYLON.QuinticEase = QuinticEase;
    var SineEase = /** @class */ (function (_super) {
        __extends(SineEase, _super);
        function SineEase() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        SineEase.prototype.easeInCore = function (gradient) {
            return (1.0 - Math.sin(1.5707963267948966 * (1.0 - gradient)));
        };
        return SineEase;
    }(EasingFunction));
    BABYLON.SineEase = SineEase;
    var BezierCurveEase = /** @class */ (function (_super) {
        __extends(BezierCurveEase, _super);
        function BezierCurveEase(x1, y1, x2, y2) {
            if (x1 === void 0) { x1 = 0; }
            if (y1 === void 0) { y1 = 0; }
            if (x2 === void 0) { x2 = 1; }
            if (y2 === void 0) { y2 = 1; }
            var _this = _super.call(this) || this;
            _this.x1 = x1;
            _this.y1 = y1;
            _this.x2 = x2;
            _this.y2 = y2;
            return _this;
        }
        BezierCurveEase.prototype.easeInCore = function (gradient) {
            return BABYLON.BezierCurve.interpolate(gradient, this.x1, this.y1, this.x2, this.y2);
        };
        return BezierCurveEase;
    }(EasingFunction));
    BABYLON.BezierCurveEase = BezierCurveEase;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.easing.js.map

BABYLON.Effect.IncludesShadersStore['depthPrePass'] = "#ifdef DEPTHPREPASS\ngl_FragColor=vec4(0.,0.,0.,1.0);\nreturn;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesDeclaration'] = "#if NUM_BONE_INFLUENCERS>0\nuniform mat4 mBones[BonesPerMesh];\nattribute vec4 matricesIndices;\nattribute vec4 matricesWeights;\n#if NUM_BONE_INFLUENCERS>4\nattribute vec4 matricesIndicesExtra;\nattribute vec4 matricesWeightsExtra;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesDeclaration'] = "#ifdef INSTANCES\nattribute vec4 world0;\nattribute vec4 world1;\nattribute vec4 world2;\nattribute vec4 world3;\n#else\nuniform mat4 world;\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertexDeclaration'] = "#ifdef POINTSIZE\nuniform float pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertexDeclaration'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n#endif\n";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertexDeclaration'] = "#ifdef CLIPPLANE\nuniform vec4 vClipPlane;\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertexDeclaration'] = "#ifdef FOG\nvarying vec3 vFogDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexGlobalDeclaration'] = "#ifdef MORPHTARGETS\nuniform float morphTargetInfluences[NUM_MORPH_INFLUENCERS];\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexDeclaration'] = "#ifdef MORPHTARGETS\nattribute vec3 position{X};\n#ifdef MORPHTARGETS_NORMAL\nattribute vec3 normal{X};\n#endif\n#ifdef MORPHTARGETS_TANGENT\nattribute vec3 tangent{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthDeclaration'] = "#ifdef LOGARITHMICDEPTH\nuniform float logarithmicDepthConstant;\nvarying float vFragmentDepth;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertex'] = "#ifdef MORPHTARGETS\npositionUpdated+=(position{X}-position)*morphTargetInfluences[{X}];\n#ifdef MORPHTARGETS_NORMAL\nnormalUpdated+=(normal{X}-normal)*morphTargetInfluences[{X}];\n#endif\n#ifdef MORPHTARGETS_TANGENT\ntangentUpdated.xyz+=(tangent{X}-tangent.xyz)*morphTargetInfluences[{X}];\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesVertex'] = "#ifdef INSTANCES\nmat4 finalWorld=mat4(world0,world1,world2,world3);\n#else\nmat4 finalWorld=world;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesVertex'] = "#if NUM_BONE_INFLUENCERS>0\nmat4 influence;\ninfluence=mBones[int(matricesIndices[0])]*matricesWeights[0];\n#if NUM_BONE_INFLUENCERS>1\ninfluence+=mBones[int(matricesIndices[1])]*matricesWeights[1];\n#endif \n#if NUM_BONE_INFLUENCERS>2\ninfluence+=mBones[int(matricesIndices[2])]*matricesWeights[2];\n#endif \n#if NUM_BONE_INFLUENCERS>3\ninfluence+=mBones[int(matricesIndices[3])]*matricesWeights[3];\n#endif \n#if NUM_BONE_INFLUENCERS>4\ninfluence+=mBones[int(matricesIndicesExtra[0])]*matricesWeightsExtra[0];\n#endif \n#if NUM_BONE_INFLUENCERS>5\ninfluence+=mBones[int(matricesIndicesExtra[1])]*matricesWeightsExtra[1];\n#endif \n#if NUM_BONE_INFLUENCERS>6\ninfluence+=mBones[int(matricesIndicesExtra[2])]*matricesWeightsExtra[2];\n#endif \n#if NUM_BONE_INFLUENCERS>7\ninfluence+=mBones[int(matricesIndicesExtra[3])]*matricesWeightsExtra[3];\n#endif \nfinalWorld=finalWorld*influence;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertex'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL)\nvec3 tbnNormal=normalize(normalUpdated);\nvec3 tbnTangent=normalize(tangentUpdated.xyz);\nvec3 tbnBitangent=cross(tbnNormal,tbnTangent)*tangentUpdated.w;\nvTBN=mat3(finalWorld)*mat3(tbnTangent,tbnBitangent,tbnNormal);\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertex'] = "#ifdef CLIPPLANE\nfClipDistance=dot(worldPos,vClipPlane);\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertex'] = "#ifdef FOG\nvFogDistance=(view*worldPos).xyz;\n#endif";
BABYLON.Effect.IncludesShadersStore['shadowsVertex'] = "#ifdef SHADOWS\n#if defined(SHADOW{X}) && !defined(SHADOWCUBE{X})\nvPositionFromLight{X}=lightMatrix{X}*worldPos;\nvDepthMetric{X}=((vPositionFromLight{X}.z+light{X}.depthValues.x)/(light{X}.depthValues.y));\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertex'] = "#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthVertex'] = "#ifdef LOGARITHMICDEPTH\nvFragmentDepth=1.0+gl_Position.w;\ngl_Position.z=log2(max(0.000001,vFragmentDepth))*logarithmicDepthConstant;\n#endif";
BABYLON.Effect.IncludesShadersStore['helperFunctions'] = "const float PI=3.1415926535897932384626433832795;\nconst float LinearEncodePowerApprox=2.2;\nconst float GammaEncodePowerApprox=1.0/LinearEncodePowerApprox;\nconst vec3 LuminanceEncodeApprox=vec3(0.2126,0.7152,0.0722);\nmat3 transposeMat3(mat3 inMatrix) {\nvec3 i0=inMatrix[0];\nvec3 i1=inMatrix[1];\nvec3 i2=inMatrix[2];\nmat3 outMatrix=mat3(\nvec3(i0.x,i1.x,i2.x),\nvec3(i0.y,i1.y,i2.y),\nvec3(i0.z,i1.z,i2.z)\n);\nreturn outMatrix;\n}\n\nmat3 inverseMat3(mat3 inMatrix) {\nfloat a00=inMatrix[0][0],a01=inMatrix[0][1],a02=inMatrix[0][2];\nfloat a10=inMatrix[1][0],a11=inMatrix[1][1],a12=inMatrix[1][2];\nfloat a20=inMatrix[2][0],a21=inMatrix[2][1],a22=inMatrix[2][2];\nfloat b01=a22*a11-a12*a21;\nfloat b11=-a22*a10+a12*a20;\nfloat b21=a21*a10-a11*a20;\nfloat det=a00*b01+a01*b11+a02*b21;\nreturn mat3(b01,(-a22*a01+a02*a21),(a12*a01-a02*a11),\nb11,(a22*a00-a02*a20),(-a12*a00+a02*a10),\nb21,(-a21*a00+a01*a20),(a11*a00-a01*a10))/det;\n}\nfloat computeFallOff(float value,vec2 clipSpace,float frustumEdgeFalloff)\n{\nfloat mask=smoothstep(1.0-frustumEdgeFalloff,1.0,clamp(dot(clipSpace,clipSpace),0.,1.));\nreturn mix(value,1.0,mask);\n}\nvec3 applyEaseInOut(vec3 x){\nreturn x*x*(3.0-2.0*x);\n}\nvec3 toLinearSpace(vec3 color)\n{\nreturn pow(color,vec3(LinearEncodePowerApprox));\n}\nvec3 toGammaSpace(vec3 color)\n{\nreturn pow(color,vec3(GammaEncodePowerApprox));\n}\nfloat square(float value)\n{\nreturn value*value;\n}\nfloat getLuminance(vec3 color)\n{\nreturn clamp(dot(color,LuminanceEncodeApprox),0.,1.);\n}\n\nfloat getRand(vec2 seed) {\nreturn fract(sin(dot(seed.xy ,vec2(12.9898,78.233)))*43758.5453);\n}\nvec3 dither(vec2 seed,vec3 color) {\nfloat rand=getRand(seed);\ncolor+=mix(-0.5/255.0,0.5/255.0,rand);\ncolor=max(color,0.0);\nreturn color;\n}";
BABYLON.Effect.IncludesShadersStore['lightFragmentDeclaration'] = "#ifdef LIGHT{X}\nuniform vec4 vLightData{X};\nuniform vec4 vLightDiffuse{X};\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular{X};\n#else\nvec3 vLightSpecular{X}=vec3(0.);\n#endif\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\nuniform vec4 shadowsInfo{X};\nuniform vec2 depthValues{X};\n#endif\n#ifdef SPOTLIGHT{X}\nuniform vec4 vLightDirection{X};\n#endif\n#ifdef HEMILIGHT{X}\nuniform vec3 vLightGround{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['lightsFragmentFunctions'] = "\nstruct lightingInfo\n{\nvec3 diffuse;\n#ifdef SPECULARTERM\nvec3 specular;\n#endif\n#ifdef NDOTL\nfloat ndl;\n#endif\n};\nlightingInfo computeLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 lightVectorW;\nfloat attenuation=1.0;\nif (lightData.w == 0.)\n{\nvec3 direction=lightData.xyz-vPositionW;\nattenuation=max(0.,1.0-length(direction)/range);\nlightVectorW=normalize(direction);\n}\nelse\n{\nlightVectorW=normalize(-lightData.xyz);\n}\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nlightingInfo computeSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 direction=lightData.xyz-vPositionW;\nvec3 lightVectorW=normalize(direction);\nfloat attenuation=max(0.,1.0-length(direction)/range);\n\nfloat cosAngle=max(0.,dot(lightDirection.xyz,-lightVectorW));\nif (cosAngle>=lightDirection.w)\n{\ncosAngle=max(0.,pow(cosAngle,lightData.w));\nattenuation*=cosAngle;\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nresult.diffuse=vec3(0.);\n#ifdef SPECULARTERM\nresult.specular=vec3(0.);\n#endif\n#ifdef NDOTL\nresult.ndl=0.;\n#endif\nreturn result;\n}\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,vec3 groundColor,float glossiness) {\nlightingInfo result;\n\nfloat ndl=dot(vNormal,lightData.xyz)*0.5+0.5;\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=mix(groundColor,diffuseColor,ndl);\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightData.xyz);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor;\n#endif\nreturn result;\n}\n";
BABYLON.Effect.IncludesShadersStore['lightUboDeclaration'] = "#ifdef LIGHT{X}\nuniform Light{X}\n{\nvec4 vLightData;\nvec4 vLightDiffuse;\nvec3 vLightSpecular;\n#ifdef SPOTLIGHT{X}\nvec4 vLightDirection;\n#endif\n#ifdef HEMILIGHT{X}\nvec3 vLightGround;\n#endif\nvec4 shadowsInfo;\nvec2 depthValues;\n} light{X};\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultVertexDeclaration'] = "\nuniform mat4 viewProjection;\nuniform mat4 view;\n#ifdef DIFFUSE\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform mat4 ambientMatrix;\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY\nuniform mat4 opacityMatrix;\nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\nuniform mat4 emissiveMatrix;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\nuniform mat4 lightmapMatrix;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\nuniform mat4 specularMatrix;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform mat4 bumpMatrix;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n";
BABYLON.Effect.IncludesShadersStore['defaultFragmentDeclaration'] = "uniform vec4 vDiffuseColor;\n#ifdef SPECULARTERM\nuniform vec4 vSpecularColor;\n#endif\nuniform vec3 vEmissiveColor;\n\n#ifdef DIFFUSE\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY \nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform vec2 vTangentSpaceParams;\n#endif\n#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)\nuniform mat4 view;\n#endif\n#ifdef REFRACTION\nuniform vec4 vRefractionInfos;\n#ifndef REFRACTIONMAP_3D\nuniform mat4 refractionMatrix;\n#endif\n#ifdef REFRACTIONFRESNEL\nuniform vec4 refractionLeftColor;\nuniform vec4 refractionRightColor;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\n#endif\n#ifdef DIFFUSEFRESNEL\nuniform vec4 diffuseLeftColor;\nuniform vec4 diffuseRightColor;\n#endif\n#ifdef OPACITYFRESNEL\nuniform vec4 opacityParts;\n#endif\n#ifdef EMISSIVEFRESNEL\nuniform vec4 emissiveLeftColor;\nuniform vec4 emissiveRightColor;\n#endif\n\n#ifdef REFLECTION\nuniform vec2 vReflectionInfos;\n#ifdef REFLECTIONMAP_SKYBOX\n#else\n#if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION)\nuniform mat4 reflectionMatrix;\n#endif\n#endif\n#ifdef REFLECTIONFRESNEL\nuniform vec4 reflectionLeftColor;\nuniform vec4 reflectionRightColor;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultUboDeclaration'] = "layout(std140,column_major) uniform;\nuniform Material\n{\nvec4 diffuseLeftColor;\nvec4 diffuseRightColor;\nvec4 opacityParts;\nvec4 reflectionLeftColor;\nvec4 reflectionRightColor;\nvec4 refractionLeftColor;\nvec4 refractionRightColor;\nvec4 emissiveLeftColor; \nvec4 emissiveRightColor;\nvec2 vDiffuseInfos;\nvec2 vAmbientInfos;\nvec2 vOpacityInfos;\nvec2 vReflectionInfos;\nvec2 vEmissiveInfos;\nvec2 vLightmapInfos;\nvec2 vSpecularInfos;\nvec3 vBumpInfos;\nmat4 diffuseMatrix;\nmat4 ambientMatrix;\nmat4 opacityMatrix;\nmat4 reflectionMatrix;\nmat4 emissiveMatrix;\nmat4 lightmapMatrix;\nmat4 specularMatrix;\nmat4 bumpMatrix; \nvec4 vTangentSpaceParams;\nmat4 refractionMatrix;\nvec4 vRefractionInfos;\nvec4 vSpecularColor;\nvec3 vEmissiveColor;\nvec4 vDiffuseColor;\nfloat pointSize; \n};\nuniform Scene {\nmat4 viewProjection;\nmat4 view;\n};";
BABYLON.Effect.IncludesShadersStore['shadowsFragmentFunctions'] = "#ifdef SHADOWS\n#ifndef SHADOWFLOAT\nfloat unpack(vec4 color)\n{\nconst vec4 bit_shift=vec4(1.0/(255.0*255.0*255.0),1.0/(255.0*255.0),1.0/255.0,1.0);\nreturn dot(color,bit_shift);\n}\n#endif\nfloat computeShadowCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadow=textureCube(shadowSampler,directionToLight).x;\n#endif\nif (depth>shadow)\n{\nreturn darkness;\n}\nreturn 1.0;\n}\nfloat computeShadowWithPCFCube(vec3 lightPosition,samplerCube shadowSampler,float mapSize,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\nfloat visibility=1.;\nvec3 poissonDisk[4];\npoissonDisk[0]=vec3(-1.0,1.0,-1.0);\npoissonDisk[1]=vec3(1.0,-1.0,-1.0);\npoissonDisk[2]=vec3(-1.0,-1.0,-1.0);\npoissonDisk[3]=vec3(1.0,-1.0,1.0);\n\n#ifndef SHADOWFLOAT\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize))<depth) visibility-=0.25;\n#else\nif (textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize).x<depth) visibility-=0.25;\n#endif\nreturn min(1.0,visibility+darkness);\n}\nfloat computeShadowWithESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness); \nreturn esm;\n}\nfloat computeShadowWithCloseESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn esm;\n}\nfloat computeShadow(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadow=texture2D(shadowSampler,uv).x;\n#endif\nif (shadowPixelDepth>shadow)\n{\nreturn computeFallOff(darkness,clipSpace.xy,frustumEdgeFalloff);\n}\nreturn 1.;\n}\nfloat computeShadowWithPCF(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float mapSize,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\nfloat visibility=1.;\nvec2 poissonDisk[4];\npoissonDisk[0]=vec2(-0.94201624,-0.39906216);\npoissonDisk[1]=vec2(0.94558609,-0.76890725);\npoissonDisk[2]=vec2(-0.094184101,-0.92938870);\npoissonDisk[3]=vec2(0.34495938,0.29387760);\n\n#ifndef SHADOWFLOAT\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[0]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[1]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[2]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[3]*mapSize))<shadowPixelDepth) visibility-=0.25;\n#else\nif (texture2D(shadowSampler,uv+poissonDisk[0]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[1]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[2]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[3]*mapSize).x<shadowPixelDepth) visibility-=0.25;\n#endif\nreturn computeFallOff(min(1.0,visibility+darkness),clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithCloseESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0); \n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\n#endif\n";
BABYLON.Effect.IncludesShadersStore['fresnelFunction'] = "#ifdef FRESNEL\nfloat computeFresnelTerm(vec3 viewDirection,vec3 worldNormal,float bias,float power)\n{\nfloat fresnelTerm=pow(bias+abs(dot(viewDirection,worldNormal)),power);\nreturn clamp(fresnelTerm,0.,1.);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['reflectionFunction'] = "vec3 computeReflectionCoords(vec4 worldPos,vec3 worldNormal)\n{\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvec3 direction=normalize(vDirectionW);\nfloat t=clamp(direction.y*-0.5+0.5,0.,1.0);\nfloat s=atan(direction.z,direction.x)*RECIPROCAL_PI2+0.5;\n#ifdef REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED\nreturn vec3(1.0-s,t,0);\n#else\nreturn vec3(s,t,0);\n#endif\n#endif\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR\nvec3 cameraToVertex=normalize(worldPos.xyz-vEyePosition.xyz);\nvec3 r=reflect(cameraToVertex,worldNormal);\nfloat t=clamp(r.y*-0.5+0.5,0.,1.0);\nfloat s=atan(r.z,r.x)*RECIPROCAL_PI2+0.5;\nreturn vec3(s,t,0);\n#endif\n#ifdef REFLECTIONMAP_SPHERICAL\nvec3 viewDir=normalize(vec3(view*worldPos));\nvec3 viewNormal=normalize(vec3(view*vec4(worldNormal,0.0)));\nvec3 r=reflect(viewDir,viewNormal);\nr.z=r.z-1.0;\nfloat m=2.0*length(r);\nreturn vec3(r.x/m+0.5,1.0-r.y/m-0.5,0);\n#endif\n#ifdef REFLECTIONMAP_PLANAR\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=normalize(reflect(viewDir,worldNormal));\nreturn vec3(reflectionMatrix*vec4(coords,1));\n#endif\n#ifdef REFLECTIONMAP_CUBIC\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=reflect(viewDir,worldNormal);\n#ifdef INVERTCUBICMAP\ncoords.y=1.0-coords.y;\n#endif\nreturn vec3(reflectionMatrix*vec4(coords,0));\n#endif\n#ifdef REFLECTIONMAP_PROJECTION\nreturn vec3(reflectionMatrix*(view*worldPos));\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nreturn vPositionUVW;\n#endif\n#ifdef REFLECTIONMAP_EXPLICIT\nreturn vec3(0,0,0);\n#endif\n}";
BABYLON.Effect.IncludesShadersStore['imageProcessingDeclaration'] = "#ifdef EXPOSURE\nuniform float exposureLinear;\n#endif\n#ifdef CONTRAST\nuniform float contrast;\n#endif\n#ifdef VIGNETTE\nuniform vec2 vInverseScreenSize;\nuniform vec4 vignetteSettings1;\nuniform vec4 vignetteSettings2;\n#endif\n#ifdef COLORCURVES\nuniform vec4 vCameraColorCurveNegative;\nuniform vec4 vCameraColorCurveNeutral;\nuniform vec4 vCameraColorCurvePositive;\n#endif\n#ifdef COLORGRADING\n#ifdef COLORGRADING3D\nuniform highp sampler3D txColorTransform;\n#else\nuniform sampler2D txColorTransform;\n#endif\nuniform vec4 colorTransformSettings;\n#endif";
BABYLON.Effect.IncludesShadersStore['imageProcessingFunctions'] = "#if defined(COLORGRADING) && !defined(COLORGRADING3D)\n\nvec3 sampleTexture3D(sampler2D colorTransform,vec3 color,vec2 sampler3dSetting)\n{\nfloat sliceSize=2.0*sampler3dSetting.x; \n#ifdef SAMPLER3DGREENDEPTH\nfloat sliceContinuous=(color.g-sampler3dSetting.x)*sampler3dSetting.y;\n#else\nfloat sliceContinuous=(color.b-sampler3dSetting.x)*sampler3dSetting.y;\n#endif\nfloat sliceInteger=floor(sliceContinuous);\n\n\nfloat sliceFraction=sliceContinuous-sliceInteger;\n#ifdef SAMPLER3DGREENDEPTH\nvec2 sliceUV=color.rb;\n#else\nvec2 sliceUV=color.rg;\n#endif\nsliceUV.x*=sliceSize;\nsliceUV.x+=sliceInteger*sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice0Color=texture2D(colorTransform,sliceUV);\nsliceUV.x+=sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice1Color=texture2D(colorTransform,sliceUV);\nvec3 result=mix(slice0Color.rgb,slice1Color.rgb,sliceFraction);\n#ifdef SAMPLER3DBGRMAP\ncolor.rgb=result.rgb;\n#else\ncolor.rgb=result.bgr;\n#endif\nreturn color;\n}\n#endif\nvec4 applyImageProcessing(vec4 result) {\n#ifdef EXPOSURE\nresult.rgb*=exposureLinear;\n#endif\n#ifdef VIGNETTE\n\nvec2 viewportXY=gl_FragCoord.xy*vInverseScreenSize;\nviewportXY=viewportXY*2.0-1.0;\nvec3 vignetteXY1=vec3(viewportXY*vignetteSettings1.xy+vignetteSettings1.zw,1.0);\nfloat vignetteTerm=dot(vignetteXY1,vignetteXY1);\nfloat vignette=pow(vignetteTerm,vignetteSettings2.w);\n\nvec3 vignetteColor=vignetteSettings2.rgb;\n#ifdef VIGNETTEBLENDMODEMULTIPLY\nvec3 vignetteColorMultiplier=mix(vignetteColor,vec3(1,1,1),vignette);\nresult.rgb*=vignetteColorMultiplier;\n#endif\n#ifdef VIGNETTEBLENDMODEOPAQUE\nresult.rgb=mix(vignetteColor,result.rgb,vignette);\n#endif\n#endif\n#ifdef TONEMAPPING\nconst float tonemappingCalibration=1.590579;\nresult.rgb=1.0-exp2(-tonemappingCalibration*result.rgb);\n#endif\n\nresult.rgb=toGammaSpace(result.rgb);\nresult.rgb=clamp(result.rgb,0.0,1.0);\n#ifdef CONTRAST\n\nvec3 resultHighContrast=applyEaseInOut(result.rgb);\nif (contrast<1.0) {\n\nresult.rgb=mix(vec3(0.5,0.5,0.5),result.rgb,contrast);\n} else {\n\nresult.rgb=mix(result.rgb,resultHighContrast,contrast-1.0);\n}\n#endif\n\n#ifdef COLORGRADING\nvec3 colorTransformInput=result.rgb*colorTransformSettings.xxx+colorTransformSettings.yyy;\n#ifdef COLORGRADING3D\nvec3 colorTransformOutput=texture(txColorTransform,colorTransformInput).rgb;\n#else\nvec3 colorTransformOutput=sampleTexture3D(txColorTransform,colorTransformInput,colorTransformSettings.yz).rgb;\n#endif\nresult.rgb=mix(result.rgb,colorTransformOutput,colorTransformSettings.www);\n#endif\n#ifdef COLORCURVES\n\nfloat luma=getLuminance(result.rgb);\nvec2 curveMix=clamp(vec2(luma*3.0-1.5,luma*-3.0+1.5),vec2(0.0),vec2(1.0));\nvec4 colorCurve=vCameraColorCurveNeutral+curveMix.x*vCameraColorCurvePositive-curveMix.y*vCameraColorCurveNegative;\nresult.rgb*=colorCurve.rgb;\nresult.rgb=mix(vec3(luma),result.rgb,colorCurve.a);\n#endif\nreturn result;\n}";
BABYLON.Effect.IncludesShadersStore['bumpFragmentFunctions'] = "#ifdef BUMP\n#if BUMPDIRECTUV == 1\n#define vBumpUV vMainUV1\n#elif BUMPDIRECTUV == 2\n#define vBumpUV vMainUV2\n#else\nvarying vec2 vBumpUV;\n#endif\nuniform sampler2D bumpSampler;\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n\nmat3 cotangent_frame(vec3 normal,vec3 p,vec2 uv)\n{\n\nuv=gl_FrontFacing ? uv : -uv;\n\nvec3 dp1=dFdx(p);\nvec3 dp2=dFdy(p);\nvec2 duv1=dFdx(uv);\nvec2 duv2=dFdy(uv);\n\nvec3 dp2perp=cross(dp2,normal);\nvec3 dp1perp=cross(normal,dp1);\nvec3 tangent=dp2perp*duv1.x+dp1perp*duv2.x;\nvec3 bitangent=dp2perp*duv1.y+dp1perp*duv2.y;\n\ntangent*=vTangentSpaceParams.x;\nbitangent*=vTangentSpaceParams.y;\n\nfloat invmax=inversesqrt(max(dot(tangent,tangent),dot(bitangent,bitangent)));\nreturn mat3(tangent*invmax,bitangent*invmax,normal);\n}\nvec3 perturbNormal(mat3 cotangentFrame,vec2 uv)\n{\nvec3 map=texture2D(bumpSampler,uv).xyz;\nmap=map*2.0-1.0;\n#ifdef NORMALXYSCALE\nmap=normalize(map*vec3(vBumpInfos.y,vBumpInfos.y,1.0));\n#endif\nreturn normalize(cotangentFrame*map);\n}\n#ifdef PARALLAX\nconst float minSamples=4.;\nconst float maxSamples=15.;\nconst int iMaxSamples=15;\n\nvec2 parallaxOcclusion(vec3 vViewDirCoT,vec3 vNormalCoT,vec2 texCoord,float parallaxScale) {\nfloat parallaxLimit=length(vViewDirCoT.xy)/vViewDirCoT.z;\nparallaxLimit*=parallaxScale;\nvec2 vOffsetDir=normalize(vViewDirCoT.xy);\nvec2 vMaxOffset=vOffsetDir*parallaxLimit;\nfloat numSamples=maxSamples+(dot(vViewDirCoT,vNormalCoT)*(minSamples-maxSamples));\nfloat stepSize=1.0/numSamples;\n\nfloat currRayHeight=1.0;\nvec2 vCurrOffset=vec2(0,0);\nvec2 vLastOffset=vec2(0,0);\nfloat lastSampledHeight=1.0;\nfloat currSampledHeight=1.0;\nfor (int i=0; i<iMaxSamples; i++)\n{\ncurrSampledHeight=texture2D(bumpSampler,vBumpUV+vCurrOffset).w;\n\nif (currSampledHeight>currRayHeight)\n{\nfloat delta1=currSampledHeight-currRayHeight;\nfloat delta2=(currRayHeight+stepSize)-lastSampledHeight;\nfloat ratio=delta1/(delta1+delta2);\nvCurrOffset=(ratio)* vLastOffset+(1.0-ratio)*vCurrOffset;\n\nbreak;\n}\nelse\n{\ncurrRayHeight-=stepSize;\nvLastOffset=vCurrOffset;\nvCurrOffset+=stepSize*vMaxOffset;\nlastSampledHeight=currSampledHeight;\n}\n}\nreturn vCurrOffset;\n}\nvec2 parallaxOffset(vec3 viewDir,float heightScale)\n{\n\nfloat height=texture2D(bumpSampler,vBumpUV).w;\nvec2 texCoordOffset=heightScale*viewDir.xy*height;\nreturn -texCoordOffset;\n}\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragmentDeclaration'] = "#ifdef CLIPPLANE\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragmentDeclaration'] = "#ifdef FOG\n#define FOGMODE_NONE 0.\n#define FOGMODE_EXP 1.\n#define FOGMODE_EXP2 2.\n#define FOGMODE_LINEAR 3.\n#define E 2.71828\nuniform vec4 vFogInfos;\nuniform vec3 vFogColor;\nvarying vec3 vFogDistance;\nfloat CalcFogFactor()\n{\nfloat fogCoeff=1.0;\nfloat fogStart=vFogInfos.y;\nfloat fogEnd=vFogInfos.z;\nfloat fogDensity=vFogInfos.w;\nfloat fogDistance=length(vFogDistance);\nif (FOGMODE_LINEAR == vFogInfos.x)\n{\nfogCoeff=(fogEnd-fogDistance)/(fogEnd-fogStart);\n}\nelse if (FOGMODE_EXP == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDensity);\n}\nelse if (FOGMODE_EXP2 == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDistance*fogDensity*fogDensity);\n}\nreturn clamp(fogCoeff,0.0,1.0);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragment'] = "#ifdef CLIPPLANE\nif (fClipDistance>0.0)\n{\ndiscard;\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpFragment'] = "vec2 uvOffset=vec2(0.0,0.0);\n#if defined(BUMP) || defined(PARALLAX)\n#ifdef NORMALXYSCALE\nfloat normalScale=1.0;\n#else \nfloat normalScale=vBumpInfos.y;\n#endif\n#if defined(TANGENT) && defined(NORMAL)\nmat3 TBN=vTBN;\n#else\nmat3 TBN=cotangent_frame(normalW*normalScale,vPositionW,vBumpUV);\n#endif\n#endif\n#ifdef PARALLAX\nmat3 invTBN=transposeMat3(TBN);\n#ifdef PARALLAXOCCLUSION\nuvOffset=parallaxOcclusion(invTBN*-viewDirectionW,invTBN*normalW,vBumpUV,vBumpInfos.z);\n#else\nuvOffset=parallaxOffset(invTBN*viewDirectionW,vBumpInfos.z);\n#endif\n#endif\n#ifdef BUMP\nnormalW=perturbNormal(TBN,vBumpUV+uvOffset);\n#endif";
BABYLON.Effect.IncludesShadersStore['lightFragment'] = "#ifdef LIGHT{X}\n#if defined(SHADOWONLY) || (defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X}))\n\n#else\n#ifdef PBR\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#else\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,glossiness);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#endif\n#endif\n#ifdef SHADOW{X}\n#ifdef SHADOWCLOSEESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithCloseESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithCloseESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else\n#ifdef SHADOWESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else \n#ifdef SHADOWPCF{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithPCFCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadowWithPCF(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#else\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadow(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#endif\n#endif\n#endif\n#ifdef SHADOWONLY\n#ifndef SHADOWINUSE\n#define SHADOWINUSE\n#endif\nglobalShadow+=shadow;\nshadowLightCount+=1.0;\n#endif\n#else\nshadow=1.;\n#endif\n#ifndef SHADOWONLY\n#ifdef CUSTOMUSERLIGHTING\ndiffuseBase+=computeCustomDiffuseLighting(info,diffuseBase,shadow);\n#ifdef SPECULARTERM\nspecularBase+=computeCustomSpecularLighting(info,specularBase,shadow);\n#endif\n#elif defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X})\ndiffuseBase+=lightmapColor*shadow;\n#ifdef SPECULARTERM\n#ifndef LIGHTMAPNOSPECULAR{X}\nspecularBase+=info.specular*shadow*lightmapColor;\n#endif\n#endif\n#else\ndiffuseBase+=info.diffuse*shadow;\n#ifdef SPECULARTERM\nspecularBase+=info.specular*shadow;\n#endif\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthFragment'] = "#ifdef LOGARITHMICDEPTH\ngl_FragDepthEXT=log2(vFragmentDepth)*logarithmicDepthConstant*0.5;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragment'] = "#ifdef FOG\nfloat fog=CalcFogFactor();\ncolor.rgb=fog*color.rgb+(1.0-fog)*vFogColor;\n#endif";
var AnimationRange = BABYLON.AnimationRange;
var AnimationEvent = BABYLON.AnimationEvent;
var PathCursor = BABYLON.PathCursor;
var Animation = BABYLON.Animation;
var TargetedAnimation = BABYLON.TargetedAnimation;
var AnimationGroup = BABYLON.AnimationGroup;
var RuntimeAnimation = BABYLON.RuntimeAnimation;
var Animatable = BABYLON.Animatable;
var EasingFunction = BABYLON.EasingFunction;
var CircleEase = BABYLON.CircleEase;
var BackEase = BABYLON.BackEase;
var BounceEase = BABYLON.BounceEase;
var CubicEase = BABYLON.CubicEase;
var ElasticEase = BABYLON.ElasticEase;
var ExponentialEase = BABYLON.ExponentialEase;
var PowerEase = BABYLON.PowerEase;
var QuadraticEase = BABYLON.QuadraticEase;
var QuarticEase = BABYLON.QuarticEase;
var QuinticEase = BABYLON.QuinticEase;
var SineEase = BABYLON.SineEase;
var BezierCurveEase = BABYLON.BezierCurveEase;

export { AnimationRange,AnimationEvent,PathCursor,Animation,TargetedAnimation,AnimationGroup,RuntimeAnimation,Animatable,EasingFunction,CircleEase,BackEase,BounceEase,CubicEase,ElasticEase,ExponentialEase,PowerEase,QuadraticEase,QuarticEase,QuinticEase,SineEase,BezierCurveEase };