module BABYLON {
    export class ArcRotateCameraInputsManager extends CameraInputsManager<ArcRotateCamera> {
        constructor(camera : ArcRotateCamera){
            super(camera);    
        }
        
        add(input: ICameraInput<ArcRotateCamera>){
            super.add(input);
            if (this.camera._attachedElement && input.attachElement) {
                input.attachElement(this.camera._attachedElement, this.camera._noPreventDefault);
            }
        }
        
        public addMouseWheel(){
            this.add(new ArcRotateCameraMouseWheelInput());
            return this;
        }
        
        public addPointers(){
            this.add(new ArcRotateCameraPointersInput());
            return this;
        }
        
        public addKeyboard(){
            this.add(new ArcRotateCameraKeyboardMoveInput());
            return this;
        }
    }
}