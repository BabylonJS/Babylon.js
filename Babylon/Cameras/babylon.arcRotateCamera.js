var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var eventPrefix = BABYLON.Tools.GetPointerPrefix();
    var ArcRotateCamera = (function (_super) {
        __extends(ArcRotateCamera, _super);
        function ArcRotateCamera(name, alpha, beta, radius, target, scene) {
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
            this.angularSensibility = 1000.0;
            this.wheelPrecision = 3.0;
            this.pinchPrecision = 2.0;
            this.keysUp = [38];
            this.keysDown = [40];
            this.keysLeft = [37];
            this.keysRight = [39];
            this.zoomOnFactor = 1;
            this.targetScreenOffset = BABYLON.Vector2.Zero();
            this._keys = [];
            this._viewMatrix = new BABYLON.Matrix();
            this.checkCollisions = false;
            this.collisionRadius = new BABYLON.Vector3(0.5, 0.5, 0.5);
            this._collider = new BABYLON.Collider();
            this._previousPosition = BABYLON.Vector3.Zero();
            this._collisionVelocity = BABYLON.Vector3.Zero();
            this._newPosition = BABYLON.Vector3.Zero();
            if (!this.target) {
                this.target = BABYLON.Vector3.Zero();
            }
            this.getViewMatrix();
        }
        ArcRotateCamera.prototype._getTargetPosition = function () {
            return this.target.position || this.target;
        };
        // Cache
        ArcRotateCamera.prototype._initCache = function () {
            _super.prototype._initCache.call(this);
            this._cache.target = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            this._cache.alpha = undefined;
            this._cache.beta = undefined;
            this._cache.radius = undefined;
            this._cache.targetScreenOffset = undefined;
        };
        ArcRotateCamera.prototype._updateCache = function (ignoreParentClass) {
            if (!ignoreParentClass) {
                _super.prototype._updateCache.call(this);
            }
            this._cache.target.copyFrom(this._getTargetPosition());
            this._cache.alpha = this.alpha;
            this._cache.beta = this.beta;
            this._cache.radius = this.radius;
            this._cache.targetScreenOffset = this.targetScreenOffset.clone();
        };
        // Synchronized
        ArcRotateCamera.prototype._isSynchronizedViewMatrix = function () {
            if (!_super.prototype._isSynchronizedViewMatrix.call(this))
                return false;
            return this._cache.target.equals(this._getTargetPosition()) && this._cache.alpha === this.alpha && this._cache.beta === this.beta && this._cache.radius === this.radius && this._cache.targetScreenOffset.equals(this.targetScreenOffset);
        };
        // Methods
        ArcRotateCamera.prototype.attachControl = function (element, noPreventDefault) {
            var _this = this;
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
                    pointers.add(evt.pointerId, { x: evt.clientX, y: evt.clientY, type: evt.pointerType });
                    cacheSoloPointer = pointers.item(evt.pointerId);
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };
                this._onPointerUp = function (evt) {
                    cacheSoloPointer = null;
                    previousPinchDistance = 0;
                    pointers.remove(evt.pointerId);
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };
                this._onPointerMove = function (evt) {
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                    switch (pointers.count) {
                        case 1:
                            //var offsetX = evt.clientX - pointers.item(evt.pointerId).x;
                            //var offsetY = evt.clientY - pointers.item(evt.pointerId).y;
                            var offsetX = evt.clientX - cacheSoloPointer.x;
                            var offsetY = evt.clientY - cacheSoloPointer.y;
                            _this.inertialAlphaOffset -= offsetX / _this.angularSensibility;
                            _this.inertialBetaOffset -= offsetY / _this.angularSensibility;
                            //pointers.item(evt.pointerId).x = evt.clientX;
                            //pointers.item(evt.pointerId).y = evt.clientY;
                            cacheSoloPointer.x = evt.clientX;
                            cacheSoloPointer.y = evt.clientY;
                            break;
                        case 2:
                            //if (noPreventDefault) { evt.preventDefault(); } //if pinch gesture, could be usefull to force preventDefault to avoid html page scroll/zoom in some mobile browsers
                            pointers.item(evt.pointerId).x = evt.clientX;
                            pointers.item(evt.pointerId).y = evt.clientY;
                            var direction = 1;
                            var distX = pointers.getItemByIndex(0).x - pointers.getItemByIndex(1).x;
                            var distY = pointers.getItemByIndex(0).y - pointers.getItemByIndex(1).y;
                            var pinchSquaredDistance = (distX * distX) + (distY * distY);
                            if (previousPinchDistance === 0) {
                                previousPinchDistance = pinchSquaredDistance;
                                return;
                            }
                            if (pinchSquaredDistance !== previousPinchDistance) {
                                if (pinchSquaredDistance > previousPinchDistance) {
                                    direction = -1;
                                }
                                _this.inertialRadiusOffset += (pinchSquaredDistance - previousPinchDistance) / (_this.pinchPrecision * _this.wheelPrecision * _this.angularSensibility);
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
                    _this.inertialAlphaOffset -= offsetX / _this.angularSensibility;
                    _this.inertialBetaOffset -= offsetY / _this.angularSensibility;
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
                    if (_this.keysUp.indexOf(evt.keyCode) !== -1 || _this.keysDown.indexOf(evt.keyCode) !== -1 || _this.keysLeft.indexOf(evt.keyCode) !== -1 || _this.keysRight.indexOf(evt.keyCode) !== -1) {
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
                    if (_this.keysUp.indexOf(evt.keyCode) !== -1 || _this.keysDown.indexOf(evt.keyCode) !== -1 || _this.keysLeft.indexOf(evt.keyCode) !== -1 || _this.keysRight.indexOf(evt.keyCode) !== -1) {
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
        ArcRotateCamera.prototype._update = function () {
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
            if (this.inertialAlphaOffset !== 0 || this.inertialBetaOffset !== 0 || this.inertialRadiusOffset != 0) {
                this.alpha += this.inertialAlphaOffset;
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
            // Limits
            if (this.lowerAlphaLimit && this.alpha < this.lowerAlphaLimit) {
                this.alpha = this.lowerAlphaLimit;
            }
            if (this.upperAlphaLimit && this.alpha > this.upperAlphaLimit) {
                this.alpha = this.upperAlphaLimit;
            }
            if (this.lowerBetaLimit && this.beta < this.lowerBetaLimit) {
                this.beta = this.lowerBetaLimit;
            }
            if (this.upperBetaLimit && this.beta > this.upperBetaLimit) {
                this.beta = this.upperBetaLimit;
            }
            if (this.lowerRadiusLimit && this.radius < this.lowerRadiusLimit) {
                this.radius = this.lowerRadiusLimit;
            }
            if (this.upperRadiusLimit && this.radius > this.upperRadiusLimit) {
                this.radius = this.upperRadiusLimit;
            }
        };
        ArcRotateCamera.prototype.setPosition = function (position) {
            var radiusv3 = position.subtract(this._getTargetPosition());
            this.radius = radiusv3.length();
            // Alpha
            this.alpha = Math.acos(radiusv3.x / Math.sqrt(Math.pow(radiusv3.x, 2) + Math.pow(radiusv3.z, 2)));
            if (radiusv3.z < 0) {
                this.alpha = 2 * Math.PI - this.alpha;
            }
            // Beta
            this.beta = Math.acos(radiusv3.y / this.radius);
        };
        ArcRotateCamera.prototype._getViewMatrix = function () {
            // Compute
            var cosa = Math.cos(this.alpha);
            var sina = Math.sin(this.alpha);
            var cosb = Math.cos(this.beta);
            var sinb = Math.sin(this.beta);
            var target = this._getTargetPosition();
            target.addToRef(new BABYLON.Vector3(this.radius * cosa * sinb, this.radius * cosb, this.radius * sina * sinb), this.position);
            if (this.checkCollisions) {
                this._collider.radius = this.collisionRadius;
                this.position.subtractToRef(this._previousPosition, this._collisionVelocity);
                this.getScene()._getNewPosition(this._previousPosition, this._collisionVelocity, this._collider, 3, this._newPosition);
                if (!this._newPosition.equalsWithEpsilon(this.position)) {
                    this.position.copyFrom(this._previousPosition);
                    this.alpha = this._previousAlpha;
                    this.beta = this._previousBeta;
                    this.radius = this._previousRadius;
                    if (this.onCollide) {
                        this.onCollide(this._collider.collidedMesh);
                    }
                }
            }
            BABYLON.Matrix.LookAtLHToRef(this.position, target, this.upVector, this._viewMatrix);
            this._previousAlpha = this.alpha;
            this._previousBeta = this.beta;
            this._previousRadius = this.radius;
            this._previousPosition.copyFrom(this.position);
            this._viewMatrix.m[12] += this.targetScreenOffset.x;
            this._viewMatrix.m[13] += this.targetScreenOffset.y;
            return this._viewMatrix;
        };
        ArcRotateCamera.prototype.zoomOn = function (meshes) {
            meshes = meshes || this.getScene().meshes;
            var minMaxVector = BABYLON.Mesh.MinMax(meshes);
            var distance = BABYLON.Vector3.Distance(minMaxVector.min, minMaxVector.max);
            this.radius = distance * this.zoomOnFactor;
            this.focusOn({ min: minMaxVector.min, max: minMaxVector.max, distance: distance });
        };
        ArcRotateCamera.prototype.focusOn = function (meshesOrMinMaxVectorAndDistance) {
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
            this.maxZ = distance * 2;
        };
        return ArcRotateCamera;
    })(BABYLON.Camera);
    BABYLON.ArcRotateCamera = ArcRotateCamera;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.arcRotateCamera.js.map