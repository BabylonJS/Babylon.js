var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var FreeCameraMouseInput = (function () {
        function FreeCameraMouseInput() {
            this.angularSensibility = 2000.0;
        }
        FreeCameraMouseInput.prototype.attachCamera = function (camera) {
            this.camera = camera;
        };
        FreeCameraMouseInput.prototype.attachElement = function (element, noPreventDefault) {
            var _this = this;
            var previousPosition;
            this.attachedElement = element;
            if (this._onMouseDown === undefined) {
                var camera = this.camera;
                var engine = this.camera.getEngine();
                this._onMouseDown = function (evt) {
                    previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY
                    };
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };
                this._onMouseUp = function (evt) {
                    previousPosition = null;
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };
                this._onMouseOut = function (evt) {
                    previousPosition = null;
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };
                this._onMouseMove = function (evt) {
                    if (!previousPosition && !engine.isPointerLock) {
                        return;
                    }
                    var offsetX;
                    var offsetY;
                    if (!engine.isPointerLock) {
                        offsetX = evt.clientX - previousPosition.x;
                        offsetY = evt.clientY - previousPosition.y;
                    }
                    else {
                        offsetX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || evt.msMovementX || 0;
                        offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;
                    }
                    camera.cameraRotation.y += offsetX / _this.angularSensibility;
                    camera.cameraRotation.x += offsetY / _this.angularSensibility;
                    previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY
                    };
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };
            }
            element.addEventListener("mousedown", this._onMouseDown, false);
            element.addEventListener("mouseup", this._onMouseUp, false);
            element.addEventListener("mouseout", this._onMouseOut, false);
            element.addEventListener("mousemove", this._onMouseMove, false);
        };
        FreeCameraMouseInput.prototype.detachElement = function (element) {
            if (this.attachedElement !== element) {
                return;
            }
            element.removeEventListener("mousedown", this._onMouseDown);
            element.removeEventListener("mouseup", this._onMouseUp);
            element.removeEventListener("mouseout", this._onMouseOut);
            element.removeEventListener("mousemove", this._onMouseMove);
            this.attachedElement = null;
        };
        FreeCameraMouseInput.prototype.detach = function () {
            if (this.attachedElement) {
                this.detachElement(this.attachedElement);
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
    })();
    BABYLON.FreeCameraMouseInput = FreeCameraMouseInput;
    BABYLON.CameraInputTypes["FreeCameraMouseInput"] = FreeCameraMouseInput;
})(BABYLON || (BABYLON = {}));
