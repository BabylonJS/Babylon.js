var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var eventPrefix = BABYLON.Tools.GetPointerPrefix();
    var MapPanCamera = (function (_super) {
        __extends(MapPanCamera, _super);
        function MapPanCamera(name, beta, radius, target, scene) {
            _super.call(this, name, BABYLON.Vector3.Zero(), scene);
            this.beta = beta;
            this.radius = radius;
            this.target = target;
            this.inertialRadiusOffset = 0;
            this.lowerRadiusLimit = null;
            this.upperRadiusLimit = null;
            this.wheelPrecision = 3.0;
            this.pinchPrecision = 2.0;
            this.panningSensibility = 50.0;
            this.inertialPanningX = 0;
            this.inertialPanningZ = 0;
            this.keysUp = [38];
            this.keysDown = [40];
            this.keysLeft = [37];
            this.keysRight = [39];
            this.zoomOnFactor = 1;
            this._keys = [];
            this._viewMatrix = new BABYLON.Matrix();
            if (!this.target) {
                this.target = BABYLON.Vector3.Zero();
            }
            this.getViewMatrix();
        }
        MapPanCamera.prototype._getTargetPosition = function () {
            return this.target.position || this.target;
        };
        // Cache
        MapPanCamera.prototype._initCache = function () {
            _super.prototype._initCache.call(this);
            this._cache.target = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            this._cache.radius = undefined;
        };
        MapPanCamera.prototype._updateCache = function (ignoreParentClass) {
            if (!ignoreParentClass) {
                _super.prototype._updateCache.call(this);
            }
            this._cache.target.copyFrom(this._getTargetPosition());
            this._cache.radius = this.radius;
        };
        // Synchronized
        MapPanCamera.prototype._isSynchronizedViewMatrix = function () {
            if (!_super.prototype._isSynchronizedViewMatrix.call(this))
                return false;
            return this._cache.target.equals(this._getTargetPosition())
                && this._cache.radius === this.radius;
        };
        // Methods
        MapPanCamera.prototype.attachControl = function (element, noPreventDefault) {
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
                this._onPointerMove = function (evt) {
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                    switch (pointers.count) {
                        case 1:
                            _this.inertialPanningX -= -(evt.clientX - cacheSoloPointer.x) / _this.panningSensibility;
                            _this.inertialPanningZ -= (evt.clientY - cacheSoloPointer.y) / _this.panningSensibility;
                            cacheSoloPointer.x = evt.clientX;
                            cacheSoloPointer.y = evt.clientY;
                            break;
                        case 2:
                            //if (noPreventDefault) { evt.preventDefault(); } //if pinch gesture, could be usefull to force preventDefault to avoid html page scroll/zoom in some mobile browsers
                            pointers.item(evt.pointerId).x = evt.clientX;
                            pointers.item(evt.pointerId).y = evt.clientY;
                            var distX = pointers.getItemByIndex(0).x - pointers.getItemByIndex(1).x;
                            var distY = pointers.getItemByIndex(0).y - pointers.getItemByIndex(1).y;
                            var pinchSquaredDistance = (distX * distX) + (distY * distY);
                            if (previousPinchDistance === 0) {
                                previousPinchDistance = pinchSquaredDistance;
                                return;
                            }
                            if (pinchSquaredDistance !== previousPinchDistance) {
                                _this.inertialRadiusOffset += (pinchSquaredDistance - previousPinchDistance) / (_this.pinchPrecision * _this.wheelPrecision * 1000);
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
                    _this.inertialPanningX -= offsetX / _this.panningSensibility;
                    _this.inertialPanningZ -= offsetY / _this.panningSensibility;
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
                    _this.inertialRadiusOffset = 0;
                    _this.inertialPanningX = 0;
                    _this.inertialPanningZ = 0;
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
        MapPanCamera.prototype.detachControl = function (element) {
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
        MapPanCamera.prototype._checkInputs = function () {
            // Keyboard
            for (var index = 0; index < this._keys.length; index++) {
                var keyCode = this._keys[index];
                if (this.keysLeft.indexOf(keyCode) !== -1) {
                    this.inertialPanningX += 0.01;
                }
                else if (this.keysUp.indexOf(keyCode) !== -1) {
                    this.inertialPanningZ -= 0.01;
                }
                else if (this.keysRight.indexOf(keyCode) !== -1) {
                    this.inertialPanningX -= 0.01;
                }
                else if (this.keysDown.indexOf(keyCode) !== -1) {
                    this.inertialPanningZ += 0.01;
                }
            }
            // Radius Inertia
            if (this.inertialRadiusOffset !== 0) {
                this.radius -= this.inertialRadiusOffset;
                this.inertialRadiusOffset *= this.inertia;
                if (Math.abs(this.inertialRadiusOffset) < BABYLON.Engine.Epsilon)
                    this.inertialRadiusOffset = 0;
            }
            // Panning inertia
            if (this.inertialPanningX !== 0 || this.inertialPanningZ !== 0) {
                if (!this._localDirection) {
                    this._localDirection = BABYLON.Vector3.Zero();
                }
                this.inertialPanningX *= this.inertia;
                this.inertialPanningZ *= this.inertia;
                if (Math.abs(this.inertialPanningX) < BABYLON.Engine.Epsilon)
                    this.inertialPanningX = 0;
                if (Math.abs(this.inertialPanningZ) < BABYLON.Engine.Epsilon)
                    this.inertialPanningZ = 0;
                this._localDirection.copyFromFloats(this.inertialPanningX, 0, this.inertialPanningZ);
                this.target.addInPlace(this._localDirection);
            }
            // Limits
            this._checkLimits();
            _super.prototype._checkInputs.call(this);
        };
        MapPanCamera.prototype._checkLimits = function () {
            if (this.beta > Math.PI) {
                this.beta = this.beta - (2 * Math.PI);
            }
            if (this.beta < 0) {
                this.beta = 0;
            }
            if (this.lowerRadiusLimit && this.radius < this.lowerRadiusLimit) {
                this.radius = this.lowerRadiusLimit;
            }
            if (this.upperRadiusLimit && this.radius > this.upperRadiusLimit) {
                this.radius = this.upperRadiusLimit;
            }
        };
        MapPanCamera.prototype.setTarget = function (target) {
            this.target = target;
        };
        MapPanCamera.prototype._getViewMatrix = function () {
            // Compute
            var cosb = Math.cos(this.beta);
            var sinb = Math.sin(this.beta);
            var target = this._getTargetPosition();
            target.subtractFromFloatsToRef(0, -this.radius * cosb, -this.radius * sinb, this.position);
            BABYLON.Matrix.LookAtLHToRef(this.position, target, this.upVector, this._viewMatrix);
            return this._viewMatrix;
        };
        return MapPanCamera;
    })(BABYLON.TargetCamera);
    BABYLON.MapPanCamera = MapPanCamera;
})(BABYLON || (BABYLON = {}));
