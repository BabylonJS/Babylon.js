var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var ComposableCameraKeyboardMoveInput = (function () {
        function ComposableCameraKeyboardMoveInput() {
            this._keys = [];
            this.keysUp = [38];
            this.keysDown = [40];
            this.keysLeft = [37];
            this.keysRight = [39];
        }
        ComposableCameraKeyboardMoveInput.prototype.attachCamera = function (camera) {
            var _this = this;
            this.camera = camera;
            if (this._onKeyDown === undefined) {
                this._onKeyDown = function (evt) {
                    if (_this.keysUp.indexOf(evt.keyCode) !== -1 ||
                        _this.keysDown.indexOf(evt.keyCode) !== -1 ||
                        _this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                        _this.keysRight.indexOf(evt.keyCode) !== -1) {
                        var index = _this._keys.indexOf(evt.keyCode);
                        if (index === -1) {
                            _this._keys.push(evt.keyCode);
                        }
                        if (!camera._noPreventDefault) {
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
                        if (!camera._noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                };
                BABYLON.Tools.RegisterTopRootEvents([
                    { name: "keydown", handler: this._onKeyDown },
                    { name: "keyup", handler: this._onKeyUp },
                    { name: "blur", handler: this._onLostFocus }
                ]);
            }
        };
        ComposableCameraKeyboardMoveInput.prototype.detach = function () {
            BABYLON.Tools.UnregisterTopRootEvents([
                { name: "keydown", handler: this._onKeyDown },
                { name: "keyup", handler: this._onKeyUp },
                { name: "blur", handler: this._onLostFocus }
            ]);
        };
        ComposableCameraKeyboardMoveInput.prototype.checkInputs = function () {
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
                camera.getViewMatrix().invertToRef(camera._cameraTransformMatrix);
                BABYLON.Vector3.TransformNormalToRef(camera._localDirection, camera._cameraTransformMatrix, camera._transformedDirection);
                camera.cameraDirection.addInPlace(camera._transformedDirection);
            }
        };
        ComposableCameraKeyboardMoveInput.prototype.getTypeName = function () {
            return "keyboardmove";
        };
        ComposableCameraKeyboardMoveInput.prototype._onLostFocus = function (e) {
            this._keys = [];
        };
        __decorate([
            BABYLON.serialize()
        ], ComposableCameraKeyboardMoveInput.prototype, "keysUp", void 0);
        __decorate([
            BABYLON.serialize()
        ], ComposableCameraKeyboardMoveInput.prototype, "keysDown", void 0);
        __decorate([
            BABYLON.serialize()
        ], ComposableCameraKeyboardMoveInput.prototype, "keysLeft", void 0);
        __decorate([
            BABYLON.serialize()
        ], ComposableCameraKeyboardMoveInput.prototype, "keysRight", void 0);
        return ComposableCameraKeyboardMoveInput;
    }());
    BABYLON.ComposableCameraKeyboardMoveInput = ComposableCameraKeyboardMoveInput;
})(BABYLON || (BABYLON = {}));
