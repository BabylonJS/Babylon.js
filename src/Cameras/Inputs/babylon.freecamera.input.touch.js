var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var FreeCameraTouchInput = (function () {
        function FreeCameraTouchInput() {
            this._offsetX = null;
            this._offsetY = null;
            this._pointerCount = 0;
            this._pointerPressed = [];
            this.touchAngularSensibility = 200000.0;
            this.touchMoveSensibility = 250.0;
        }
        FreeCameraTouchInput.prototype.attachControl = function (element, noPreventDefault) {
            var _this = this;
            var previousPosition;
            if (this._pointerInput === undefined) {
                this._onLostFocus = function (evt) {
                    _this._offsetX = null;
                    _this._offsetY = null;
                };
                this._pointerInput = function (p, s) {
                    var evt = p.event;
                    if (evt.pointerType === "mouse") {
                        return;
                    }
                    if (p.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                        _this._pointerPressed.push(evt.pointerId);
                        if (_this._pointerPressed.length !== 1) {
                            return;
                        }
                        previousPosition = {
                            x: evt.clientX,
                            y: evt.clientY
                        };
                    }
                    else if (p.type === BABYLON.PointerEventTypes.POINTERUP) {
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                        var index = _this._pointerPressed.indexOf(evt.pointerId);
                        if (index === -1) {
                            return;
                        }
                        _this._pointerPressed.splice(index, 1);
                        if (index != 0) {
                            return;
                        }
                        previousPosition = null;
                        _this._offsetX = null;
                        _this._offsetY = null;
                    }
                    else if (p.type === BABYLON.PointerEventTypes.POINTERMOVE) {
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                        if (!previousPosition) {
                            return;
                        }
                        var index = _this._pointerPressed.indexOf(evt.pointerId);
                        if (index != 0) {
                            return;
                        }
                        _this._offsetX = evt.clientX - previousPosition.x;
                        _this._offsetY = -(evt.clientY - previousPosition.y);
                    }
                };
            }
            this._observer = this.camera.getScene().onPointerObservable.add(this._pointerInput, BABYLON.PointerEventTypes.POINTERDOWN | BABYLON.PointerEventTypes.POINTERUP | BABYLON.PointerEventTypes.POINTERMOVE);
            element.addEventListener("blur", this._onLostFocus);
        };
        FreeCameraTouchInput.prototype.detachControl = function (element) {
            if (this._pointerInput && element) {
                this.camera.getScene().onPointerObservable.remove(this._observer);
                this._observer = null;
                element.removeEventListener("blur", this._onLostFocus);
                this._onLostFocus = null;
                this._pointerPressed = [];
                this._offsetX = null;
                this._offsetY = null;
                this._pointerCount = 0;
            }
        };
        FreeCameraTouchInput.prototype.checkInputs = function () {
            if (this._offsetX) {
                var camera = this.camera;
                camera.cameraRotation.y += this._offsetX / this.touchAngularSensibility;
                if (this._pointerPressed.length > 1) {
                    camera.cameraRotation.x += -this._offsetY / this.touchAngularSensibility;
                }
                else {
                    var speed = camera._computeLocalCameraSpeed();
                    var direction = new BABYLON.Vector3(0, 0, speed * this._offsetY / this.touchMoveSensibility);
                    BABYLON.Matrix.RotationYawPitchRollToRef(camera.rotation.y, camera.rotation.x, 0, camera._cameraRotationMatrix);
                    camera.cameraDirection.addInPlace(BABYLON.Vector3.TransformCoordinates(direction, camera._cameraRotationMatrix));
                }
            }
        };
        FreeCameraTouchInput.prototype.getTypeName = function () {
            return "FreeCameraTouchInput";
        };
        FreeCameraTouchInput.prototype.getSimpleName = function () {
            return "touch";
        };
        __decorate([
            BABYLON.serialize()
        ], FreeCameraTouchInput.prototype, "touchAngularSensibility", void 0);
        __decorate([
            BABYLON.serialize()
        ], FreeCameraTouchInput.prototype, "touchMoveSensibility", void 0);
        return FreeCameraTouchInput;
    }());
    BABYLON.FreeCameraTouchInput = FreeCameraTouchInput;
    BABYLON.CameraInputTypes["FreeCameraTouchInput"] = FreeCameraTouchInput;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.freecamera.input.touch.js.map