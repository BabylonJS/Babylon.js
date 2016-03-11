module BABYLON {
    export class FreeCameraInputsManager extends CameraInputsManager<FreeCamera> {
        constructor(camera : FreeCamera){
            super(camera);    
        }        
        
        addKeyboard(){
            this.add(new FreeCameraKeyboardMoveInput());
            return this;
        }
        
        addMouse(){
            this.add(new FreeCameraMouseInput());
            return this;
        }
        
        addGamepad(){
            this.add(new FreeCameraGamepadInput());
            return this;
        }
        
        addDeviceOrientation(){
            this.add(new FreeCameraDeviceOrientationInput());
            return this;
        }
        
        addVRDeviceOrientation(){
            this.add(new FreeCameraVRDeviceOrientationInput());
            return this;
        }
        
        addTouch(){
            this.add(new FreeCameraTouchInput());
            return this;
        }
        
        addVirtualJoystick(){
            this.add(new FreeCameraVirtualJoystickInput());
            return this;
        }
    }
}