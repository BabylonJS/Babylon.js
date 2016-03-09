module BABYLON {       
    export class ArcRotateCameraGamepadInput implements ICameraInput<ArcRotateCamera> {
        camera : ArcRotateCamera;
        
        public gamepad: Gamepad;
        private _gamepads: Gamepads;        

        @serialize()
        public gamepadRotationSensibility = 80;
        
        constructor(){
            this._gamepads = new Gamepads((gamepad: Gamepad) => { this._onNewGameConnected(gamepad); });
        }
        
        attachCamera(camera : ArcRotateCamera){
            this.camera = camera;
        }
        
        detach(){
            this._gamepads.dispose();
        }
        
        checkInputs(){
            if (this.gamepad) {
                var camera = this.camera;
                var LSValues = this.gamepad.leftStick;
                
                if (LSValues.x != 0){
                    var normalizedLX = LSValues.x / this.gamepadRotationSensibility;                
                    if (normalizedLX != 0 && Math.abs(normalizedLX) > 0.005) {
                        camera.inertialAlphaOffset += normalizedLX;
                    }
                }
                
                if (LSValues.y != 0){
                    var normalizedLY = LSValues.y / this.gamepadRotationSensibility;
                    if (normalizedLY != 0 && Math.abs(normalizedLY) > 0.005) {
                        camera.inertialBetaOffset += normalizedLY;
                    }
                }                               
            }
        }
        
        private _onNewGameConnected(gamepad: Gamepad) {
            // Only the first gamepad can control the camera
            if (gamepad.index === 0) {
                this.gamepad = gamepad;
            }
        }
        
        getTypeName(): string{
            return "ArcRotateCameraGamepadInput";
        }
        
        getSimpleName(){
            return "gamepad";
        }
    }
    
    CameraInputTypes["ArcRotateCameraGamepadInput"] = ArcRotateCameraGamepadInput;
}