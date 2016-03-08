var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var eventPrefix = BABYLON.Tools.GetPointerPrefix();
    var ArcRotateCameraPointersInput = (function () {
        function ArcRotateCameraPointersInput() {
            this._isRightClick = false;
            this._isCtrlPushed = false;
            this.pinchInwards = true;
            this.angularSensibilityX = 1000.0;
            this.angularSensibilityY = 1000.0;
            this.pinchPrecision = 6.0;
            this.panningSensibility = 50.0;
        }
        ArcRotateCameraPointersInput.prototype.attachCamera = function (camera) {
            this.camera = camera;
        };
        ArcRotateCameraPointersInput.prototype.attachElement = function (element, noPreventDefault) {
            var _this = this;
            this.attachedElement = element;
            var engine = this.camera.getEngine();
            var cacheSoloPointer; // cache pointer object for better perf on camera rotation
            var pointers = new BABYLON.SmartCollection();
            var previousPinchDistance = 0;
            if (this._onPointerDown === undefined) {
                if (!this.camera._useCtrlForPanning) {
                    element.addEventListener("contextmenu", this._onContextMenu, false);
                }
                this._onLostFocus = function () {
                    //this._keys = [];
                    pointers.empty();
                    previousPinchDistance = 0;
                    cacheSoloPointer = null;
                };
                this._onKeyDown = function (evt) {
                    _this._isCtrlPushed = evt.ctrlKey;
                };
                this._onKeyUp = function (evt) {
                    _this._isCtrlPushed = evt.ctrlKey;
                };
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
                            if (_this.panningSensibility !== 0 && ((_this._isCtrlPushed && _this.camera._useCtrlForPanning) || (!_this.camera._useCtrlForPanning && _this._isRightClick))) {
                                _this.camera.inertialPanningX += -(evt.clientX - cacheSoloPointer.x) / _this.panningSensibility;
                                _this.camera.inertialPanningY += (evt.clientY - cacheSoloPointer.y) / _this.panningSensibility;
                            }
                            else {
                                var offsetX = evt.clientX - cacheSoloPointer.x;
                                var offsetY = evt.clientY - cacheSoloPointer.y;
                                _this.camera.inertialAlphaOffset -= offsetX / _this.angularSensibilityX;
                                _this.camera.inertialBetaOffset -= offsetY / _this.angularSensibilityY;
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
                                _this.camera.inertialRadiusOffset += (pinchSquaredDistance - previousPinchDistance) / (_this.pinchPrecision * ((_this.angularSensibilityX + _this.angularSensibilityY) / 2) * direction);
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
                    _this.camera.inertialAlphaOffset -= offsetX / _this.angularSensibilityX;
                    _this.camera.inertialBetaOffset -= offsetY / _this.angularSensibilityY;
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
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
                    _this.camera.radius *= e.scale;
                    if (e.preventDefault) {
                        if (!noPreventDefault) {
                            e.stopPropagation();
                            e.preventDefault();
                        }
                    }
                };
            }
            this.attachedElement.addEventListener(eventPrefix + "down", this._onPointerDown, false);
            this.attachedElement.addEventListener(eventPrefix + "up", this._onPointerUp, false);
            this.attachedElement.addEventListener(eventPrefix + "out", this._onPointerUp, false);
            this.attachedElement.addEventListener(eventPrefix + "move", this._onPointerMove, false);
            this.attachedElement.addEventListener("mousemove", this._onMouseMove, false);
            this.attachedElement.addEventListener("MSPointerDown", this._onGestureStart, false);
            this.attachedElement.addEventListener("MSGestureChange", this._onGesture, false);
            BABYLON.Tools.RegisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);
        };
        ArcRotateCameraPointersInput.prototype.detach = function () {
            this._MSGestureHandler = null;
            this.attachedElement.removeEventListener("contextmenu", this._onContextMenu);
            this.attachedElement.removeEventListener(eventPrefix + "down", this._onPointerDown);
            this.attachedElement.removeEventListener(eventPrefix + "up", this._onPointerUp);
            this.attachedElement.removeEventListener(eventPrefix + "out", this._onPointerUp);
            this.attachedElement.removeEventListener(eventPrefix + "move", this._onPointerMove);
            this.attachedElement.removeEventListener("mousemove", this._onMouseMove);
            this.attachedElement.removeEventListener("MSPointerDown", this._onGestureStart);
            this.attachedElement.removeEventListener("MSGestureChange", this._onGesture);
            BABYLON.Tools.UnregisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);
        };
        ArcRotateCameraPointersInput.prototype.getTypeName = function () {
            return "ArcRotateCameraPointersInput";
        };
        ArcRotateCameraPointersInput.prototype.getSimpleName = function () {
            return "pointers";
        };
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCameraPointersInput.prototype, "angularSensibilityX", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCameraPointersInput.prototype, "angularSensibilityY", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCameraPointersInput.prototype, "pinchPrecision", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCameraPointersInput.prototype, "panningSensibility", void 0);
        return ArcRotateCameraPointersInput;
    }());
    BABYLON.ArcRotateCameraPointersInput = ArcRotateCameraPointersInput;
    BABYLON.CameraInputTypes["ArcRotateCameraPointersInput"] = ArcRotateCameraPointersInput;
})(BABYLON || (BABYLON = {}));
