var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var FreeCameraKeyboardMoveInput = (function () {
        function FreeCameraKeyboardMoveInput() {
            this._keys = [];
            this.keysUp = [38];
            this.keysDown = [40];
            this.keysLeft = [37];
            this.keysRight = [39];
        }
        FreeCameraKeyboardMoveInput.prototype.attachControl = function (element, noPreventDefault) {
            var _this = this;
            if (!this._onKeyDown) {
                element.tabIndex = 1;
                this._onKeyDown = function (evt) {
                    if (_this.keysUp.indexOf(evt.keyCode) !== -1 ||
                        _this.keysDown.indexOf(evt.keyCode) !== -1 ||
                        _this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                        _this.keysRight.indexOf(evt.keyCode) !== -1) {
                        var index = _this._keys.indexOf(evt.keyCode);
                        if (index === -1) {
                            _this._keys.push(evt.keyCode);
                        }
                        if (!noPreventDefault) {
                            evt.preventDefault();
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
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                };
                element.addEventListener("keydown", this._onKeyDown, false);
                element.addEventListener("keyup", this._onKeyUp, false);
                BABYLON.Tools.RegisterTopRootEvents([
                    { name: "blur", handler: this._onLostFocus }
                ]);
            }
        };
        FreeCameraKeyboardMoveInput.prototype.detachControl = function (element) {
            if (this._onKeyDown) {
                element.removeEventListener("keydown", this._onKeyDown);
                element.removeEventListener("keyup", this._onKeyUp);
                BABYLON.Tools.UnregisterTopRootEvents([
                    { name: "blur", handler: this._onLostFocus }
                ]);
                this._keys = [];
                this._onKeyDown = null;
                this._onKeyUp = null;
            }
        };
        FreeCameraKeyboardMoveInput.prototype.checkInputs = function () {
            if (this._onKeyDown) {
                var camera = this.camera;
                // Keyboard
                for (var index = 0; index < this._keys.length; index++) {
                    var keyCode = this._keys[index];
                    var speed = camera._computeLocalCameraSpeed();
                    if (this.keysLeft.indexOf(keyCode) !== -1) {
                        camera._localDirection.copyFromFloats(-speed, 0, 0);
                    }
                    else if (this.keysUp.indexOf(keyCode) !== -1) {
                        camera._localDirection.copyFromFloats(0, 0, speed);
                    }
                    else if (this.keysRight.indexOf(keyCode) !== -1) {
                        camera._localDirection.copyFromFloats(speed, 0, 0);
                    }
                    else if (this.keysDown.indexOf(keyCode) !== -1) {
                        camera._localDirection.copyFromFloats(0, 0, -speed);
                    }
                    if (camera.getScene().useRightHandedSystem) {
                        camera._localDirection.z *= -1;
                    }
                    camera.getViewMatrix().invertToRef(camera._cameraTransformMatrix);
                    BABYLON.Vector3.TransformNormalToRef(camera._localDirection, camera._cameraTransformMatrix, camera._transformedDirection);
                    camera.cameraDirection.addInPlace(camera._transformedDirection);
                }
            }
        };
        FreeCameraKeyboardMoveInput.prototype.getTypeName = function () {
            return "FreeCameraKeyboardMoveInput";
        };
        FreeCameraKeyboardMoveInput.prototype._onLostFocus = function (e) {
            this._keys = [];
        };
        FreeCameraKeyboardMoveInput.prototype.getSimpleName = function () {
            return "keyboard";
        };
        __decorate([
            BABYLON.serialize()
        ], FreeCameraKeyboardMoveInput.prototype, "keysUp", void 0);
        __decorate([
            BABYLON.serialize()
        ], FreeCameraKeyboardMoveInput.prototype, "keysDown", void 0);
        __decorate([
            BABYLON.serialize()
        ], FreeCameraKeyboardMoveInput.prototype, "keysLeft", void 0);
        __decorate([
            BABYLON.serialize()
        ], FreeCameraKeyboardMoveInput.prototype, "keysRight", void 0);
        return FreeCameraKeyboardMoveInput;
    }());
    BABYLON.FreeCameraKeyboardMoveInput = FreeCameraKeyboardMoveInput;
    BABYLON.CameraInputTypes["FreeCameraKeyboardMoveInput"] = FreeCameraKeyboardMoveInput;
})(BABYLON || (BABYLON = {}));
