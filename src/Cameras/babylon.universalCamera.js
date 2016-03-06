var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    // We're mainly based on the logic defined into the FreeCamera code
    var UniversalCamera = (function (_super) {
        __extends(UniversalCamera, _super);
        //         public gamepad: Gamepad;
        //         private _gamepads: Gamepads;
        // 
        //         @serialize()
        //         public gamepadAngularSensibility = 200;
        // 
        //         @serialize()
        //         public gamepadMoveSensibility = 40;
        function UniversalCamera(name, position, scene) {
            _super.call(this, name, position, scene);
            this.inputs.addGamepad();
            // this._gamepads = new Gamepads((gamepad: Gamepad) => { this._onNewGameConnected(gamepad); });
        }
        //         private _onNewGameConnected(gamepad: Gamepad) {
        //             // Only the first gamepad can control the camera
        //             if (gamepad.index === 0) {
        //                 this.gamepad = gamepad;
        //             }
        //         }
        // 
        //         public attachControl(canvas: HTMLCanvasElement, noPreventDefault: boolean): void {
        //             super.attachControl(canvas, false);
        //         }
        // 
        //         public detachControl(canvas: HTMLCanvasElement): void {
        //             super.detachControl(canvas);
        //         }
        // 
        //         public _checkInputs(): void {
        //             if (this.gamepad) {
        //                 var LSValues = this.gamepad.leftStick;
        //                 var normalizedLX = LSValues.x / this.gamepadMoveSensibility;
        //                 var normalizedLY = LSValues.y / this.gamepadMoveSensibility;
        //                 LSValues.x = Math.abs(normalizedLX) > 0.005 ? 0 + normalizedLX : 0;
        //                 LSValues.y = Math.abs(normalizedLY) > 0.005 ? 0 + normalizedLY : 0;
        // 
        //                 var RSValues = this.gamepad.rightStick;
        //                 var normalizedRX = RSValues.x / this.gamepadAngularSensibility;
        //                 var normalizedRY = RSValues.y / this.gamepadAngularSensibility;
        //                 RSValues.x = Math.abs(normalizedRX) > 0.001 ? 0 + normalizedRX : 0;
        //                 RSValues.y = Math.abs(normalizedRY) > 0.001 ? 0 + normalizedRY : 0;
        // 
        //                 var cameraTransform = Matrix.RotationYawPitchRoll(this.rotation.y, this.rotation.x, 0);
        // 
        //                 var speed = this._computeLocalCameraSpeed() * 50.0;
        //                 var deltaTransform = Vector3.TransformCoordinates(new Vector3(LSValues.x * speed, 0, -LSValues.y * speed), cameraTransform);
        //                 this.cameraDirection = this.cameraDirection.add(deltaTransform);
        //                 this.cameraRotation = this.cameraRotation.add(new Vector2(RSValues.y, RSValues.x));
        //             }
        //             super._checkInputs();
        //         }
        // 
        //         public dispose(): void {
        //             this._gamepads.dispose();
        //             super.dispose();
        //         }
        UniversalCamera.prototype.getTypeName = function () {
            return "UniversalCamera";
        };
        return UniversalCamera;
    }(BABYLON.TouchCamera));
    BABYLON.UniversalCamera = UniversalCamera;
})(BABYLON || (BABYLON = {}));
