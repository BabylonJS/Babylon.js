var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
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
            this.angularSensibility = 200000.0;
            this.moveSensibility = 500.0;
        }
        TouchCamera.prototype.attachControl = function (canvas, noPreventDefault) {
            var _this = this;
            var previousPosition;
            if (this._attachedCanvas) {
                return;
            }
            this._attachedCanvas = canvas;
            if (this._onPointerDown === undefined) {
                this._onPointerDown = function (evt) {
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
                this._onLostFocus = function () {
                    _this._offsetX = null;
                    _this._offsetY = null;
                };
            }
            canvas.addEventListener("pointerdown", this._onPointerDown);
            canvas.addEventListener("pointerup", this._onPointerUp);
            canvas.addEventListener("pointerout", this._onPointerUp);
            canvas.addEventListener("pointermove", this._onPointerMove);
            BABYLON.Tools.RegisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);
        };
        TouchCamera.prototype.detachControl = function (canvas) {
            if (this._attachedCanvas != canvas) {
                return;
            }
            canvas.removeEventListener("pointerdown", this._onPointerDown);
            canvas.removeEventListener("pointerup", this._onPointerUp);
            canvas.removeEventListener("pointerout", this._onPointerUp);
            canvas.removeEventListener("pointermove", this._onPointerMove);
            BABYLON.Tools.UnregisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);
            this._attachedCanvas = null;
        };
        TouchCamera.prototype._checkInputs = function () {
            if (!this._offsetX) {
                return;
            }
            this.cameraRotation.y += this._offsetX / this.angularSensibility;
            if (this._pointerPressed.length > 1) {
                this.cameraRotation.x += -this._offsetY / this.angularSensibility;
            }
            else {
                var speed = this._computeLocalCameraSpeed();
                var direction = new BABYLON.Vector3(0, 0, speed * this._offsetY / this.moveSensibility);
                BABYLON.Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, 0, this._cameraRotationMatrix);
                this.cameraDirection.addInPlace(BABYLON.Vector3.TransformCoordinates(direction, this._cameraRotationMatrix));
            }
        };
        return TouchCamera;
    })(BABYLON.FreeCamera);
    BABYLON.TouchCamera = TouchCamera;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.touchCamera.js.map