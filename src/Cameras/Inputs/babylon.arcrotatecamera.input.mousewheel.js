var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var ArcRotateCameraMouseWheelInput = (function () {
        function ArcRotateCameraMouseWheelInput() {
            this.wheelPrecision = 3.0;
        }
        ArcRotateCameraMouseWheelInput.prototype.attachControl = function (element, noPreventDefault) {
            var _this = this;
            this._wheel = function (p, s) {
                //sanity check - this should be a PointerWheel event.
                if (p.type !== BABYLON.PointerEventTypes.POINTERWHEEL)
                    return;
                var event = p.event;
                var delta = 0;
                if (event.wheelDelta) {
                    delta = event.wheelDelta / (_this.wheelPrecision * 40);
                }
                else if (event.detail) {
                    delta = -event.detail / _this.wheelPrecision;
                }
                if (delta)
                    _this.camera.inertialRadiusOffset += delta;
                if (event.preventDefault) {
                    if (!noPreventDefault) {
                        event.preventDefault();
                    }
                }
            };
            this._observer = this.camera.getScene().onPointerObservable.add(this._wheel, BABYLON.PointerEventTypes.POINTERWHEEL);
        };
        ArcRotateCameraMouseWheelInput.prototype.detachControl = function (element) {
            if (this._observer && element) {
                this.camera.getScene().onPointerObservable.remove(this._observer);
                this._observer = null;
                this._wheel = null;
            }
        };
        ArcRotateCameraMouseWheelInput.prototype.getTypeName = function () {
            return "ArcRotateCameraMouseWheelInput";
        };
        ArcRotateCameraMouseWheelInput.prototype.getSimpleName = function () {
            return "mousewheel";
        };
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCameraMouseWheelInput.prototype, "wheelPrecision", void 0);
        return ArcRotateCameraMouseWheelInput;
    })();
    BABYLON.ArcRotateCameraMouseWheelInput = ArcRotateCameraMouseWheelInput;
    BABYLON.CameraInputTypes["ArcRotateCameraMouseWheelInput"] = ArcRotateCameraMouseWheelInput;
})(BABYLON || (BABYLON = {}));
