var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    // We're mainly based on the logic defined into the FreeCamera code
    var VirtualJoysticksCamera = (function (_super) {
        __extends(VirtualJoysticksCamera, _super);
        function VirtualJoysticksCamera(name, position, scene) {
            _super.call(this, name, position, scene);
            this.inputs.addVirtualJoystick();
        }
        return VirtualJoysticksCamera;
    }(BABYLON.FreeCamera));
    BABYLON.VirtualJoysticksCamera = VirtualJoysticksCamera;
})(BABYLON || (BABYLON = {}));
