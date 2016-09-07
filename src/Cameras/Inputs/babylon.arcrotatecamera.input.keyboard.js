var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var ArcRotateCameraKeyboardMoveInput = (function () {
        function ArcRotateCameraKeyboardMoveInput() {
            this._keys = [];
            this.keysUp = [38];
            this.keysDown = [40];
            this.keysLeft = [37];
            this.keysRight = [39];
        }
        ArcRotateCameraKeyboardMoveInput.prototype.attachControl = function (element, noPreventDefault) {
            var _this = this;
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
            };
            element.addEventListener("keydown", this._onKeyDown, false);
            element.addEventListener("keyup", this._onKeyUp, false);
            BABYLON.Tools.RegisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);
        };
        ArcRotateCameraKeyboardMoveInput.prototype.detachControl = function (element) {
            if (element) {
                element.removeEventListener("keydown", this._onKeyDown);
                element.removeEventListener("keyup", this._onKeyUp);
            }
            BABYLON.Tools.UnregisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);
            this._keys = [];
            this._onKeyDown = null;
            this._onKeyUp = null;
            this._onLostFocus = null;
        };
        ArcRotateCameraKeyboardMoveInput.prototype.checkInputs = function () {
            if (this._onKeyDown) {
                var camera = this.camera;
                for (var index = 0; index < this._keys.length; index++) {
                    var keyCode = this._keys[index];
                    if (this.keysLeft.indexOf(keyCode) !== -1) {
                        camera.inertialAlphaOffset -= 0.01;
                    }
                    else if (this.keysUp.indexOf(keyCode) !== -1) {
                        camera.inertialBetaOffset -= 0.01;
                    }
                    else if (this.keysRight.indexOf(keyCode) !== -1) {
                        camera.inertialAlphaOffset += 0.01;
                    }
                    else if (this.keysDown.indexOf(keyCode) !== -1) {
                        camera.inertialBetaOffset += 0.01;
                    }
                }
            }
        };
        ArcRotateCameraKeyboardMoveInput.prototype.getTypeName = function () {
            return "ArcRotateCameraKeyboardMoveInput";
        };
        ArcRotateCameraKeyboardMoveInput.prototype.getSimpleName = function () {
            return "keyboard";
        };
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCameraKeyboardMoveInput.prototype, "keysUp", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCameraKeyboardMoveInput.prototype, "keysDown", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCameraKeyboardMoveInput.prototype, "keysLeft", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCameraKeyboardMoveInput.prototype, "keysRight", void 0);
        return ArcRotateCameraKeyboardMoveInput;
    }());
    BABYLON.ArcRotateCameraKeyboardMoveInput = ArcRotateCameraKeyboardMoveInput;
    BABYLON.CameraInputTypes["ArcRotateCameraKeyboardMoveInput"] = ArcRotateCameraKeyboardMoveInput;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.arcrotatecamera.input.keyboard.js.map