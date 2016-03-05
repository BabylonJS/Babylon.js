module BABYLON {
    export interface IComposableCameraInput {
        camera: ComposableCamera;
        attachCamera(camera: ComposableCamera);
        detach();        
        getTypeName(): string;
        
        attachElement? : (element: HTMLElement, noPreventDefault?: boolean) => void;
        detachElement? : (element: HTMLElement) => void;
        checkInputs?: () => void;
    }

    export interface ComposableCameraInputsMap {
        [name: string]: IComposableCameraInput;
        [idx: number]: IComposableCameraInput;
    }

    export class ComposableCameraInputsManager {
        inputs: ComposableCameraInputsMap;
        camera: ComposableCamera;
        checkInputs: () => void;

        constructor(camera: ComposableCamera) {
            this.inputs = {};
            this.camera = camera;
            this.checkInputs = () => { };
        }

        add(input: IComposableCameraInput) {
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

            if (this.camera._attachedElement && input.attachElement) {
                input.attachElement(this.camera._attachedElement, this.camera._noPreventDefault);
            }
        }
        
        private _addCheckInputs(fn){
            var current = this.checkInputs;
            return () => {
                current();
                fn();
            }
        }

        attachElement(element: HTMLElement, noPreventDefault?: boolean) {
            for (var cam in this.inputs) {
                var input = this.inputs[cam];
                if (input.attachElement)
                    this.inputs[cam].attachElement(element, noPreventDefault);
            }
        }

        detachElement(element: HTMLElement) {
            for (var cam in this.inputs) {
                var input = this.inputs[cam];
                if (input.detachElement)
                    this.inputs[cam].detachElement(element);
            }
        }

        rebuildInputCheck(element: HTMLElement) {
            this.checkInputs = () => { };

            for (var cam in this.inputs) {
                var input = this.inputs[cam];
                if (input.checkInputs) {
                    this.checkInputs = this._addCheckInputs(input.checkInputs.bind(input));
                }
            }
        }

        clear() {
            for (var cam in this.inputs) {
                this.inputs[cam].detach();
            }

            this.inputs = {};
            this.checkInputs = () => { };
        }
    }
} 
