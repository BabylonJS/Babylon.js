import { Logger } from "../Misc/logger";
import { SerializationHelper } from "../Misc/decorators";
import { Nullable } from "../types";
import { Camera } from "./camera";
/**
 * @ignore
 * This is a list of all the different input types that are available in the application.
 * Fo instance: ArcRotateCameraGamepadInput...
 */
export var CameraInputTypes = {};

/**
 * This is the contract to implement in order to create a new input class.
 * Inputs are dealing with listening to user actions and moving the camera accordingly.
 */
export interface ICameraInput<TCamera extends Camera> {
    /**
     * Defines the camera the input is attached to.
     */
    camera: Nullable<TCamera>;
    /**
     * Gets the class name of the current intput.
     * @returns the class name
     */
    getClassName(): string;
    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    getSimpleName(): string;
    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param element Defines the element the controls should be listened from
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
    /**
     * Detach the current controls from the specified dom element.
     * @param element Defines the element to stop listening the inputs from
     */
    detachControl(element: Nullable<HTMLElement>): void;
    /**
     * Update the current camera state depending on the inputs that have been used this frame.
     * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
     */
    checkInputs?: () => void;
}

/**
 * Represents a map of input types to input instance or input index to input instance.
 */
export interface CameraInputsMap<TCamera extends Camera> {
    /**
     * Accessor to the input by input type.
     */
    [name: string]: ICameraInput<TCamera>;
    /**
     * Accessor to the input by input index.
     */
    [idx: number]: ICameraInput<TCamera>;
}

/**
 * This represents the input manager used within a camera.
 * It helps dealing with all the different kind of input attached to a camera.
 * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
 */
export class CameraInputsManager<TCamera extends Camera> {
    /**
     * Defines the list of inputs attahed to the camera.
     */
    public attached: CameraInputsMap<TCamera>;

    /**
     * Defines the dom element the camera is collecting inputs from.
     * This is null if the controls have not been attached.
     */
    public attachedElement: Nullable<HTMLElement>;

    /**
     * Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public noPreventDefault: boolean;

    /**
     * Defined the camera the input manager belongs to.
     */
    public camera: TCamera;

    /**
     * Update the current camera state depending on the inputs that have been used this frame.
     * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
     */
    public checkInputs: () => void;

    /**
     * Instantiate a new Camera Input Manager.
     * @param camera Defines the camera the input manager blongs to
     */
    constructor(camera: TCamera) {
        this.attached = {};
        this.camera = camera;
        this.checkInputs = () => { };
    }

    /**
     * Add an input method to a camera
     * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
     * @param input camera input method
     */
    public add(input: ICameraInput<TCamera>): void {
        var type = input.getSimpleName();
        if (this.attached[type]) {
            Logger.Warn("camera input of type " + type + " already exists on camera");
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
    public remove(inputToRemove: ICameraInput<TCamera>): void {
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

    /**
     * Remove a specific input type from a camera
     * example: camera.inputs.remove("ArcRotateCameraGamepadInput");
     * @param inputType the type of the input to remove
     */
    public removeByType(inputType: string): void {
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
        };
    }

    /**
     * Attach the input controls to the currently attached dom element to listen the events from.
     * @param input Defines the input to attach
     */
    public attachInput(input: ICameraInput<TCamera>): void {
        if (this.attachedElement) {
            input.attachControl(this.attachedElement, this.noPreventDefault);
        }
    }

    /**
     * Attach the current manager inputs controls to a specific dom element to listen the events from.
     * @param element Defines the dom element to collect the events from
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachElement(element: HTMLElement, noPreventDefault: boolean = false): void {
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

    /**
     * Detach the current manager inputs controls from a specific dom element.
     * @param element Defines the dom element to collect the events from
     * @param disconnect Defines whether the input should be removed from the current list of attached inputs
     */
    public detachElement(element: HTMLElement, disconnect = false): void {
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

    /**
     * Rebuild the dynamic inputCheck function from the current list of
     * defined inputs in the manager.
     */
    public rebuildInputCheck(): void {
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
    public clear(): void {
        if (this.attachedElement) {
            this.detachElement(this.attachedElement, true);
        }
        this.attached = {};
        this.attachedElement = null;
        this.checkInputs = () => { };
    }

    /**
     * Serialize the current input manager attached to a camera.
     * This ensures than once parsed,
     * the input associated to the camera will be identical to the current ones
     * @param serializedCamera Defines the camera serialization JSON the input serialization should write to
     */
    public serialize(serializedCamera: any): void {
        var inputs: { [key: string]: any } = {};
        for (var cam in this.attached) {
            var input = this.attached[cam];
            var res = SerializationHelper.Serialize(input);
            inputs[input.getClassName()] = res;
        }

        serializedCamera.inputsmgr = inputs;
    }

    /**
     * Parses an input manager serialized JSON to restore the previous list of inputs
     * and states associated to a camera.
     * @param parsedCamera Defines the JSON to parse
     */
    public parse(parsedCamera: any): void {
        var parsedInputs = parsedCamera.inputsmgr;
        if (parsedInputs) {
            this.clear();

            for (var n in parsedInputs) {
                var construct = (<any>CameraInputTypes)[n];
                if (construct) {
                    var parsedinput = parsedInputs[n];
                    var input = SerializationHelper.Parse(() => { return new construct(); }, parsedinput, null);
                    this.add(input as any);
                }
            }
        } else {
            //2016-03-08 this part is for managing backward compatibility
            for (var n in this.attached) {
                var construct = (<any>CameraInputTypes)[this.attached[n].getClassName()];
                if (construct) {
                    var input = SerializationHelper.Parse(() => { return new construct(); }, parsedCamera, null);
                    this.remove(this.attached[n]);
                    this.add(input as any);
                }
            }
        }
    }
}
