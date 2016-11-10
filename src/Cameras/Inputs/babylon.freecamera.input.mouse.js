var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var FreeCameraMouseInput = (function () {
        function FreeCameraMouseInput(touchEnabled) {
            if (touchEnabled === void 0) { touchEnabled = true; }
            this.touchEnabled = touchEnabled;
            this.buttons = [0, 1, 2];
            this.angularSensibility = 2000.0;
        }
        FreeCameraMouseInput.prototype.attachControl = function (element, noPreventDefault) {
            var _this = this;
            var engine = this.camera.getEngine();
            if (!this._pointerInput) {
                this._pointerInput = function (p, s) {
                    var evt = p.event;
                    if (!_this.touchEnabled && evt.pointerType === "touch") {
                        return;
                    }
                    if (p.type !== BABYLON.PointerEventTypes.POINTERMOVE && _this.buttons.indexOf(evt.button) === -1) {
                        return;
                    }
                    if (p.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                        try {
                            evt.srcElement.setPointerCapture(evt.pointerId);
                        }
                        catch (e) {
                        }
                        _this.previousPosition = {
                            x: evt.clientX,
                            y: evt.clientY
                        };
                        if (!noPreventDefault) {
                            evt.preventDefault();
                            element.focus();
                        }
                    }
                    else if (p.type === BABYLON.PointerEventTypes.POINTERUP) {
                        try {
                            evt.srcElement.releasePointerCapture(evt.pointerId);
                        }
                        catch (e) {
                        }
                        _this.previousPosition = null;
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                    else if (p.type === BABYLON.PointerEventTypes.POINTERMOVE) {
                        if (!_this.previousPosition || engine.isPointerLock) {
                            return;
                        }
                        var offsetX = evt.clientX - _this.previousPosition.x;
                        var offsetY = evt.clientY - _this.previousPosition.y;
                        if (_this.camera.getScene().useRightHandedSystem) {
                            _this.camera.cameraRotation.y -= offsetX / _this.angularSensibility;
                        }
                        else {
                            _this.camera.cameraRotation.y += offsetX / _this.angularSensibility;
                        }
                        _this.camera.cameraRotation.x += offsetY / _this.angularSensibility;
                        _this.previousPosition = {
                            x: evt.clientX,
                            y: evt.clientY
                        };
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                };
            }
            this._onMouseMove = function (evt) {
                if (!engine.isPointerLock) {
                    return;
                }
                var offsetX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || evt.msMovementX || 0;
                var offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;
                if (_this.camera.getScene().useRightHandedSystem) {
                    _this.camera.cameraRotation.y -= offsetX / _this.angularSensibility;
                }
                else {
                    _this.camera.cameraRotation.y += offsetX / _this.angularSensibility;
                }
                _this.camera.cameraRotation.x += offsetY / _this.angularSensibility;
                _this.previousPosition = null;
                if (!noPreventDefault) {
                    evt.preventDefault();
                }
            };
            this._observer = this.camera.getScene().onPointerObservable.add(this._pointerInput, BABYLON.PointerEventTypes.POINTERDOWN | BABYLON.PointerEventTypes.POINTERUP | BABYLON.PointerEventTypes.POINTERMOVE);
            element.addEventListener("mousemove", this._onMouseMove, false);
        };
        FreeCameraMouseInput.prototype.detachControl = function (element) {
            if (this._observer && element) {
                this.camera.getScene().onPointerObservable.remove(this._observer);
                element.removeEventListener("mousemove", this._onMouseMove);
                this._observer = null;
                this._onMouseMove = null;
                this.previousPosition = null;
            }
        };
        FreeCameraMouseInput.prototype.getTypeName = function () {
            return "FreeCameraMouseInput";
        };
        FreeCameraMouseInput.prototype.getSimpleName = function () {
            return "mouse";
        };
        __decorate([
            BABYLON.serialize()
        ], FreeCameraMouseInput.prototype, "buttons", void 0);
        __decorate([
            BABYLON.serialize()
        ], FreeCameraMouseInput.prototype, "angularSensibility", void 0);
        return FreeCameraMouseInput;
    }());
    BABYLON.FreeCameraMouseInput = FreeCameraMouseInput;
    BABYLON.CameraInputTypes["FreeCameraMouseInput"] = FreeCameraMouseInput;
})(BABYLON || (BABYLON = {}));
