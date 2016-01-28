var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var eventPrefix = BABYLON.Tools.GetPointerPrefix();
    var ArcRotateCamera = (function (_super) {
        __extends(ArcRotateCamera, _super);
        function ArcRotateCamera(name, alpha, beta, radius, target, scene) {
            var _this = this;
            _super.call(this, name, BABYLON.Vector3.Zero(), scene);
            this.alpha = alpha;
            this.beta = beta;
            this.radius = radius;
            this.target = target;
            this.inertialAlphaOffset = 0;
            this.inertialBetaOffset = 0;
            this.inertialRadiusOffset = 0;
            this.lowerAlphaLimit = null;
            this.upperAlphaLimit = null;
            this.lowerBetaLimit = 0.01;
            this.upperBetaLimit = Math.PI;
            this.lowerRadiusLimit = null;
            this.upperRadiusLimit = null;
            this.angularSensibilityX = 1000.0;
            this.angularSensibilityY = 1000.0;
            this.wheelPrecision = 3.0;
            this.pinchPrecision = 2.0;
            this.panningSensibility = 50.0;
            this.inertialPanningX = 0;
            this.inertialPanningY = 0;
            this.keysUp = [38];
            this.keysDown = [40];
            this.keysLeft = [37];
            this.keysRight = [39];
            this.zoomOnFactor = 1;
            this.targetScreenOffset = BABYLON.Vector2.Zero();
            this.pinchInwards = true;
            this.allowUpsideDown = true;
            this._keys = [];
            this._viewMatrix = new BABYLON.Matrix();
            // Panning
            this.panningAxis = new BABYLON.Vector3(1, 0, 1);
            this._isRightClick = false;
            this._isCtrlPushed = false;
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
            if (!this.target) {
                this.target = BABYLON.Vector3.Zero();
            }
            this.getViewMatrix();
        }
        Object.defineProperty(ArcRotateCamera.prototype, "angularSensibility", {
            //deprecated angularSensibility support
            get: function () {
                BABYLON.Tools.Warn("Warning: angularSensibility is deprecated, use angularSensibilityX and angularSensibilityY instead.");
                return Math.max(this.angularSensibilityX, this.angularSensibilityY);
            },
            //deprecated angularSensibility support
            set: function (value) {
                BABYLON.Tools.Warn("Warning: angularSensibility is deprecated, use angularSensibilityX and angularSensibilityY instead.");
                this.angularSensibilityX = value;
                this.angularSensibilityY = value;
            },
            enumerable: true,
            configurable: true
        });
        ArcRotateCamera.prototype._getTargetPosition = function () {
            return this.target.getAbsolutePosition ? this.target.getAbsolutePosition() : this.target;
        };
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
        // Synchronized
        ArcRotateCamera.prototype._isSynchronizedViewMatrix = function () {
            if (!_super.prototype._isSynchronizedViewMatrix.call(this))
                return false;
            return this._cache.target.equals(this._getTargetPosition())
                && this._cache.alpha === this.alpha
                && this._cache.beta === this.beta
                && this._cache.radius === this.radius
                && this._cache.targetScreenOffset.equals(this.targetScreenOffset);
        };
        // Methods
        ArcRotateCamera.prototype.attachControl = function (element, noPreventDefault, useCtrlForPanning) {
            var _this = this;
            if (useCtrlForPanning === void 0) { useCtrlForPanning = true; }
            var cacheSoloPointer; // cache pointer object for better perf on camera rotation
            var previousPinchDistance = 0;
            var pointers = new BABYLON.SmartCollection();
            if (this._attachedElement) {
                return;
            }
            this._attachedElement = element;
            var engine = this.getEngine();
            if (this._onPointerDown === undefined) {
                this._onPointerDown = function (evt) {
                    // Manage panning with right click
                    _this._isRightClick = evt.button === 2;
                    // manage pointers
                    pointers.add(evt.pointerId, { x: evt.clientX, y: evt.clientY, type: evt.pointerType });
                    cacheSoloPointer = pointers.item(evt.pointerId);
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };
                this._onPointerUp = function (evt) {
                    cacheSoloPointer = null;
                    previousPinchDistance = 0;
                    //would be better to use pointers.remove(evt.pointerId) for multitouch gestures, 
                    //but emptying completly pointers collection is required to fix a bug on iPhone : 
                    //when changing orientation while pinching camera, one pointer stay pressed forever if we don't release all pointers  
                    //will be ok to put back pointers.remove(evt.pointerId); when iPhone bug corrected
                    pointers.empty();
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };
                this._onContextMenu = function (evt) {
                    evt.preventDefault();
                };
                this._onPointerMove = function (evt) {
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                    switch (pointers.count) {
                        case 1:
                            if (_this.panningSensibility !== 0 && ((_this._isCtrlPushed && useCtrlForPanning) || (!useCtrlForPanning && _this._isRightClick))) {
                                _this.inertialPanningX += -(evt.clientX - cacheSoloPointer.x) / _this.panningSensibility;
                                _this.inertialPanningY += (evt.clientY - cacheSoloPointer.y) / _this.panningSensibility;
                            }
                            else {
                                var offsetX = evt.clientX - cacheSoloPointer.x;
                                var offsetY = evt.clientY - cacheSoloPointer.y;
                                _this.inertialAlphaOffset -= offsetX / _this.angularSensibilityX;
                                _this.inertialBetaOffset -= offsetY / _this.angularSensibilityY;
                            }
                            cacheSoloPointer.x = evt.clientX;
                            cacheSoloPointer.y = evt.clientY;
                            break;
                        case 2:
                            //if (noPreventDefault) { evt.preventDefault(); } //if pinch gesture, could be usefull to force preventDefault to avoid html page scroll/zoom in some mobile browsers
                            pointers.item(evt.pointerId).x = evt.clientX;
                            pointers.item(evt.pointerId).y = evt.clientY;
                            var direction = _this.pinchInwards ? 1 : -1;
                            var distX = pointers.getItemByIndex(0).x - pointers.getItemByIndex(1).x;
                            var distY = pointers.getItemByIndex(0).y - pointers.getItemByIndex(1).y;
                            var pinchSquaredDistance = (distX * distX) + (distY * distY);
                            if (previousPinchDistance === 0) {
                                previousPinchDistance = pinchSquaredDistance;
                                return;
                            }
                            if (pinchSquaredDistance !== previousPinchDistance) {
                                _this.inertialRadiusOffset += (pinchSquaredDistance - previousPinchDistance) / (_this.pinchPrecision * _this.wheelPrecision * ((_this.angularSensibilityX + _this.angularSensibilityY) / 2) * direction);
                                previousPinchDistance = pinchSquaredDistance;
                            }
                            break;
                        default:
                            if (pointers.item(evt.pointerId)) {
                                pointers.item(evt.pointerId).x = evt.clientX;
                                pointers.item(evt.pointerId).y = evt.clientY;
                            }
                    }
                };
                this._onMouseMove = function (evt) {
                    if (!engine.isPointerLock) {
                        return;
                    }
                    var offsetX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || evt.msMovementX || 0;
                    var offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;
                    _this.inertialAlphaOffset -= offsetX / _this.angularSensibilityX;
                    _this.inertialBetaOffset -= offsetY / _this.angularSensibilityY;
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };
                this._wheel = function (event) {
                    var delta = 0;
                    if (event.wheelDelta) {
                        delta = event.wheelDelta / (_this.wheelPrecision * 40);
                    }
                    else if (event.detail) {
                        delta = -event.detail / _this.wheelPrecision;
                    }
                    if (delta)
                        _this.inertialRadiusOffset += delta;
                    if (event.preventDefault) {
                        if (!noPreventDefault) {
                            event.preventDefault();
                        }
                    }
                };
                this._onKeyDown = function (evt) {
                    _this._isCtrlPushed = evt.ctrlKey;
                    if (_this.keysUp.indexOf(evt.keyCode) !== -1 ||
                        _this.keysDown.indexOf(evt.keyCode) !== -1 ||
                        _this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                        _this.keysRight.indexOf(evt.keyCode) !== -1) {
                        var index = _this._keys.indexOf(evt.keyCode);
                        if (index === -1) {
                            _this._keys.push(evt.keyCode);
                        }
                        if (evt.preventDefault) {
                            if (!noPreventDefault) {
                                evt.preventDefault();
                            }
                        }
                    }
                };
                this._onKeyUp = function (evt) {
                    _this._isCtrlPushed = evt.ctrlKey;
                    if (_this.keysUp.indexOf(evt.keyCode) !== -1 ||
                        _this.keysDown.indexOf(evt.keyCode) !== -1 ||
                        _this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                        _this.keysRight.indexOf(evt.keyCode) !== -1) {
                        var index = _this._keys.indexOf(evt.keyCode);
                        if (index >= 0) {
                            _this._keys.splice(index, 1);
                        }
                        if (evt.preventDefault) {
                            if (!noPreventDefault) {
                                evt.preventDefault();
                            }
                        }
                    }
                };
                this._onLostFocus = function () {
                    _this._keys = [];
                    pointers.empty();
                    previousPinchDistance = 0;
                    cacheSoloPointer = null;
                };
                this._onGestureStart = function (e) {
                    if (window.MSGesture === undefined) {
                        return;
                    }
                    if (!_this._MSGestureHandler) {
                        _this._MSGestureHandler = new MSGesture();
                        _this._MSGestureHandler.target = element;
                    }
                    _this._MSGestureHandler.addPointer(e.pointerId);
                };
                this._onGesture = function (e) {
                    _this.radius *= e.scale;
                    if (e.preventDefault) {
                        if (!noPreventDefault) {
                            e.stopPropagation();
                            e.preventDefault();
                        }
                    }
                };
                this._reset = function () {
                    _this._keys = [];
                    _this.inertialAlphaOffset = 0;
                    _this.inertialBetaOffset = 0;
                    _this.inertialRadiusOffset = 0;
                    pointers.empty();
                    previousPinchDistance = 0;
                    cacheSoloPointer = null;
                };
            }
            if (!useCtrlForPanning) {
                element.addEventListener("contextmenu", this._onContextMenu, false);
            }
            element.addEventListener(eventPrefix + "down", this._onPointerDown, false);
            element.addEventListener(eventPrefix + "up", this._onPointerUp, false);
            element.addEventListener(eventPrefix + "out", this._onPointerUp, false);
            element.addEventListener(eventPrefix + "move", this._onPointerMove, false);
            element.addEventListener("mousemove", this._onMouseMove, false);
            element.addEventListener("MSPointerDown", this._onGestureStart, false);
            element.addEventListener("MSGestureChange", this._onGesture, false);
            element.addEventListener('mousewheel', this._wheel, false);
            element.addEventListener('DOMMouseScroll', this._wheel, false);
            BABYLON.Tools.RegisterTopRootEvents([
                { name: "keydown", handler: this._onKeyDown },
                { name: "keyup", handler: this._onKeyUp },
                { name: "blur", handler: this._onLostFocus }
            ]);
        };
        ArcRotateCamera.prototype.detachControl = function (element) {
            if (this._attachedElement !== element) {
                return;
            }
            element.removeEventListener("contextmenu", this._onContextMenu);
            element.removeEventListener(eventPrefix + "down", this._onPointerDown);
            element.removeEventListener(eventPrefix + "up", this._onPointerUp);
            element.removeEventListener(eventPrefix + "out", this._onPointerUp);
            element.removeEventListener(eventPrefix + "move", this._onPointerMove);
            element.removeEventListener("mousemove", this._onMouseMove);
            element.removeEventListener("MSPointerDown", this._onGestureStart);
            element.removeEventListener("MSGestureChange", this._onGesture);
            element.removeEventListener('mousewheel', this._wheel);
            element.removeEventListener('DOMMouseScroll', this._wheel);
            BABYLON.Tools.UnregisterTopRootEvents([
                { name: "keydown", handler: this._onKeyDown },
                { name: "keyup", handler: this._onKeyUp },
                { name: "blur", handler: this._onLostFocus }
            ]);
            this._MSGestureHandler = null;
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
            // Keyboard
            for (var index = 0; index < this._keys.length; index++) {
                var keyCode = this._keys[index];
                if (this.keysLeft.indexOf(keyCode) !== -1) {
                    this.inertialAlphaOffset -= 0.01;
                }
                else if (this.keysUp.indexOf(keyCode) !== -1) {
                    this.inertialBetaOffset -= 0.01;
                }
                else if (this.keysRight.indexOf(keyCode) !== -1) {
                    this.inertialAlphaOffset += 0.01;
                }
                else if (this.keysDown.indexOf(keyCode) !== -1) {
                    this.inertialBetaOffset += 0.01;
                }
            }
            // Inertia
            if (this.inertialAlphaOffset !== 0 || this.inertialBetaOffset !== 0 || this.inertialRadiusOffset !== 0) {
                this.alpha += this.beta <= 0 ? -this.inertialAlphaOffset : this.inertialAlphaOffset;
                this.beta += this.inertialBetaOffset;
                this.radius -= this.inertialRadiusOffset;
                this.inertialAlphaOffset *= this.inertia;
                this.inertialBetaOffset *= this.inertia;
                this.inertialRadiusOffset *= this.inertia;
                if (Math.abs(this.inertialAlphaOffset) < BABYLON.Engine.Epsilon)
                    this.inertialAlphaOffset = 0;
                if (Math.abs(this.inertialBetaOffset) < BABYLON.Engine.Epsilon)
                    this.inertialBetaOffset = 0;
                if (Math.abs(this.inertialRadiusOffset) < BABYLON.Engine.Epsilon)
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
                if (Math.abs(this.inertialPanningX) < BABYLON.Engine.Epsilon)
                    this.inertialPanningX = 0;
                if (Math.abs(this.inertialPanningY) < BABYLON.Engine.Epsilon)
                    this.inertialPanningY = 0;
                this._localDirection.copyFromFloats(this.inertialPanningX, this.inertialPanningY, this.inertialPanningY);
                this._viewMatrix.invertToRef(this._cameraTransformMatrix);
                BABYLON.Vector3.TransformNormalToRef(this._localDirection, this._cameraTransformMatrix, this._transformedDirection);
                this._transformedDirection.multiplyInPlace(this.panningAxis);
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
        ArcRotateCamera.prototype.setPosition = function (position) {
            if (this.position.equals(position)) {
                return;
            }
            var radiusv3 = position.subtract(this._getTargetPosition());
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
        ArcRotateCamera.prototype.setTarget = function (target) {
            this.target = target;
        };
        ArcRotateCamera.prototype._getViewMatrix = function () {
            // Compute
            var cosa = Math.cos(this.alpha);
            var sina = Math.sin(this.alpha);
            var cosb = Math.cos(this.beta);
            var sinb = Math.sin(this.beta);
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
        ArcRotateCamera.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            if (this.target instanceof BABYLON.Vector3) {
                serializationObject.target = this.target.asArray();
            }
            if (this.target && this.target.id) {
                serializationObject.lockedTargetId = this.target.id;
            }
            serializationObject.checkCollisions = this.checkCollisions;
            serializationObject.alpha = this.alpha;
            serializationObject.beta = this.beta;
            serializationObject.radius = this.radius;
            return serializationObject;
        };
        return ArcRotateCamera;
    })(BABYLON.TargetCamera);
    BABYLON.ArcRotateCamera = ArcRotateCamera;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.arcRotateCamera.js.map