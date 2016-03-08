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
        // private _leftjoystick: VirtualJoystick;
        // private _rightjoystick: VirtualJoystick;
        function VirtualJoysticksCamera(name, position, scene) {
            _super.call(this, name, position, scene);
            this.inputs.addVirtualJoystick();
            // this._leftjoystick = new VirtualJoystick(true);
            // this._leftjoystick.setAxisForUpDown(JoystickAxis.Z);
            // this._leftjoystick.setAxisForLeftRight(JoystickAxis.X);
            // this._leftjoystick.setJoystickSensibility(0.15);
            // this._rightjoystick = new VirtualJoystick(false);
            // this._rightjoystick.setAxisForUpDown(JoystickAxis.X);
            // this._rightjoystick.setAxisForLeftRight(JoystickAxis.Y);
            // this._rightjoystick.reverseUpDown = true;
            // this._rightjoystick.setJoystickSensibility(0.05);
            // this._rightjoystick.setJoystickColor("yellow");
        }
        return VirtualJoysticksCamera;
    }(BABYLON.FreeCamera));
    BABYLON.VirtualJoysticksCamera = VirtualJoysticksCamera;
})(BABYLON || (BABYLON = {}));
