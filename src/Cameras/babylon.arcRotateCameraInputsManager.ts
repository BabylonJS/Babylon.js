module BABYLON {
    export class ArcRotateCameraInputsManager extends CameraInputsManager<ArcRotateCamera> {
        constructor(camera : ArcRotateCamera){
            super(camera);    
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
        
        public addGamepad(){
            this.add(new ArcRotateCameraGamepadInput());
            return this;
        }
    }
}