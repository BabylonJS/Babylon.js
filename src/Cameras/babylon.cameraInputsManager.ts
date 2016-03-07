module BABYLON {
    export module CameraInputs{
        export var InputTypes = {};
    }
    
    export interface ICameraInput<TCamera extends BABYLON.Camera> {
        camera: TCamera;
        attachCamera(camera: TCamera);
        detach();        
        getTypeName(): string;
        
        attachElement? : (element: HTMLElement, noPreventDefault?: boolean) => void;
        detachElement? : (element: HTMLElement) => void;
        checkInputs?: () => void;
    }

    export interface CameraInputsMap<TCamera extends BABYLON.Camera> {
        [name: string]: ICameraInput<TCamera>;
        [idx: number]: ICameraInput<TCamera>;
    }

    export class CameraInputsManager<TCamera extends BABYLON.Camera> {
        inputs: CameraInputsMap<TCamera>;
        camera: TCamera;
        checkInputs: () => void;

        constructor(camera: TCamera) {
            this.inputs = {};
            this.camera = camera;
            this.checkInputs = () => { };
        }

        public add(input: ICameraInput<TCamera>) {
            var type = input.getTypeName();
            if (this.inputs[type]) {
                Tools.Warn("camera input of type " + type + " already exists on camera");
                return;
            }

            this.inputs[type] = input;
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
            for (var cam in this.inputs) {
                var input = this.inputs[cam];
                if (input.attachElement)
                    this.inputs[cam].attachElement(element, noPreventDefault);
            }
        }

        public detachElement(element: HTMLElement) {
            for (var cam in this.inputs) {
                var input = this.inputs[cam];
                if (input.detachElement)
                    this.inputs[cam].detachElement(element);
            }
        }

        public rebuildInputCheck(element: HTMLElement) {
            this.checkInputs = () => { };

            for (var cam in this.inputs) {
                var input = this.inputs[cam];
                if (input.checkInputs) {
                    this.checkInputs = this._addCheckInputs(input.checkInputs.bind(input));
                }
            }
        }

        public clear() {
            for (var cam in this.inputs) {
                this.inputs[cam].detach();
            }

            this.inputs = {};
            this.checkInputs = () => { };
        }
        
        public serialize(){
            var inputs = {};
            for (var cam in this.inputs) {
                var input = this.inputs[cam];
                var res = SerializationHelper.Serialize(input);
                inputs[input.getTypeName()] = res;
            }
            
            return inputs;
        }
        
        public parse(parsedInputs){
            if (parsedInputs){
                this.clear();
                
                for (var n in parsedInputs) {
                    var construct = CameraInputs.InputTypes[n];
                    if (construct){
                        var parsedinput = parsedInputs[n];
                        var input = SerializationHelper.Parse(() => { return new construct() }, parsedinput, null);
                        this.add(input as any);
                    }
                }
            }
        }
        
    }
    
    
} 
