import { FreeCamera } from '../../Cameras/freeCamera';
import { CameraInputTypes } from '../../Cameras/cameraInputsManager';
import { BaseCameraMouseWheelInput } from '../../Cameras/Inputs/BaseCameraMouseWheelInput';
import { BaseTranslation } from '../Translations/BaseTranslation';
import { Coordinate } from '../../Maths/math.axis';
import { Nullable } from "../../types";


enum ButtonState {
    Either,
    Up,
    Down,
}

// TODO(mrdunk): What other modifiers are appropriate on different controller types?
// Is `ButtonModifiers` the correct name to deal with all input types?
interface ButtonModifiers {
    shift?: ButtonState;
    alt?: ButtonState;
    ctrl?: ButtonState;
    meta?: ButtonState;
    mouse1?: ButtonState;
    mouse2?: ButtonState;
    mouse3?: ButtonState;
}

function compareButtonModifierss(a: ButtonModifiers, b: ButtonModifiers): boolean {
    return (a.shift === b.shift &&
        a.alt === b.alt &&
        a.ctrl === b.ctrl &&
        a.meta === b.meta &&
        a.mouse1 === b.mouse1 &&
        a.mouse2 === b.mouse2 &&
        a.mouse3 === b.mouse3);
}

/**
 * Manage the mouse wheel inputs to control a free camera.
 * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
 */
export class FreeCameraMouseWheelInputDemo extends BaseCameraMouseWheelInput {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: FreeCamera;

    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    public getClassName(): string {
        return 'FreeCameraMouseWheelInputDemo';
    }

    public attachControl(noPreventDefault?: boolean): void {
        super.attachControl(noPreventDefault);

        // Set default mouse wheel actions.
        // Ideally we'd do these in the constructor but this.camera is not
        // available there yet. This can happen to the end user when calling
        // this.mapInput(...) as well.
        // TODO(mrdunk): Wrap this.mapInput(...) functionality in a timer to
        // avoid this?
        const freeCameraMoveRelativeX = this.camera.getTranslation('freeCameraMoveRelative_X');
        const freeCameraMoveRelativeY = this.camera.getTranslation('freeCameraMoveRelative_Y');
        this.mapInput(Coordinate.X, freeCameraMoveRelativeX);
        this.mapInput(Coordinate.Y, freeCameraMoveRelativeY, {shift: ButtonState.Up});
    }

    public mapInput(
        axis: Coordinate,
        translation: Nullable<BaseTranslation>,
        buttonModifiers: ButtonModifiers = {}
    ): void {
        if (translation === null) {
            return;
        }

        let mouseWheelAxis;
        switch(axis) {
            case Coordinate.X:
                mouseWheelAxis = this.wheelXActions;
                break;
            case Coordinate.Y:
                mouseWheelAxis = this.wheelYActions;
                break;
            case Coordinate.Z:
                mouseWheelAxis = this.wheelZActions;
                break;
        }

        for(let index = 0; index < mouseWheelAxis.length; index++) {
            let [existingButtonModifiers, existingTranslation] = mouseWheelAxis[index];
            if (compareButtonModifierss(buttonModifiers, existingButtonModifiers) &&
                translation === existingTranslation) 
            {
                return;
            }
        }
        mouseWheelAxis.push([buttonModifiers, translation]);
    }

    /**
     * Called for each rendered frame.
     */
    public checkInputs(): void {
        if (this._wheelDeltaX === 0 &&
                this._wheelDeltaY === 0 &&
                this._wheelDeltaZ == 0) {
            return;
        }

        if (this._wheelDeltaX !== 0 ) {
            for (let [buttonModifiers, translation] of this.wheelXActions) {
                if (this.compareButtonModifiers(buttonModifiers)) {
                    translation.updateCamera(this._wheelDeltaX);
                }
            }
        }
        if (this._wheelDeltaY !== 0 ) {
            for (let [buttonModifiers, translation] of this.wheelYActions) {
                if (this.compareButtonModifiers(buttonModifiers)) {
                    translation.updateCamera(this._wheelDeltaY);
                }
            }
        }
        if (this._wheelDeltaZ !== 0 ) {
            for (let [buttonModifiers, translation] of this.wheelZActions) {
                if (this.compareButtonModifiers(buttonModifiers)) {
                    translation.updateCamera(this._wheelDeltaZ);
                }
            }
        }

        // Call the base class implementation to handle observers and do cleanup.
        super.checkInputs();
    }

    private compareButtonModifiers(buttonModifiers: ButtonModifiers): boolean {
        if (buttonModifiers.shift === ButtonState.Up && this._shiftKey === true ) {
            return false;
        }
        if (buttonModifiers.shift === ButtonState.Down && this._shiftKey === false ) {
            return false;
        }

        if (buttonModifiers.alt === ButtonState.Up && this._altKey === true ) {
            return false;
        }
        if (buttonModifiers.alt === ButtonState.Down && this._altKey === false ) {
            return false;
        }
        
        if (buttonModifiers.ctrl === ButtonState.Up && this._ctrlKey === true ) {
            return false;
        }
        if (buttonModifiers.ctrl === ButtonState.Down && this._ctrlKey === false ) {
            return false;
        }
        
        if (buttonModifiers.meta === ButtonState.Up && this._metaKey === true ) {
            return false;
        }
        if (buttonModifiers.meta === ButtonState.Down && this._metaKey === false ) {
            return false;
        }

        // TODO: Mouse button comparison.

        return true;
    }

    /**
     * Actions to attach to Mouse Wheel X axis.
     */
    public wheelXActions: Array<[ButtonModifiers, BaseTranslation]> = [];
    /**
     * Actions to attach to Mouse Wheel Y axis.
     */
    public wheelYActions: Array<[ButtonModifiers, BaseTranslation]> = [];
    /**
     * Actions to attach to Mouse Wheel Z axis.
     */
    public wheelZActions: Array<[ButtonModifiers, BaseTranslation]> = [];
}

(<any>CameraInputTypes)['FreeCameraMouseWheelInputDemo'] = FreeCameraMouseWheelInputDemo;
