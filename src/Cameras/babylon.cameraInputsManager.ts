module BABYLON {
    export var CameraInputTypes = {};

    export interface ICameraInput<TCamera extends Camera> {
        camera: Nullable<TCamera>;
        getClassName(): string;
        getSimpleName(): string;
        attachControl: (element: HTMLElement, noPreventDefault?: boolean) => void;
        detachControl: (element: Nullable<HTMLElement>) => void;
        checkInputs?: () => void;
    }

    export interface CameraInputsMap<TCamera extends Camera> {
        [name: string]: ICameraInput<TCamera>;
        [idx: number]: ICameraInput<TCamera>;
    }

    export class CameraInputsManager<TCamera extends Camera> {
        attached: CameraInputsMap<TCamera>;
        public attachedElement: Nullable<HTMLElement>;
        public noPreventDefault: boolean;
        camera: TCamera;
        checkInputs: () => void;

        constructor(camera: TCamera) {
            this.attached = {};
            this.camera = camera;
            this.checkInputs = () => { };
        }

        /**
         * Add an input method to a camera
         * @see http://doc.babylonjs.com/how_to/customizing_camera_inputs
         * @param input camera input method
         */
        public add(input: ICameraInput<TCamera>) {
            var type = input.getSimpleName();
            if (this.attached[type]) {
                Tools.Warn("camera input of type " + type + " already exists on camera");
                return;
            }

            this.attached[type] = input;

            input.camera = this.camera;

            //for checkInputs, we are dynamically creating a function
            //the goal is to avoid the performance penalty of looping for inputs in the render loop
            if (input.checkInputs) {
                this.checkInputs = this._addCheckInputs(input.checkInputs.bind(input));
            }

            if (this.attachedElement) {
                input.attachControl(this.attachedElement);
            }
        }
        /**
         * Remove a specific input method from a camera
         * example: camera.inputs.remove(camera.inputs.attached.mouse);
         * @param inputToRemove camera input method
         */
        public remove(inputToRemove: ICameraInput<TCamera>) {
            for (var cam in this.attached) {
                var input = this.attached[cam];
                if (input === inputToRemove) {
                    input.detachControl(this.attachedElement);
                    input.camera = null;
                    delete this.attached[cam];
                    this.rebuildInputCheck();
                }
            }
        }

        public removeByType(inputType: string) {
            for (var cam in this.attached) {
                var input = this.attached[cam];
                if (input.getClassName() === inputType) {
                    input.detachControl(this.attachedElement);
                    input.camera = null;
                    delete this.attached[cam];
                    this.rebuildInputCheck();
                }
            }
        }

        private _addCheckInputs(fn: () => void) {
            var current = this.checkInputs;
            return () => {
                current();
                fn();
            }
        }

        public attachInput(input: ICameraInput<TCamera>) {
            if (this.attachedElement) {
                input.attachControl(this.attachedElement, this.noPreventDefault);
            }
        }

        public attachElement(element: HTMLElement, noPreventDefault: boolean = false) {
            if (this.attachedElement) {
                return;
            }

            noPreventDefault = Camera.ForceAttachControlToAlwaysPreventDefault ? false : noPreventDefault;
            this.attachedElement = element;
            this.noPreventDefault = noPreventDefault;

            for (var cam in this.attached) {
                this.attached[cam].attachControl(element, noPreventDefault);
            }
        }

        public detachElement(element: HTMLElement, disconnect = false) {
            if (this.attachedElement !== element) {
                return;
            }

            for (var cam in this.attached) {
                this.attached[cam].detachControl(element);

                if (disconnect) {
                    this.attached[cam].camera = null;
                }
            }

            this.attachedElement = null;
        }

        public rebuildInputCheck() {
            this.checkInputs = () => { };

            for (var cam in this.attached) {
                var input = this.attached[cam];
                if (input.checkInputs) {
                    this.checkInputs = this._addCheckInputs(input.checkInputs.bind(input));
                }
            }
        }

        /**
         * Remove all attached input methods from a camera
         */
        public clear() {
            if (this.attachedElement) {
                this.detachElement(this.attachedElement, true);
            }
            this.attached = {};
            this.attachedElement = null;
            this.checkInputs = () => { };
        }

        public serialize(serializedCamera: any) {
            var inputs: { [key: string]: any } = {};
            for (var cam in this.attached) {
                var input = this.attached[cam];
                var res = SerializationHelper.Serialize(input);
                inputs[input.getClassName()] = res;
            }

            serializedCamera.inputsmgr = inputs;
        }

        public parse(parsedCamera: any) {
            var parsedInputs = parsedCamera.inputsmgr;
            if (parsedInputs) {
                this.clear();

                for (var n in parsedInputs) {
                    var construct = (<any>CameraInputTypes)[n];
                    if (construct) {
                        var parsedinput = parsedInputs[n];
                        var input = SerializationHelper.Parse(() => { return new construct() }, parsedinput, null);
                        this.add(input as any);
                    }
                }
            } else {
                //2016-03-08 this part is for managing backward compatibility
                for (var n in this.attached) {
                    var construct = (<any>CameraInputTypes)[this.attached[n].getClassName()];
                    if (construct) {
                        var input = SerializationHelper.Parse(() => { return new construct() }, parsedCamera, null);
                        this.remove(this.attached[n]);
                        this.add(input as any);
                    }
                }
            }
        }
    }
}

