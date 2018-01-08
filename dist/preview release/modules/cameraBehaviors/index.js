

if(typeof require !== 'undefined'){
    var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
    var BABYLON = globalObject["BABYLON"] || {}; 
var BABYLON0 = require('babylonjs/core');
if(BABYLON !== BABYLON0) __extends(BABYLON, BABYLON0);
var BABYLON;
(function (BABYLON) {
    var FramingBehavior = /** @class */ (function () {
        function FramingBehavior() {
            this._mode = FramingBehavior.FitFrustumSidesMode;
            this._radiusScale = 1.0;
            this._positionScale = 0.5;
            this._defaultElevation = 0.3;
            this._elevationReturnTime = 1500;
            this._elevationReturnWaitTime = 1000;
            this._zoomStopsAnimation = false;
            this._framingTime = 1500;
            this._isPointerDown = false;
            this._lastInteractionTime = -Infinity;
            // Framing control
            this._animatables = new Array();
            this._betaIsAnimating = false;
        }
        Object.defineProperty(FramingBehavior.prototype, "name", {
            get: function () {
                return "Framing";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FramingBehavior.prototype, "mode", {
            /**
             * Gets current mode used by the behavior.
             */
            get: function () {
                return this._mode;
            },
            /**
             * Sets the current mode used by the behavior
             */
            set: function (mode) {
                this._mode = mode;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FramingBehavior.prototype, "radiusScale", {
            /**
             * Gets the scale applied to the radius
             */
            get: function () {
                return this._radiusScale;
            },
            /**
             * Sets the scale applied to the radius (1 by default)
             */
            set: function (radius) {
                this._radiusScale = radius;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FramingBehavior.prototype, "positionScale", {
            /**
             * Gets the scale to apply on Y axis to position camera focus. 0.5 by default which means the center of the bounding box.
             */
            get: function () {
                return this._positionScale;
            },
            /**
             * Sets the scale to apply on Y axis to position camera focus. 0.5 by default which means the center of the bounding box.
             */
            set: function (scale) {
                this._positionScale = scale;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FramingBehavior.prototype, "defaultElevation", {
            /**
            * Gets the angle above/below the horizontal plane to return to when the return to default elevation idle
            * behaviour is triggered, in radians.
            */
            get: function () {
                return this._defaultElevation;
            },
            /**
            * Sets the angle above/below the horizontal plane to return to when the return to default elevation idle
            * behaviour is triggered, in radians.
            */
            set: function (elevation) {
                this._defaultElevation = elevation;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FramingBehavior.prototype, "elevationReturnTime", {
            /**
             * Gets the time (in milliseconds) taken to return to the default beta position.
             * Negative value indicates camera should not return to default.
             */
            get: function () {
                return this._elevationReturnTime;
            },
            /**
             * Sets the time (in milliseconds) taken to return to the default beta position.
             * Negative value indicates camera should not return to default.
             */
            set: function (speed) {
                this._elevationReturnTime = speed;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FramingBehavior.prototype, "elevationReturnWaitTime", {
            /**
             * Gets the delay (in milliseconds) taken before the camera returns to the default beta position.
             */
            get: function () {
                return this._elevationReturnWaitTime;
            },
            /**
             * Sets the delay (in milliseconds) taken before the camera returns to the default beta position.
             */
            set: function (time) {
                this._elevationReturnWaitTime = time;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FramingBehavior.prototype, "zoomStopsAnimation", {
            /**
            * Gets the flag that indicates if user zooming should stop animation.
            */
            get: function () {
                return this._zoomStopsAnimation;
            },
            /**
            * Sets the flag that indicates if user zooming should stop animation.
            */
            set: function (flag) {
                this._zoomStopsAnimation = flag;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FramingBehavior.prototype, "framingTime", {
            /**
             * Gets the transition time when framing the mesh, in milliseconds
            */
            get: function () {
                return this._framingTime;
            },
            /**
             * Sets the transition time when framing the mesh, in milliseconds
            */
            set: function (time) {
                this._framingTime = time;
            },
            enumerable: true,
            configurable: true
        });
        FramingBehavior.prototype.init = function () {
            // Do notihng
        };
        FramingBehavior.prototype.attach = function (camera) {
            var _this = this;
            this._attachedCamera = camera;
            var scene = this._attachedCamera.getScene();
            FramingBehavior.EasingFunction.setEasingMode(FramingBehavior.EasingMode);
            this._onPrePointerObservableObserver = scene.onPrePointerObservable.add(function (pointerInfoPre) {
                if (pointerInfoPre.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                    _this._isPointerDown = true;
                    return;
                }
                if (pointerInfoPre.type === BABYLON.PointerEventTypes.POINTERUP) {
                    _this._isPointerDown = false;
                }
            });
            this._onMeshTargetChangedObserver = camera.onMeshTargetChangedObservable.add(function (mesh) {
                if (mesh) {
                    _this.zoomOnMesh(mesh);
                }
            });
            this._onAfterCheckInputsObserver = camera.onAfterCheckInputsObservable.add(function () {
                // Stop the animation if there is user interaction and the animation should stop for this interaction
                _this._applyUserInteraction();
                // Maintain the camera above the ground. If the user pulls the camera beneath the ground plane, lift it
                // back to the default position after a given timeout
                _this._maintainCameraAboveGround();
            });
        };
        FramingBehavior.prototype.detach = function () {
            if (!this._attachedCamera) {
                return;
            }
            var scene = this._attachedCamera.getScene();
            if (this._onPrePointerObservableObserver) {
                scene.onPrePointerObservable.remove(this._onPrePointerObservableObserver);
            }
            if (this._onAfterCheckInputsObserver) {
                this._attachedCamera.onAfterCheckInputsObservable.remove(this._onAfterCheckInputsObserver);
            }
            if (this._onMeshTargetChangedObserver) {
                this._attachedCamera.onMeshTargetChangedObservable.remove(this._onMeshTargetChangedObserver);
            }
            this._attachedCamera = null;
        };
        /**
         * Targets the given mesh and updates zoom level accordingly.
         * @param mesh  The mesh to target.
         * @param radius Optional. If a cached radius position already exists, overrides default.
         * @param framingPositionY Position on mesh to center camera focus where 0 corresponds bottom of its bounding box and 1, the top
         * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
         * @param onAnimationEnd Callback triggered at the end of the framing animation
         */
        FramingBehavior.prototype.zoomOnMesh = function (mesh, focusOnOriginXZ, onAnimationEnd) {
            if (focusOnOriginXZ === void 0) { focusOnOriginXZ = false; }
            if (onAnimationEnd === void 0) { onAnimationEnd = null; }
            mesh.computeWorldMatrix(true);
            var boundingBox = mesh.getBoundingInfo().boundingBox;
            this.zoomOnBoundingInfo(boundingBox.minimumWorld, boundingBox.maximumWorld, focusOnOriginXZ, onAnimationEnd);
        };
        /**
         * Targets the given mesh with its children and updates zoom level accordingly.
         * @param mesh  The mesh to target.
         * @param radius Optional. If a cached radius position already exists, overrides default.
         * @param framingPositionY Position on mesh to center camera focus where 0 corresponds bottom of its bounding box and 1, the top
         * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
         * @param onAnimationEnd Callback triggered at the end of the framing animation
         */
        FramingBehavior.prototype.zoomOnMeshHierarchy = function (mesh, focusOnOriginXZ, onAnimationEnd) {
            if (focusOnOriginXZ === void 0) { focusOnOriginXZ = false; }
            if (onAnimationEnd === void 0) { onAnimationEnd = null; }
            mesh.computeWorldMatrix(true);
            var boundingBox = mesh.getHierarchyBoundingVectors(true);
            this.zoomOnBoundingInfo(boundingBox.min, boundingBox.max, focusOnOriginXZ, onAnimationEnd);
        };
        /**
         * Targets the given meshes with their children and updates zoom level accordingly.
         * @param meshes  The mesh to target.
         * @param radius Optional. If a cached radius position already exists, overrides default.
         * @param framingPositionY Position on mesh to center camera focus where 0 corresponds bottom of its bounding box and 1, the top
         * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
         * @param onAnimationEnd Callback triggered at the end of the framing animation
         */
        FramingBehavior.prototype.zoomOnMeshesHierarchy = function (meshes, focusOnOriginXZ, onAnimationEnd) {
            if (focusOnOriginXZ === void 0) { focusOnOriginXZ = false; }
            if (onAnimationEnd === void 0) { onAnimationEnd = null; }
            var min = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            var max = new BABYLON.Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
            for (var i = 0; i < meshes.length; i++) {
                var boundingInfo = meshes[i].getHierarchyBoundingVectors(true);
                BABYLON.Tools.CheckExtends(boundingInfo.min, min, max);
                BABYLON.Tools.CheckExtends(boundingInfo.max, min, max);
            }
            this.zoomOnBoundingInfo(min, max, focusOnOriginXZ, onAnimationEnd);
        };
        /**
         * Targets the given mesh and updates zoom level accordingly.
         * @param mesh  The mesh to target.
         * @param radius Optional. If a cached radius position already exists, overrides default.
         * @param framingPositionY Position on mesh to center camera focus where 0 corresponds bottom of its bounding box and 1, the top
         * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
         * @param onAnimationEnd Callback triggered at the end of the framing animation
         */
        FramingBehavior.prototype.zoomOnBoundingInfo = function (minimumWorld, maximumWorld, focusOnOriginXZ, onAnimationEnd) {
            var _this = this;
            if (focusOnOriginXZ === void 0) { focusOnOriginXZ = false; }
            if (onAnimationEnd === void 0) { onAnimationEnd = null; }
            var zoomTarget;
            if (!this._attachedCamera) {
                return;
            }
            // Find target by interpolating from bottom of bounding box in world-space to top via framingPositionY
            var bottom = minimumWorld.y;
            var top = maximumWorld.y;
            var zoomTargetY = bottom + (top - bottom) * this._positionScale;
            var radiusWorld = maximumWorld.subtract(minimumWorld).scale(0.5);
            if (focusOnOriginXZ) {
                zoomTarget = new BABYLON.Vector3(0, zoomTargetY, 0);
            }
            else {
                var centerWorld = minimumWorld.add(radiusWorld);
                zoomTarget = new BABYLON.Vector3(centerWorld.x, zoomTargetY, centerWorld.z);
            }
            if (!this._vectorTransition) {
                this._vectorTransition = BABYLON.Animation.CreateAnimation("target", BABYLON.Animation.ANIMATIONTYPE_VECTOR3, 60, FramingBehavior.EasingFunction);
            }
            this._betaIsAnimating = true;
            var animatable = BABYLON.Animation.TransitionTo("target", zoomTarget, this._attachedCamera, this._attachedCamera.getScene(), 60, this._vectorTransition, this._framingTime);
            if (animatable) {
                this._animatables.push(animatable);
            }
            // sets the radius and lower radius bounds
            // Small delta ensures camera is not always at lower zoom limit.
            var radius = 0;
            if (this._mode === FramingBehavior.FitFrustumSidesMode) {
                var position = this._calculateLowerRadiusFromModelBoundingSphere(minimumWorld, maximumWorld);
                this._attachedCamera.lowerRadiusLimit = radiusWorld.length() + this._attachedCamera.minZ;
                radius = position;
            }
            else if (this._mode === FramingBehavior.IgnoreBoundsSizeMode) {
                radius = this._calculateLowerRadiusFromModelBoundingSphere(minimumWorld, maximumWorld);
                if (this._attachedCamera.lowerRadiusLimit === null) {
                    this._attachedCamera.lowerRadiusLimit = this._attachedCamera.minZ;
                }
            }
            // Set sensibilities
            var extend = maximumWorld.subtract(minimumWorld).length();
            this._attachedCamera.panningSensibility = 5000 / extend;
            this._attachedCamera.wheelPrecision = 100 / radius;
            // transition to new radius
            if (!this._radiusTransition) {
                this._radiusTransition = BABYLON.Animation.CreateAnimation("radius", BABYLON.Animation.ANIMATIONTYPE_FLOAT, 60, FramingBehavior.EasingFunction);
            }
            animatable = BABYLON.Animation.TransitionTo("radius", radius, this._attachedCamera, this._attachedCamera.getScene(), 60, this._radiusTransition, this._framingTime, function () {
                if (onAnimationEnd) {
                    onAnimationEnd();
                }
                if (_this._attachedCamera) {
                    _this._attachedCamera.storeState();
                }
            });
            if (animatable) {
                this._animatables.push(animatable);
            }
        };
        /**
         * Calculates the lowest radius for the camera based on the bounding box of the mesh.
         * @param mesh The mesh on which to base the calculation. mesh boundingInfo used to estimate necessary
         *			  frustum width.
         * @return The minimum distance from the primary mesh's center point at which the camera must be kept in order
         *		 to fully enclose the mesh in the viewing frustum.
         */
        FramingBehavior.prototype._calculateLowerRadiusFromModelBoundingSphere = function (minimumWorld, maximumWorld) {
            var size = maximumWorld.subtract(minimumWorld);
            var boxVectorGlobalDiagonal = size.length();
            var frustumSlope = this._getFrustumSlope();
            // Formula for setting distance
            // (Good explanation: http://stackoverflow.com/questions/2866350/move-camera-to-fit-3d-scene)
            var radiusWithoutFraming = boxVectorGlobalDiagonal * 0.5;
            // Horizon distance
            var radius = radiusWithoutFraming * this._radiusScale;
            var distanceForHorizontalFrustum = radius * Math.sqrt(1.0 + 1.0 / (frustumSlope.x * frustumSlope.x));
            var distanceForVerticalFrustum = radius * Math.sqrt(1.0 + 1.0 / (frustumSlope.y * frustumSlope.y));
            var distance = Math.max(distanceForHorizontalFrustum, distanceForVerticalFrustum);
            var camera = this._attachedCamera;
            if (!camera) {
                return 0;
            }
            if (camera.lowerRadiusLimit && this._mode === FramingBehavior.IgnoreBoundsSizeMode) {
                // Don't exceed the requested limit
                distance = distance < camera.lowerRadiusLimit ? camera.lowerRadiusLimit : distance;
            }
            // Don't exceed the upper radius limit
            if (camera.upperRadiusLimit) {
                distance = distance > camera.upperRadiusLimit ? camera.upperRadiusLimit : distance;
            }
            return distance;
        };
        /**
         * Keeps the camera above the ground plane. If the user pulls the camera below the ground plane, the camera
         * is automatically returned to its default position (expected to be above ground plane).
         */
        FramingBehavior.prototype._maintainCameraAboveGround = function () {
            var _this = this;
            if (this._elevationReturnTime < 0) {
                return;
            }
            var timeSinceInteraction = BABYLON.Tools.Now - this._lastInteractionTime;
            var defaultBeta = Math.PI * 0.5 - this._defaultElevation;
            var limitBeta = Math.PI * 0.5;
            // Bring the camera back up if below the ground plane
            if (this._attachedCamera && !this._betaIsAnimating && this._attachedCamera.beta > limitBeta && timeSinceInteraction >= this._elevationReturnWaitTime) {
                this._betaIsAnimating = true;
                //Transition to new position
                this.stopAllAnimations();
                if (!this._betaTransition) {
                    this._betaTransition = BABYLON.Animation.CreateAnimation("beta", BABYLON.Animation.ANIMATIONTYPE_FLOAT, 60, FramingBehavior.EasingFunction);
                }
                var animatabe = BABYLON.Animation.TransitionTo("beta", defaultBeta, this._attachedCamera, this._attachedCamera.getScene(), 60, this._betaTransition, this._elevationReturnTime, function () {
                    _this._clearAnimationLocks();
                    _this.stopAllAnimations();
                });
                if (animatabe) {
                    this._animatables.push(animatabe);
                }
            }
        };
        /**
         * Returns the frustum slope based on the canvas ratio and camera FOV
         * @returns The frustum slope represented as a Vector2 with X and Y slopes
         */
        FramingBehavior.prototype._getFrustumSlope = function () {
            // Calculate the viewport ratio
            // Aspect Ratio is Height/Width.
            var camera = this._attachedCamera;
            if (!camera) {
                return BABYLON.Vector2.Zero();
            }
            var engine = camera.getScene().getEngine();
            var aspectRatio = engine.getAspectRatio(camera);
            // Camera FOV is the vertical field of view (top-bottom) in radians.
            // Slope of the frustum top/bottom planes in view space, relative to the forward vector.
            var frustumSlopeY = Math.tan(camera.fov / 2);
            // Slope of the frustum left/right planes in view space, relative to the forward vector.
            // Provides the amount that one side (e.g. left) of the frustum gets wider for every unit
            // along the forward vector.
            var frustumSlopeX = frustumSlopeY * aspectRatio;
            return new BABYLON.Vector2(frustumSlopeX, frustumSlopeY);
        };
        /**
         * Removes all animation locks. Allows new animations to be added to any of the arcCamera properties.
         */
        FramingBehavior.prototype._clearAnimationLocks = function () {
            this._betaIsAnimating = false;
        };
        /**
         *  Applies any current user interaction to the camera. Takes into account maximum alpha rotation.
         */
        FramingBehavior.prototype._applyUserInteraction = function () {
            if (this.isUserIsMoving) {
                this._lastInteractionTime = BABYLON.Tools.Now;
                this.stopAllAnimations();
                this._clearAnimationLocks();
            }
        };
        /**
         * Stops and removes all animations that have been applied to the camera
         */
        FramingBehavior.prototype.stopAllAnimations = function () {
            if (this._attachedCamera) {
                this._attachedCamera.animations = [];
            }
            while (this._animatables.length) {
                if (this._animatables[0]) {
                    this._animatables[0].onAnimationEnd = null;
                    this._animatables[0].stop();
                }
                this._animatables.shift();
            }
        };
        Object.defineProperty(FramingBehavior.prototype, "isUserIsMoving", {
            /**
             * Gets a value indicating if the user is moving the camera
             */
            get: function () {
                if (!this._attachedCamera) {
                    return false;
                }
                return this._attachedCamera.inertialAlphaOffset !== 0 ||
                    this._attachedCamera.inertialBetaOffset !== 0 ||
                    this._attachedCamera.inertialRadiusOffset !== 0 ||
                    this._attachedCamera.inertialPanningX !== 0 ||
                    this._attachedCamera.inertialPanningY !== 0 ||
                    this._isPointerDown;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * The easing function used by animations
         */
        FramingBehavior.EasingFunction = new BABYLON.ExponentialEase();
        /**
         * The easing mode used by animations
         */
        FramingBehavior.EasingMode = BABYLON.EasingFunction.EASINGMODE_EASEINOUT;
        // Statics
        /**
         * The camera can move all the way towards the mesh.
         */
        FramingBehavior.IgnoreBoundsSizeMode = 0;
        /**
         * The camera is not allowed to zoom closer to the mesh than the point at which the adjusted bounding sphere touches the frustum sides
         */
        FramingBehavior.FitFrustumSidesMode = 1;
        return FramingBehavior;
    }());
    BABYLON.FramingBehavior = FramingBehavior;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.framingBehavior.js.map

var BABYLON;
(function (BABYLON) {
    /**
     * Add a bouncing effect to an ArcRotateCamera when reaching a specified minimum and maximum radius
     */
    var BouncingBehavior = /** @class */ (function () {
        function BouncingBehavior() {
            /**
             * The duration of the animation, in milliseconds
             */
            this.transitionDuration = 450;
            /**
             * Length of the distance animated by the transition when lower radius is reached
             */
            this.lowerRadiusTransitionRange = 2;
            /**
             * Length of the distance animated by the transition when upper radius is reached
             */
            this.upperRadiusTransitionRange = -2;
            this._autoTransitionRange = false;
            // Animations
            this._radiusIsAnimating = false;
            this._radiusBounceTransition = null;
            this._animatables = new Array();
        }
        Object.defineProperty(BouncingBehavior.prototype, "name", {
            get: function () {
                return "Bouncing";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BouncingBehavior.prototype, "autoTransitionRange", {
            /**
             * Gets a value indicating if the lowerRadiusTransitionRange and upperRadiusTransitionRange are defined automatically
             */
            get: function () {
                return this._autoTransitionRange;
            },
            /**
             * Sets a value indicating if the lowerRadiusTransitionRange and upperRadiusTransitionRange are defined automatically
             * Transition ranges will be set to 5% of the bounding box diagonal in world space
             */
            set: function (value) {
                var _this = this;
                if (this._autoTransitionRange === value) {
                    return;
                }
                this._autoTransitionRange = value;
                var camera = this._attachedCamera;
                if (!camera) {
                    return;
                }
                if (value) {
                    this._onMeshTargetChangedObserver = camera.onMeshTargetChangedObservable.add(function (mesh) {
                        if (!mesh) {
                            return;
                        }
                        mesh.computeWorldMatrix(true);
                        var diagonal = mesh.getBoundingInfo().diagonalLength;
                        _this.lowerRadiusTransitionRange = diagonal * 0.05;
                        _this.upperRadiusTransitionRange = diagonal * 0.05;
                    });
                }
                else if (this._onMeshTargetChangedObserver) {
                    camera.onMeshTargetChangedObservable.remove(this._onMeshTargetChangedObserver);
                }
            },
            enumerable: true,
            configurable: true
        });
        BouncingBehavior.prototype.init = function () {
            // Do notihng
        };
        BouncingBehavior.prototype.attach = function (camera) {
            var _this = this;
            this._attachedCamera = camera;
            this._onAfterCheckInputsObserver = camera.onAfterCheckInputsObservable.add(function () {
                if (!_this._attachedCamera) {
                    return;
                }
                // Add the bounce animation to the lower radius limit
                if (_this._isRadiusAtLimit(_this._attachedCamera.lowerRadiusLimit)) {
                    _this._applyBoundRadiusAnimation(_this.lowerRadiusTransitionRange);
                }
                // Add the bounce animation to the upper radius limit
                if (_this._isRadiusAtLimit(_this._attachedCamera.upperRadiusLimit)) {
                    _this._applyBoundRadiusAnimation(_this.upperRadiusTransitionRange);
                }
            });
        };
        BouncingBehavior.prototype.detach = function () {
            if (!this._attachedCamera) {
                return;
            }
            if (this._onAfterCheckInputsObserver) {
                this._attachedCamera.onAfterCheckInputsObservable.remove(this._onAfterCheckInputsObserver);
            }
            if (this._onMeshTargetChangedObserver) {
                this._attachedCamera.onMeshTargetChangedObservable.remove(this._onMeshTargetChangedObserver);
            }
            this._attachedCamera = null;
        };
        /**
         * Checks if the camera radius is at the specified limit. Takes into account animation locks.
         * @param radiusLimit The limit to check against.
         * @return Bool to indicate if at limit.
         */
        BouncingBehavior.prototype._isRadiusAtLimit = function (radiusLimit) {
            if (!this._attachedCamera) {
                return false;
            }
            if (this._attachedCamera.radius === radiusLimit && !this._radiusIsAnimating) {
                return true;
            }
            return false;
        };
        /**
         * Applies an animation to the radius of the camera, extending by the radiusDelta.
         * @param radiusDelta The delta by which to animate to. Can be negative.
         */
        BouncingBehavior.prototype._applyBoundRadiusAnimation = function (radiusDelta) {
            var _this = this;
            if (!this._attachedCamera) {
                return;
            }
            if (!this._radiusBounceTransition) {
                BouncingBehavior.EasingFunction.setEasingMode(BouncingBehavior.EasingMode);
                this._radiusBounceTransition = BABYLON.Animation.CreateAnimation("radius", BABYLON.Animation.ANIMATIONTYPE_FLOAT, 60, BouncingBehavior.EasingFunction);
            }
            // Prevent zoom until bounce has completed
            this._cachedWheelPrecision = this._attachedCamera.wheelPrecision;
            this._attachedCamera.wheelPrecision = Infinity;
            this._attachedCamera.inertialRadiusOffset = 0;
            // Animate to the radius limit
            this.stopAllAnimations();
            this._radiusIsAnimating = true;
            var animatable = BABYLON.Animation.TransitionTo("radius", this._attachedCamera.radius + radiusDelta, this._attachedCamera, this._attachedCamera.getScene(), 60, this._radiusBounceTransition, this.transitionDuration, function () { return _this._clearAnimationLocks(); });
            if (animatable) {
                this._animatables.push(animatable);
            }
        };
        /**
         * Removes all animation locks. Allows new animations to be added to any of the camera properties.
         */
        BouncingBehavior.prototype._clearAnimationLocks = function () {
            this._radiusIsAnimating = false;
            if (this._attachedCamera) {
                this._attachedCamera.wheelPrecision = this._cachedWheelPrecision;
            }
        };
        /**
         * Stops and removes all animations that have been applied to the camera
         */
        BouncingBehavior.prototype.stopAllAnimations = function () {
            if (this._attachedCamera) {
                this._attachedCamera.animations = [];
            }
            while (this._animatables.length) {
                this._animatables[0].onAnimationEnd = null;
                this._animatables[0].stop();
                this._animatables.shift();
            }
        };
        /**
         * The easing function used by animations
         */
        BouncingBehavior.EasingFunction = new BABYLON.BackEase(0.3);
        /**
         * The easing mode used by animations
         */
        BouncingBehavior.EasingMode = BABYLON.EasingFunction.EASINGMODE_EASEOUT;
        return BouncingBehavior;
    }());
    BABYLON.BouncingBehavior = BouncingBehavior;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.bouncingBehavior.js.map

BABYLON.Effect.ShadersStore['defaultVertexShader'] = "#include<__decl__defaultVertex>\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef TANGENT\nattribute vec4 tangent;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<helperFunctions>\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nvarying vec2 vDiffuseUV;\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nvarying vec2 vAmbientUV;\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nvarying vec2 vOpacityUV;\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nvarying vec2 vEmissiveUV;\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nvarying vec2 vLightmapUV;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nvarying vec2 vSpecularUV;\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nvarying vec2 vBumpUV;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<bumpVertexDeclaration>\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#include<logDepthDeclaration>\nvoid main(void) {\nvec3 positionUpdated=position;\n#ifdef NORMAL \nvec3 normalUpdated=normal;\n#endif\n#ifdef TANGENT\nvec4 tangentUpdated=tangent;\n#endif\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvPositionUVW=positionUpdated;\n#endif \n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\nvec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nmat3 normalWorld=mat3(finalWorld);\n#ifdef NONUNIFORMSCALING\nnormalWorld=transposeMat3(inverseMat3(normalWorld));\n#endif\nvNormalW=normalize(normalWorld*normalUpdated);\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef MAINUV1\nvMainUV1=uv;\n#endif\n#ifdef MAINUV2\nvMainUV2=uv2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nif (vAmbientInfos.x == 0.)\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nif (vOpacityInfos.x == 0.)\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nif (vEmissiveInfos.x == 0.)\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nif (vLightmapInfos.x == 0.)\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nif (vSpecularInfos.x == 0.)\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nif (vBumpInfos.x == 0.)\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#include<bumpVertex>\n#include<clipPlaneVertex>\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n#ifdef VERTEXCOLOR\n\nvColor=color;\n#endif\n#include<pointCloudVertex>\n#include<logDepthVertex>\n}";
BABYLON.Effect.ShadersStore['defaultPixelShader'] = "#include<__decl__defaultFragment>\n#if defined(BUMP) || !defined(NORMAL)\n#extension GL_OES_standard_derivatives : enable\n#endif\n#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\n\n#define RECIPROCAL_PI2 0.15915494\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\n#if DIFFUSEDIRECTUV == 1\n#define vDiffuseUV vMainUV1\n#elif DIFFUSEDIRECTUV == 2\n#define vDiffuseUV vMainUV2\n#else\nvarying vec2 vDiffuseUV;\n#endif\nuniform sampler2D diffuseSampler;\n#endif\n#ifdef AMBIENT\n#if AMBIENTDIRECTUV == 1\n#define vAmbientUV vMainUV1\n#elif AMBIENTDIRECTUV == 2\n#define vAmbientUV vMainUV2\n#else\nvarying vec2 vAmbientUV;\n#endif\nuniform sampler2D ambientSampler;\n#endif\n#ifdef OPACITY \n#if OPACITYDIRECTUV == 1\n#define vOpacityUV vMainUV1\n#elif OPACITYDIRECTUV == 2\n#define vOpacityUV vMainUV2\n#else\nvarying vec2 vOpacityUV;\n#endif\nuniform sampler2D opacitySampler;\n#endif\n#ifdef EMISSIVE\n#if EMISSIVEDIRECTUV == 1\n#define vEmissiveUV vMainUV1\n#elif EMISSIVEDIRECTUV == 2\n#define vEmissiveUV vMainUV2\n#else\nvarying vec2 vEmissiveUV;\n#endif\nuniform sampler2D emissiveSampler;\n#endif\n#ifdef LIGHTMAP\n#if LIGHTMAPDIRECTUV == 1\n#define vLightmapUV vMainUV1\n#elif LIGHTMAPDIRECTUV == 2\n#define vLightmapUV vMainUV2\n#else\nvarying vec2 vLightmapUV;\n#endif\nuniform sampler2D lightmapSampler;\n#endif\n#ifdef REFRACTION\n#ifdef REFRACTIONMAP_3D\nuniform samplerCube refractionCubeSampler;\n#else\nuniform sampler2D refraction2DSampler;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\n#if SPECULARDIRECTUV == 1\n#define vSpecularUV vMainUV1\n#elif SPECULARDIRECTUV == 2\n#define vSpecularUV vMainUV2\n#else\nvarying vec2 vSpecularUV;\n#endif\nuniform sampler2D specularSampler;\n#endif\n\n#include<fresnelFunction>\n\n#ifdef REFLECTION\n#ifdef REFLECTIONMAP_3D\nuniform samplerCube reflectionCubeSampler;\n#else\nuniform sampler2D reflection2DSampler;\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#else\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#endif\n#include<reflectionFunction>\n#endif\n#include<imageProcessingDeclaration>\n#include<imageProcessingFunctions>\n#include<bumpFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=normalize(-cross(dFdx(vPositionW),dFdy(vPositionW)));\n#endif\n#include<bumpFragment>\n#ifdef TWOSIDEDLIGHTING\nnormalW=gl_FrontFacing ? normalW : -normalW;\n#endif\n#ifdef DIFFUSE\nbaseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#ifdef ALPHAFROMDIFFUSE\nalpha*=baseColor.a;\n#endif\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#include<depthPrePass>\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\nvec3 baseAmbientColor=vec3(1.,1.,1.);\n#ifdef AMBIENT\nbaseAmbientColor=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\n#endif\n\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularColor=vSpecularColor.rgb;\n#ifdef SPECULAR\nvec4 specularMapColor=texture2D(specularSampler,vSpecularUV+uvOffset);\nspecularColor=specularMapColor.rgb;\n#ifdef GLOSSINESS\nglossiness=glossiness*specularMapColor.a;\n#endif\n#endif\n#else\nfloat glossiness=0.;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif\nfloat shadow=1.;\n#ifdef LIGHTMAP\nvec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\n\nvec3 refractionColor=vec3(0.,0.,0.);\n#ifdef REFRACTION\nvec3 refractionVector=normalize(refract(-viewDirectionW,normalW,vRefractionInfos.y));\n#ifdef REFRACTIONMAP_3D\nrefractionVector.y=refractionVector.y*vRefractionInfos.w;\nif (dot(refractionVector,viewDirectionW)<1.0)\n{\nrefractionColor=textureCube(refractionCubeSampler,refractionVector).rgb*vRefractionInfos.x;\n}\n#else\nvec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\nvec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\nrefractionCoords.y=1.0-refractionCoords.y;\nrefractionColor=texture2D(refraction2DSampler,refractionCoords).rgb*vRefractionInfos.x;\n#endif\n#endif\n\nvec3 reflectionColor=vec3(0.,0.,0.);\n#ifdef REFLECTION\nvec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n#ifdef REFLECTIONMAP_3D\n#ifdef ROUGHNESS\nfloat bias=vReflectionInfos.y;\n#ifdef SPECULARTERM\n#ifdef SPECULAR\n#ifdef GLOSSINESS\nbias*=(1.0-specularMapColor.a);\n#endif\n#endif\n#endif\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW,bias).rgb*vReflectionInfos.x;\n#else\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW).rgb*vReflectionInfos.x;\n#endif\n#else\nvec2 coords=vReflectionUVW.xy;\n#ifdef REFLECTIONMAP_PROJECTION\ncoords/=vReflectionUVW.z;\n#endif\ncoords.y=1.0-coords.y;\nreflectionColor=texture2D(reflection2DSampler,coords).rgb*vReflectionInfos.x;\n#endif\n#ifdef REFLECTIONFRESNEL\nfloat reflectionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,reflectionRightColor.a,reflectionLeftColor.a);\n#ifdef REFLECTIONFRESNELFROMSPECULAR\n#ifdef SPECULARTERM\nreflectionColor*=specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#endif\n#endif\n#ifdef REFRACTIONFRESNEL\nfloat refractionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,refractionRightColor.a,refractionLeftColor.a);\nrefractionColor*=refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*refractionRightColor.rgb;\n#endif\n#ifdef OPACITY\nvec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\n#ifdef OPACITYRGB\nopacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\nalpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n#else\nalpha*=opacityMap.a*vOpacityInfos.y;\n#endif\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef OPACITYFRESNEL\nfloat opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\nalpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\n#endif\n\nvec3 emissiveColor=vEmissiveColor;\n#ifdef EMISSIVE\nemissiveColor+=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb*vEmissiveInfos.y;\n#endif\n#ifdef EMISSIVEFRESNEL\nfloat emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\nemissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\n#endif\n\n#ifdef DIFFUSEFRESNEL\nfloat diffuseFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,diffuseRightColor.a,diffuseLeftColor.a);\ndiffuseBase*=diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*diffuseRightColor.rgb;\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\n#ifdef LINKEMISSIVEWITHDIFFUSE\nvec3 finalDiffuse=clamp((diffuseBase+emissiveColor)*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#endif\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#ifdef SPECULAROVERALPHA\nalpha=clamp(alpha+dot(finalSpecular,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#ifdef REFLECTIONOVERALPHA\nalpha=clamp(alpha+dot(reflectionColor,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec4 color=vec4(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+emissiveColor+refractionColor,0.0,1.0),alpha);\n#else\nvec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+refractionColor,alpha);\n#endif\n\n#ifdef LIGHTMAP\n#ifndef LIGHTMAPEXCLUDED\n#ifdef USELIGHTMAPASSHADOWMAP\ncolor.rgb*=lightmapColor;\n#else\ncolor.rgb+=lightmapColor;\n#endif\n#endif\n#endif\n#include<logDepthFragment>\n#include<fogFragment>\n\n\n#ifdef IMAGEPROCESSINGPOSTPROCESS\ncolor.rgb=toLinearSpace(color.rgb);\n#else\n#ifdef IMAGEPROCESSING\ncolor.rgb=toLinearSpace(color.rgb);\ncolor=applyImageProcessing(color);\n#endif\n#endif\n#ifdef PREMULTIPLYALPHA\n\ncolor.rgb*=color.a;\n#endif\ngl_FragColor=color;\n}";

var BABYLON;
(function (BABYLON) {
    var AutoRotationBehavior = /** @class */ (function () {
        function AutoRotationBehavior() {
            this._zoomStopsAnimation = false;
            this._idleRotationSpeed = 0.05;
            this._idleRotationWaitTime = 2000;
            this._idleRotationSpinupTime = 2000;
            this._isPointerDown = false;
            this._lastFrameTime = null;
            this._lastInteractionTime = -Infinity;
            this._cameraRotationSpeed = 0;
            this._lastFrameRadius = 0;
        }
        Object.defineProperty(AutoRotationBehavior.prototype, "name", {
            get: function () {
                return "AutoRotation";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AutoRotationBehavior.prototype, "zoomStopsAnimation", {
            /**
            * Gets the flag that indicates if user zooming should stop animation.
            */
            get: function () {
                return this._zoomStopsAnimation;
            },
            /**
            * Sets the flag that indicates if user zooming should stop animation.
            */
            set: function (flag) {
                this._zoomStopsAnimation = flag;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AutoRotationBehavior.prototype, "idleRotationSpeed", {
            /**
            * Gets the default speed at which the camera rotates around the model.
            */
            get: function () {
                return this._idleRotationSpeed;
            },
            /**
            * Sets the default speed at which the camera rotates around the model.
            */
            set: function (speed) {
                this._idleRotationSpeed = speed;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AutoRotationBehavior.prototype, "idleRotationWaitTime", {
            /**
            * Gets the time (milliseconds) to wait after user interaction before the camera starts rotating.
            */
            get: function () {
                return this._idleRotationWaitTime;
            },
            /**
            * Sets the time (in milliseconds) to wait after user interaction before the camera starts rotating.
            */
            set: function (time) {
                this._idleRotationWaitTime = time;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AutoRotationBehavior.prototype, "idleRotationSpinupTime", {
            /**
            * Gets the time (milliseconds) to take to spin up to the full idle rotation speed.
            */
            get: function () {
                return this._idleRotationSpinupTime;
            },
            /**
            * Sets the time (milliseconds) to take to spin up to the full idle rotation speed.
            */
            set: function (time) {
                this._idleRotationSpinupTime = time;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AutoRotationBehavior.prototype, "rotationInProgress", {
            /**
             * Gets a value indicating if the camera is currently rotating because of this behavior
             */
            get: function () {
                return Math.abs(this._cameraRotationSpeed) > 0;
            },
            enumerable: true,
            configurable: true
        });
        AutoRotationBehavior.prototype.init = function () {
            // Do notihng
        };
        AutoRotationBehavior.prototype.attach = function (camera) {
            var _this = this;
            this._attachedCamera = camera;
            var scene = this._attachedCamera.getScene();
            this._onPrePointerObservableObserver = scene.onPrePointerObservable.add(function (pointerInfoPre) {
                if (pointerInfoPre.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                    _this._isPointerDown = true;
                    return;
                }
                if (pointerInfoPre.type === BABYLON.PointerEventTypes.POINTERUP) {
                    _this._isPointerDown = false;
                }
            });
            this._onAfterCheckInputsObserver = camera.onAfterCheckInputsObservable.add(function () {
                var now = BABYLON.Tools.Now;
                var dt = 0;
                if (_this._lastFrameTime != null) {
                    dt = now - _this._lastFrameTime;
                }
                _this._lastFrameTime = now;
                // Stop the animation if there is user interaction and the animation should stop for this interaction
                _this._applyUserInteraction();
                var timeToRotation = now - _this._lastInteractionTime - _this._idleRotationWaitTime;
                var scale = Math.max(Math.min(timeToRotation / (_this._idleRotationSpinupTime), 1), 0);
                _this._cameraRotationSpeed = _this._idleRotationSpeed * scale;
                // Step camera rotation by rotation speed
                if (_this._attachedCamera) {
                    _this._attachedCamera.alpha -= _this._cameraRotationSpeed * (dt / 1000);
                }
            });
        };
        AutoRotationBehavior.prototype.detach = function () {
            if (!this._attachedCamera) {
                return;
            }
            var scene = this._attachedCamera.getScene();
            if (this._onPrePointerObservableObserver) {
                scene.onPrePointerObservable.remove(this._onPrePointerObservableObserver);
            }
            this._attachedCamera.onAfterCheckInputsObservable.remove(this._onAfterCheckInputsObserver);
            this._attachedCamera = null;
        };
        /**
         * Returns true if user is scrolling.
         * @return true if user is scrolling.
         */
        AutoRotationBehavior.prototype._userIsZooming = function () {
            if (!this._attachedCamera) {
                return false;
            }
            return this._attachedCamera.inertialRadiusOffset !== 0;
        };
        AutoRotationBehavior.prototype._shouldAnimationStopForInteraction = function () {
            if (!this._attachedCamera) {
                return false;
            }
            var zoomHasHitLimit = false;
            if (this._lastFrameRadius === this._attachedCamera.radius && this._attachedCamera.inertialRadiusOffset !== 0) {
                zoomHasHitLimit = true;
            }
            // Update the record of previous radius - works as an approx. indicator of hitting radius limits
            this._lastFrameRadius = this._attachedCamera.radius;
            return this._zoomStopsAnimation ? zoomHasHitLimit : this._userIsZooming();
        };
        /**
         *  Applies any current user interaction to the camera. Takes into account maximum alpha rotation.
         */
        AutoRotationBehavior.prototype._applyUserInteraction = function () {
            if (this._userIsMoving() && !this._shouldAnimationStopForInteraction()) {
                this._lastInteractionTime = BABYLON.Tools.Now;
            }
        };
        // Tools
        AutoRotationBehavior.prototype._userIsMoving = function () {
            if (!this._attachedCamera) {
                return false;
            }
            return this._attachedCamera.inertialAlphaOffset !== 0 ||
                this._attachedCamera.inertialBetaOffset !== 0 ||
                this._attachedCamera.inertialRadiusOffset !== 0 ||
                this._attachedCamera.inertialPanningX !== 0 ||
                this._attachedCamera.inertialPanningY !== 0 ||
                this._isPointerDown;
        };
        return AutoRotationBehavior;
    }());
    BABYLON.AutoRotationBehavior = AutoRotationBehavior;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.autoRotationBehavior.js.map

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
(function() {
var EXPORTS = {};EXPORTS['FramingBehavior'] = BABYLON['FramingBehavior'];EXPORTS['BouncingBehavior'] = BABYLON['BouncingBehavior'];EXPORTS['AutoRotationBehavior'] = BABYLON['AutoRotationBehavior'];
    globalObject["BABYLON"] = globalObject["BABYLON"] || BABYLON;
    module.exports = EXPORTS;
    })();
}