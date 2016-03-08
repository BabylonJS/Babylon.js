module BABYLON {
    export class FreeCameraInputsManager extends CameraInputsManager<FreeCamera> {
        constructor(camera : FreeCamera){
            super(camera);    
        }
        
        add(input: ICameraInput<FreeCamera>){
            super.add(input);
            if (this.camera._attachedElement && input.attachElement) {
                input.attachElement(this.camera._attachedElement, this.camera._noPreventDefault);
            }
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