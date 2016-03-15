var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var ArcRotateCamera = (function (_super) {
        __extends(ArcRotateCamera, _super);
        function ArcRotateCamera(name, alpha, beta, radius, target, scene) {
            var _this = this;
            _super.call(this, name, BABYLON.Vector3.Zero(), scene);
            this.inertialAlphaOffset = 0;
            this.inertialBetaOffset = 0;
            this.inertialRadiusOffset = 0;
            this.lowerAlphaLimit = null;
            this.upperAlphaLimit = null;
            this.lowerBetaLimit = 0.01;
            this.upperBetaLimit = Math.PI;
            this.lowerRadiusLimit = null;
            this.upperRadiusLimit = null;
            this.inertialPanningX = 0;
            this.inertialPanningY = 0;
            //-- end properties for backward compatibility for inputs        
            this.zoomOnFactor = 1;
            this.targetScreenOffset = BABYLON.Vector2.Zero();
            this.allowUpsideDown = true;
            this._viewMatrix = new BABYLON.Matrix();
            // Panning
            this.panningAxis = new BABYLON.Vector3(1, 1, 0);
            this.checkCollisions = false;
            this.collisionRadius = new BABYLON.Vector3(0.5, 0.5, 0.5);
            this._collider = new BABYLON.Collider();
            this._previousPosition = BABYLON.Vector3.Zero();
            this._collisionVelocity = BABYLON.Vector3.Zero();
            this._newPosition = BABYLON.Vector3.Zero();
            this._onCollisionPositionChange = function (collisionId, newPosition, collidedMesh) {
                if (collidedMesh === void 0) { collidedMesh = null; }
                if (_this.getScene().workerCollisions && _this.checkCollisions) {
                    newPosition.multiplyInPlace(_this._collider.radius);
                }
                if (!collidedMesh) {
                    _this._previousPosition.copyFrom(_this.position);
                }
                else {
                    _this.setPosition(newPosition);
                    if (_this.onCollide) {
                        _this.onCollide(collidedMesh);
                    }
                }
                // Recompute because of constraints
                var cosa = Math.cos(_this.alpha);
                var sina = Math.sin(_this.alpha);
                var cosb = Math.cos(_this.beta);
                var sinb = Math.sin(_this.beta);
                if (sinb === 0) {
                    sinb = 0.0001;
                }
                var target = _this._getTargetPosition();
                target.addToRef(new BABYLON.Vector3(_this.radius * cosa * sinb, _this.radius * cosb, _this.radius * sina * sinb), _this._newPosition);
                _this.position.copyFrom(_this._newPosition);
                var up = _this.upVector;
                if (_this.allowUpsideDown && _this.beta < 0) {
                    up = up.clone();
                    up = up.negate();
                }
                BABYLON.Matrix.LookAtLHToRef(_this.position, target, up, _this._viewMatrix);
                _this._viewMatrix.m[12] += _this.targetScreenOffset.x;
                _this._viewMatrix.m[13] += _this.targetScreenOffset.y;
                _this._collisionTriggered = false;
            };
            if (!target) {
                this.target = BABYLON.Vector3.Zero();
            }
            else {
                this.target = target;
            }
            this.alpha = alpha;
            this.beta = beta;
            this.radius = radius;
            this.getViewMatrix();
            this.inputs = new BABYLON.ArcRotateCameraInputsManager(this);
            this.inputs.addKeyboard().addMouseWheel().addPointers().addGamepad();
        }
        Object.defineProperty(ArcRotateCamera.prototype, "angularSensibilityX", {
            //-- begin properties for backward compatibility for inputs       
            get: function () {
                var pointers = this.inputs.attached["pointers"];
                if (pointers)
                    return pointers.angularSensibilityX;
            },
            set: function (value) {
                var pointers = this.inputs.attached["pointers"];
                if (pointers) {
                    pointers.angularSensibilityX = value;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArcRotateCamera.prototype, "angularSensibilityY", {
            get: function () {
                var pointers = this.inputs.attached["pointers"];
                if (pointers)
                    return pointers.angularSensibilityY;
            },
            set: function (value) {
                var pointers = this.inputs.attached["pointers"];
                if (pointers) {
                    pointers.angularSensibilityY = value;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArcRotateCamera.prototype, "pinchPrecision", {
            get: function () {
                var pointers = this.inputs.attached["pointers"];
                if (pointers)
                    return pointers.pinchPrecision;
            },
            set: function (value) {
                var pointers = this.inputs.attached["pointers"];
                if (pointers) {
                    pointers.pinchPrecision = value;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArcRotateCamera.prototype, "panningSensibility", {
            get: function () {
                var pointers = this.inputs.attached["pointers"];
                if (pointers)
                    return pointers.panningSensibility;
            },
            set: function (value) {
                var pointers = this.inputs.attached["pointers"];
                if (pointers) {
                    pointers.panningSensibility = value;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArcRotateCamera.prototype, "keysUp", {
            get: function () {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    return keyboard.keysUp;
            },
            set: function (value) {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    keyboard.keysUp = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArcRotateCamera.prototype, "keysDown", {
            get: function () {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    return keyboard.keysDown;
            },
            set: function (value) {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    keyboard.keysDown = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArcRotateCamera.prototype, "keysLeft", {
            get: function () {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    return keyboard.keysLeft;
            },
            set: function (value) {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    keyboard.keysLeft = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArcRotateCamera.prototype, "keysRight", {
            get: function () {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    return keyboard.keysRight;
            },
            set: function (value) {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    keyboard.keysRight = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArcRotateCamera.prototype, "wheelPrecision", {
            get: function () {
                var mousewheel = this.inputs.attached["mousewheel"];
                if (mousewheel)
                    return mousewheel.wheelPrecision;
            },
            set: function (value) {
                var mousewheel = this.inputs.attached["mousewheel"];
                if (mousewheel)
                    mousewheel.wheelPrecision = value;
            },
            enumerable: true,
            configurable: true
        });
        // Cache
        ArcRotateCamera.prototype._initCache = function () {
            _super.prototype._initCache.call(this);
            this._cache.target = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            this._cache.alpha = undefined;
            this._cache.beta = undefined;
            this._cache.radius = undefined;
            this._cache.targetScreenOffset = BABYLON.Vector2.Zero();
        };
        ArcRotateCamera.prototype._updateCache = function (ignoreParentClass) {
            if (!ignoreParentClass) {
                _super.prototype._updateCache.call(this);
            }
            this._cache.target.copyFrom(this._getTargetPosition());
            this._cache.alpha = this.alpha;
            this._cache.beta = this.beta;
            this._cache.radius = this.radius;
            this._cache.targetScreenOffset.copyFrom(this.targetScreenOffset);
        };
        ArcRotateCamera.prototype._getTargetPosition = function () {
            if (this.target.getAbsolutePosition) {
                return this.target.getAbsolutePosition();
            }
            return this.target;
        };
        // Synchronized
        ArcRotateCamera.prototype._isSynchronizedViewMatrix = function () {
            if (!_super.prototype._isSynchronizedViewMatrix.call(this))
                return false;
            return this._cache.target.equals(this.target)
                && this._cache.alpha === this.alpha
                && this._cache.beta === this.beta
                && this._cache.radius === this.radius
                && this._cache.targetScreenOffset.equals(this.targetScreenOffset);
        };
        // Methods
        ArcRotateCamera.prototype.attachControl = function (element, noPreventDefault, useCtrlForPanning) {
            var _this = this;
            if (useCtrlForPanning === void 0) { useCtrlForPanning = true; }
            if (this._attachedElement) {
                return;
            }
            this._attachedElement = element;
            this._noPreventDefault = BABYLON.Camera.ForceAttachControlToAlwaysPreventDefault ? false : noPreventDefault;
            this._useCtrlForPanning = useCtrlForPanning;
            this.inputs.attachElement(element, noPreventDefault);
            this._reset = function () {
                _this.inertialAlphaOffset = 0;
                _this.inertialBetaOffset = 0;
                _this.inertialRadiusOffset = 0;
            };
        };
        ArcRotateCamera.prototype.detachControl = function (element) {
            if (this._attachedElement !== element) {
                return;
            }
            this.inputs.detachElement(this._attachedElement);
            this._attachedElement = null;
            if (this._reset) {
                this._reset();
            }
        };
        ArcRotateCamera.prototype._checkInputs = function () {
            //if (async) collision inspection was triggered, don't update the camera's position - until the collision callback was called.
            if (this._collisionTriggered) {
                return;
            }
            this.inputs.checkInputs();
            // Inertia
            if (this.inertialAlphaOffset !== 0 || this.inertialBetaOffset !== 0 || this.inertialRadiusOffset !== 0) {
                this.alpha += this.beta <= 0 ? -this.inertialAlphaOffset : this.inertialAlphaOffset;
                this.beta += this.inertialBetaOffset;
                this.radius -= this.inertialRadiusOffset;
                this.inertialAlphaOffset *= this.inertia;
                this.inertialBetaOffset *= this.inertia;
                this.inertialRadiusOffset *= this.inertia;
                if (Math.abs(this.inertialAlphaOffset) < BABYLON.Epsilon)
                    this.inertialAlphaOffset = 0;
                if (Math.abs(this.inertialBetaOffset) < BABYLON.Epsilon)
                    this.inertialBetaOffset = 0;
                if (Math.abs(this.inertialRadiusOffset) < BABYLON.Epsilon)
                    this.inertialRadiusOffset = 0;
            }
            // Panning inertia
            if (this.inertialPanningX !== 0 || this.inertialPanningY !== 0) {
                if (!this._localDirection) {
                    this._localDirection = BABYLON.Vector3.Zero();
                    this._transformedDirection = BABYLON.Vector3.Zero();
                }
                this.inertialPanningX *= this.inertia;
                this.inertialPanningY *= this.inertia;
                if (Math.abs(this.inertialPanningX) < BABYLON.Epsilon)
                    this.inertialPanningX = 0;
                if (Math.abs(this.inertialPanningY) < BABYLON.Epsilon)
                    this.inertialPanningY = 0;
                this._localDirection.copyFromFloats(this.inertialPanningX, this.inertialPanningY, this.inertialPanningY);
                this._localDirection.multiplyInPlace(this.panningAxis);
                this._viewMatrix.invertToRef(this._cameraTransformMatrix);
                BABYLON.Vector3.TransformNormalToRef(this._localDirection, this._cameraTransformMatrix, this._transformedDirection);
                //Eliminate y if map panning is enabled (panningAxis == 1,0,1)
                if (!this.panningAxis.y) {
                    this._transformedDirection.y = 0;
                }
                this.target.addInPlace(this._transformedDirection);
            }
            // Limits
            this._checkLimits();
            _super.prototype._checkInputs.call(this);
        };
        ArcRotateCamera.prototype._checkLimits = function () {
            if (this.lowerBetaLimit === null || this.lowerBetaLimit === undefined) {
                if (this.allowUpsideDown && this.beta > Math.PI) {
                    this.beta = this.beta - (2 * Math.PI);
                }
            }
            else {
                if (this.beta < this.lowerBetaLimit) {
                    this.beta = this.lowerBetaLimit;
                }
            }
            if (this.upperBetaLimit === null || this.upperBetaLimit === undefined) {
                if (this.allowUpsideDown && this.beta < -Math.PI) {
                    this.beta = this.beta + (2 * Math.PI);
                }
            }
            else {
                if (this.beta > this.upperBetaLimit) {
                    this.beta = this.upperBetaLimit;
                }
            }
            if (this.lowerAlphaLimit && this.alpha < this.lowerAlphaLimit) {
                this.alpha = this.lowerAlphaLimit;
            }
            if (this.upperAlphaLimit && this.alpha > this.upperAlphaLimit) {
                this.alpha = this.upperAlphaLimit;
            }
            if (this.lowerRadiusLimit && this.radius < this.lowerRadiusLimit) {
                this.radius = this.lowerRadiusLimit;
            }
            if (this.upperRadiusLimit && this.radius > this.upperRadiusLimit) {
                this.radius = this.upperRadiusLimit;
            }
        };
        ArcRotateCamera.prototype.rebuildAnglesAndRadius = function () {
            var radiusv3 = this.position.subtract(this._getTargetPosition());
            this.radius = radiusv3.length();
            // Alpha
            this.alpha = Math.acos(radiusv3.x / Math.sqrt(Math.pow(radiusv3.x, 2) + Math.pow(radiusv3.z, 2)));
            if (radiusv3.z < 0) {
                this.alpha = 2 * Math.PI - this.alpha;
            }
            // Beta
            this.beta = Math.acos(radiusv3.y / this.radius);
            this._checkLimits();
        };
        ArcRotateCamera.prototype.setPosition = function (position) {
            if (this.position.equals(position)) {
                return;
            }
            this.position = position;
            this.rebuildAnglesAndRadius();
        };
        ArcRotateCamera.prototype.setTarget = function (target) {
            if (this._getTargetPosition().equals(target)) {
                return;
            }
            this.target = target;
            this.rebuildAnglesAndRadius();
        };
        ArcRotateCamera.prototype._getViewMatrix = function () {
            // Compute
            var cosa = Math.cos(this.alpha);
            var sina = Math.sin(this.alpha);
            var cosb = Math.cos(this.beta);
            var sinb = Math.sin(this.beta);
            if (sinb === 0) {
                sinb = 0.0001;
            }
            var target = this._getTargetPosition();
            target.addToRef(new BABYLON.Vector3(this.radius * cosa * sinb, this.radius * cosb, this.radius * sina * sinb), this._newPosition);
            if (this.getScene().collisionsEnabled && this.checkCollisions) {
                this._collider.radius = this.collisionRadius;
                this._newPosition.subtractToRef(this.position, this._collisionVelocity);
                this._collisionTriggered = true;
                this.getScene().collisionCoordinator.getNewPosition(this.position, this._collisionVelocity, this._collider, 3, null, this._onCollisionPositionChange, this.uniqueId);
            }
            else {
                this.position.copyFrom(this._newPosition);
                var up = this.upVector;
                if (this.allowUpsideDown && this.beta < 0) {
                    up = up.clone();
                    up = up.negate();
                }
                BABYLON.Matrix.LookAtLHToRef(this.position, target, up, this._viewMatrix);
                this._viewMatrix.m[12] += this.targetScreenOffset.x;
                this._viewMatrix.m[13] += this.targetScreenOffset.y;
            }
            return this._viewMatrix;
        };
        ArcRotateCamera.prototype.zoomOn = function (meshes, doNotUpdateMaxZ) {
            if (doNotUpdateMaxZ === void 0) { doNotUpdateMaxZ = false; }
            meshes = meshes || this.getScene().meshes;
            var minMaxVector = BABYLON.Mesh.MinMax(meshes);
            var distance = BABYLON.Vector3.Distance(minMaxVector.min, minMaxVector.max);
            this.radius = distance * this.zoomOnFactor;
            this.focusOn({ min: minMaxVector.min, max: minMaxVector.max, distance: distance }, doNotUpdateMaxZ);
        };
        ArcRotateCamera.prototype.focusOn = function (meshesOrMinMaxVectorAndDistance, doNotUpdateMaxZ) {
            if (doNotUpdateMaxZ === void 0) { doNotUpdateMaxZ = false; }
            var meshesOrMinMaxVector;
            var distance;
            if (meshesOrMinMaxVectorAndDistance.min === undefined) {
                meshesOrMinMaxVector = meshesOrMinMaxVectorAndDistance || this.getScene().meshes;
                meshesOrMinMaxVector = BABYLON.Mesh.MinMax(meshesOrMinMaxVector);
                distance = BABYLON.Vector3.Distance(meshesOrMinMaxVector.min, meshesOrMinMaxVector.max);
            }
            else {
                meshesOrMinMaxVector = meshesOrMinMaxVectorAndDistance;
                distance = meshesOrMinMaxVectorAndDistance.distance;
            }
            this.target = BABYLON.Mesh.Center(meshesOrMinMaxVector);
            if (!doNotUpdateMaxZ) {
                this.maxZ = distance * 2;
            }
        };
        /**
         * @override
         * Override Camera.createRigCamera
         */
        ArcRotateCamera.prototype.createRigCamera = function (name, cameraIndex) {
            switch (this.cameraRigMode) {
                case BABYLON.Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
                case BABYLON.Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
                case BABYLON.Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
                case BABYLON.Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER:
                case BABYLON.Camera.RIG_MODE_VR:
                    var alphaShift = this._cameraRigParams.stereoHalfAngle * (cameraIndex === 0 ? 1 : -1);
                    return new ArcRotateCamera(name, this.alpha + alphaShift, this.beta, this.radius, this.target, this.getScene());
            }
            return null;
        };
        /**
         * @override
         * Override Camera._updateRigCameras
         */
        ArcRotateCamera.prototype._updateRigCameras = function () {
            switch (this.cameraRigMode) {
                case BABYLON.Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
                case BABYLON.Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
                case BABYLON.Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
                case BABYLON.Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER:
                case BABYLON.Camera.RIG_MODE_VR:
                    var camLeft = this._rigCameras[0];
                    var camRight = this._rigCameras[1];
                    camLeft.alpha = this.alpha - this._cameraRigParams.stereoHalfAngle;
                    camRight.alpha = this.alpha + this._cameraRigParams.stereoHalfAngle;
                    camLeft.beta = camRight.beta = this.beta;
                    camLeft.radius = camRight.radius = this.radius;
                    break;
            }
            _super.prototype._updateRigCameras.call(this);
        };
        ArcRotateCamera.prototype.dispose = function () {
            this.inputs.clear();
            _super.prototype.dispose.call(this);
        };
        ArcRotateCamera.prototype.getTypeName = function () {
            return "ArcRotateCamera";
        };
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCamera.prototype, "alpha", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCamera.prototype, "beta", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCamera.prototype, "radius", void 0);
        __decorate([
            BABYLON.serializeAsVector3()
        ], ArcRotateCamera.prototype, "target", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCamera.prototype, "inertialAlphaOffset", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCamera.prototype, "inertialBetaOffset", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCamera.prototype, "inertialRadiusOffset", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCamera.prototype, "lowerAlphaLimit", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCamera.prototype, "upperAlphaLimit", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCamera.prototype, "lowerBetaLimit", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCamera.prototype, "upperBetaLimit", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCamera.prototype, "lowerRadiusLimit", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCamera.prototype, "upperRadiusLimit", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCamera.prototype, "inertialPanningX", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCamera.prototype, "inertialPanningY", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCamera.prototype, "zoomOnFactor", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCamera.prototype, "allowUpsideDown", void 0);
        return ArcRotateCamera;
    })(BABYLON.TargetCamera);
    BABYLON.ArcRotateCamera = ArcRotateCamera;
})(BABYLON || (BABYLON = {}));
