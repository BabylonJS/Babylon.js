module BABYLON {
    export var CameraInputTypes = {};
    
    export interface ICameraInput<TCamera extends BABYLON.Camera> {
        camera: TCamera;
        attachCamera(camera: TCamera);
        detach();        
        getTypeName(): string;
        getSimpleName(): string;
        
        attachElement? : (element: HTMLElement, noPreventDefault?: boolean) => void;
        detachElement? : (element: HTMLElement) => void;
        checkInputs?: () => void;
    }

    export interface CameraInputsMap<TCamera extends BABYLON.Camera> {
        [name: string]: ICameraInput<TCamera>;
        [idx: number]: ICameraInput<TCamera>;
    }

    export class CameraInputsManager<TCamera extends BABYLON.Camera> {
        attached: CameraInputsMap<TCamera>;
        camera: TCamera;
        checkInputs: () => void;

        constructor(camera: TCamera) {
            this.attached = {};
            this.camera = camera;
            this.checkInputs = () => { };
        }

        public add(input: ICameraInput<TCamera>) {
            var type = input.getSimpleName();
            if (this.attached[type]) {
                Tools.Warn("camera input of type " + type + " already exists on camera");
                return;
            }

            this.attached[type] = input;
            input.attachCamera(this.camera);
            
            //for checkInputs, we are dynamically creating a function
            //the goal is to avoid the performance penalty of looping for inputs in the render loop
            if (input.checkInputs) {
                this.checkInputs = this._addCheckInputs(input.checkInputs.bind(input));
            }
        }
        
        private _addCheckInputs(fn){
            var current = this.checkInputs;
            return () => {
                current();
                fn();
            }
        }

        public attachElement(element: HTMLElement, noPreventDefault?: boolean) {
            for (var cam in this.attached) {
                var input = this.attached[cam];
                if (input.attachElement)
                    this.attached[cam].attachElement(element, noPreventDefault);
            }
        }

        public detachElement(element: HTMLElement) {
            for (var cam in this.attached) {
                var input = this.attached[cam];
                if (input.detachElement)
                    this.attached[cam].detachElement(element);
            }
        }

        public rebuildInputCheck(element: HTMLElement) {
            this.checkInputs = () => { };

            for (var cam in this.attached) {
                var input = this.attached[cam];
                if (input.checkInputs) {
                    this.checkInputs = this._addCheckInputs(input.checkInputs.bind(input));
                }
            }
        }

        public clear() {
            for (var cam in this.attached) {
                this.attached[cam].detach();
            }

            this.attached = {};
            this.checkInputs = () => { };
        }
        
        public serialize(serializedCamera){
            var inputs = {};
            for (var cam in this.attached) {
                var input = this.attached[cam];
                var res = SerializationHelper.Serialize(input, serializedCamera);
                inputs[input.getTypeName()] = res;
            }
            
            serializedCamera.inputsmgr = inputs;
        }
        
        public parse(parsedCamera){
            var parsedInputs = parsedCamera.inputsmgr;
            if (parsedInputs){
                this.clear();
                
                for (var n in parsedInputs) {
                    var construct = CameraInputTypes[n];
                    if (construct){
                        var parsedinput = parsedInputs[n];
                        var input = SerializationHelper.Parse(() => { return new construct() }, parsedinput, null);
                        this.add(input as any);
                    }
                }
            } else { 
                //2016-03-08 this part is for managing backward compatibility
                for (var n in this.attached) {                    
                    var construct = CameraInputTypes[this.attached[n].getTypeName()];
                    if (construct){                        
                        var input = SerializationHelper.Parse(() => { return new construct() }, parsedCamera, null);
                        this.add(input as any);
                    }
                }
            }
        }
        
    }
    
    
} 
