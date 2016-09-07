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
            this.angularSensibility = 2000.0;
        }
        FreeCameraMouseInput.prototype.attachControl = function (element, noPreventDefault) {
            var _this = this;
            if (!this._pointerInput) {
                var camera = this.camera;
                var engine = this.camera.getEngine();
                this._pointerInput = function (p, s) {
                    var evt = p.event;
                    if (!_this.touchEnabled && evt.pointerType === "touch") {
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
                        if (!_this.previousPosition && !engine.isPointerLock) {
                            return;
                        }
                        var offsetX;
                        var offsetY;
                        if (!engine.isPointerLock) {
                            offsetX = evt.clientX - _this.previousPosition.x;
                            offsetY = evt.clientY - _this.previousPosition.y;
                        }
                        else {
                            offsetX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || evt.msMovementX || 0;
                            offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;
                        }
                        camera.cameraRotation.y += offsetX / _this.angularSensibility;
                        camera.cameraRotation.x += offsetY / _this.angularSensibility;
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
            this._observer = this.camera.getScene().onPointerObservable.add(this._pointerInput, BABYLON.PointerEventTypes.POINTERDOWN | BABYLON.PointerEventTypes.POINTERUP | BABYLON.PointerEventTypes.POINTERMOVE);
        };
        FreeCameraMouseInput.prototype.detachControl = function (element) {
            if (this._observer && element) {
                this.camera.getScene().onPointerObservable.remove(this._observer);
                this._observer = null;
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
        ], FreeCameraMouseInput.prototype, "angularSensibility", void 0);
        return FreeCameraMouseInput;
    }());
    BABYLON.FreeCameraMouseInput = FreeCameraMouseInput;
    BABYLON.CameraInputTypes["FreeCameraMouseInput"] = FreeCameraMouseInput;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.freecamera.input.mouse.js.map