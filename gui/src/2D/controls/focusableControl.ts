import { IKeyboardEvent } from "babylonjs/Events/deviceInputEvents";
import { Nullable } from "babylonjs/types";
import { Control } from "./control";

/**
* Interface used to define a control that can receive focus
*/
export interface IFocusableControl {
    /**
     * Function called when the control receives the focus
     */
    onFocus(): void;
    /**
     * Function called when the control loses the focus
     */
    onBlur(): void;
    /**
     * Function called to let the control handle keyboard events
     * @param evt defines the current keyboard event
     */
    processKeyboard(evt: IKeyboardEvent): void;
    /**
    * Function called to get the list of controls that should not steal the focus from this control
    * @returns an array of controls
    */
    keepsFocusWith(): Nullable<Control[]>;
    /**
    * Function to focus the control programmatically
    */
    focus(): void;
    /**
    * Function to unfocus the control programmatically
    */
    blur(): void;
}