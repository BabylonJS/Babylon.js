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
            this.angularSensibilityX = 1000.0;
            this.angularSensibilityY = 1000.0;
            this.pinchPrecision = 6.0;
            this.panningSensibility = 50.0;
            this._isRightClick = false;
            this._isCtrlPushed = false;
            this.pinchInwards = true;
        }
        ArcRotateCameraPointersInput.prototype.attachControl = function (element, noPreventDefault) {
            var _this = this;
            var engine = this.camera.getEngine();
            var cacheSoloPointer; // cache pointer object for better perf on camera rotation
            var pointers = new BABYLON.SmartCollection();
            var previousPinchDistance = 0;
            this._pointerInput = function (p, s) {
                var evt = p.event;
                if (p.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                    try {
                        evt.srcElement.setPointerCapture(evt.pointerId);
                    }
                    catch (e) {
                    }
                    // Manage panning with right click
                    _this._isRightClick = evt.button === 2;
                    // manage pointers
                    pointers.add(evt.pointerId, { x: evt.clientX, y: evt.clientY, type: evt.pointerType });
                    cacheSoloPointer = pointers.item(evt.pointerId);
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                }
                else if (p.type === BABYLON.PointerEventTypes.POINTERUP) {
                    try {
                        evt.srcElement.releasePointerCapture(evt.pointerId);
                    }
                    catch (e) {
                    }
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
                }
                else if (p.type === BABYLON.PointerEventTypes.POINTERMOVE) {
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
                }
            };
            this._observer = this.camera.getScene().onPointerObservable.add(this._pointerInput, BABYLON.PointerEventTypes.POINTERDOWN | BABYLON.PointerEventTypes.POINTERUP | BABYLON.PointerEventTypes.POINTERMOVE);
            this._onContextMenu = function (evt) {
                evt.preventDefault();
            };
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
            element.addEventListener("mousemove", this._onMouseMove, false);
            element.addEventListener("MSPointerDown", this._onGestureStart, false);
            element.addEventListener("MSGestureChange", this._onGesture, false);
            BABYLON.Tools.RegisterTopRootEvents([
                { name: "keydown", handler: this._onKeyDown },
                { name: "keyup", handler: this._onKeyUp },
                { name: "blur", handler: this._onLostFocus }
            ]);
        };
        ArcRotateCameraPointersInput.prototype.detachControl = function (element) {
            if (element && this._observer) {
                this.camera.getScene().onPointerObservable.remove(this._observer);
                this._observer = null;
                element.removeEventListener("contextmenu", this._onContextMenu);
                element.removeEventListener("mousemove", this._onMouseMove);
                element.removeEventListener("MSPointerDown", this._onGestureStart);
                element.removeEventListener("MSGestureChange", this._onGesture);
                this._isRightClick = false;
                this._isCtrlPushed = false;
                this.pinchInwards = true;
                this._onKeyDown = null;
                this._onKeyUp = null;
                this._onMouseMove = null;
                this._onGestureStart = null;
                this._onGesture = null;
                this._MSGestureHandler = null;
                this._onLostFocus = null;
                this._onContextMenu = null;
            }
            BABYLON.Tools.UnregisterTopRootEvents([
                { name: "keydown", handler: this._onKeyDown },
                { name: "keyup", handler: this._onKeyUp },
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
