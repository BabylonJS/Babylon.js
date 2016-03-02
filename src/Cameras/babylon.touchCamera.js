var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    // We're mainly based on the logic defined into the FreeCamera code
    var TouchCamera = (function (_super) {
        __extends(TouchCamera, _super);
        function TouchCamera(name, position, scene) {
            _super.call(this, name, position, scene);
            this._offsetX = null;
            this._offsetY = null;
            this._pointerCount = 0;
            this._pointerPressed = [];
            this.touchAngularSensibility = 200000.0;
            this.touchMoveSensibility = 250.0;
        }
        TouchCamera.prototype._onLostFocus = function (e) {
            this._offsetX = null;
            this._offsetY = null;
            _super.prototype._onLostFocus.call(this, e);
        };
        TouchCamera.prototype.attachControl = function (canvas, noPreventDefault) {
            var _this = this;
            var previousPosition;
            if (this._attachedCanvas) {
                return;
            }
            if (this._onPointerDown === undefined) {
                this._onPointerDown = function (evt) {
                    if (evt.pointerType === "mouse") {
                        return;
                    }
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
                };
                this._onPointerUp = function (evt) {
                    if (evt.pointerType === "mouse") {
                        return;
                    }
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
                };
                this._onPointerMove = function (evt) {
                    if (evt.pointerType === "mouse") {
                        return;
                    }
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
                };
            }
            canvas.addEventListener("pointerdown", this._onPointerDown);
            canvas.addEventListener("pointerup", this._onPointerUp);
            canvas.addEventListener("pointerout", this._onPointerUp);
            canvas.addEventListener("pointermove", this._onPointerMove);
            _super.prototype.attachControl.call(this, canvas);
        };
        TouchCamera.prototype.detachControl = function (canvas) {
            if (this._attachedCanvas !== canvas) {
                return;
            }
            canvas.removeEventListener("pointerdown", this._onPointerDown);
            canvas.removeEventListener("pointerup", this._onPointerUp);
            canvas.removeEventListener("pointerout", this._onPointerUp);
            canvas.removeEventListener("pointermove", this._onPointerMove);
            _super.prototype.detachControl.call(this, canvas);
        };
        TouchCamera.prototype._checkInputs = function () {
            if (this._offsetX) {
                this.cameraRotation.y += this._offsetX / this.touchAngularSensibility;
                if (this._pointerPressed.length > 1) {
                    this.cameraRotation.x += -this._offsetY / this.touchAngularSensibility;
                }
                else {
                    var speed = this._computeLocalCameraSpeed();
                    var direction = new BABYLON.Vector3(0, 0, speed * this._offsetY / this.touchMoveSensibility);
                    BABYLON.Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, 0, this._cameraRotationMatrix);
                    this.cameraDirection.addInPlace(BABYLON.Vector3.TransformCoordinates(direction, this._cameraRotationMatrix));
                }
            }
            _super.prototype._checkInputs.call(this);
        };
        TouchCamera.prototype.getTypeName = function () {
            return "TouchCamera";
        };
        __decorate([
            BABYLON.serialize()
        ], TouchCamera.prototype, "touchAngularSensibility", void 0);
        __decorate([
            BABYLON.serialize()
        ], TouchCamera.prototype, "touchMoveSensibility", void 0);
        return TouchCamera;
    }(BABYLON.FreeCamera));
    BABYLON.TouchCamera = TouchCamera;
})(BABYLON || (BABYLON = {}));
