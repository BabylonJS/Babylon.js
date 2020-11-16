import { Nullable } from "babylonjs/types";
import { Vector2 } from "babylonjs/Maths/math.vector";

import { Button } from "./button";
import { Control } from "./control";
import { _TypeStore } from 'babylonjs/Misc/typeStore';
import { PointerInfoBase } from 'babylonjs/Events/pointerEvents';
import { IFocusableControl } from '../advancedDynamicTexture';
import { Observable } from 'babylonjs/Misc/observable';

/**
 * Class used to create a focusable button that can easily handle keyboard events
 */
export class FocusableButton extends Button implements IFocusableControl { 
    private _isFocused = false;
    public focusedColor: Nullable<string> = null;
    private _unfocusedColor: Nullable<string> = null;

    /** Observable raised when the control gets the focus */
    public onFocusObservable = new Observable<Button>();
    /** Observable raised when the control loses the focus */
    public onBlurObservable = new Observable<Button>();
    /** Observable raised when a key event was processed */
    public onKeyboardEventProcessedObservable = new Observable<KeyboardEvent>();

    constructor(public name?: string) {
        super(name);

        this._unfocusedColor = this.color;
    }

    /** @hidden */
    public onBlur(): void {
        if (this._isFocused) {
            this._isFocused = false;
            if (this.focusedColor && this._unfocusedColor != null) {
                // Set color back to saved unfocused color
                this.color = this._unfocusedColor;
            }
            this.onBlurObservable.notifyObservers(this);
        }
    }

    /** @hidden */
    public onFocus(): void {
        this._isFocused = true;

        if (this.focusedColor) {
            // Save the unfocused color
            this._unfocusedColor = this.color;
            this.color = this.focusedColor;
        }
        this.onFocusObservable.notifyObservers(this);
    }

    /**
     * Function called to get the list of controls that should not steal the focus from this control
     * @returns an array of controls
     */
    public keepsFocusWith(): Nullable<Control[]> {
        return null;
    }

    /**
     * Function to focus a button programmatically
     */
    public focus() {
        this._host.moveFocusToControl(this);
    }

    /**
     * Function to unfocus a button programmatically
     */
    public blur() {
        this._host.focusedControl = null;
    }

    /**
     * Handles the keyboard event
     * @param evt Defines the KeyboardEvent
     */
    public processKeyboard(evt: KeyboardEvent): void {
        this.onKeyboardEventProcessedObservable.notifyObservers(evt);
    }

    /** @hidden */
    public _onPointerUp(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean, pi: PointerInfoBase): void {
        // Clicking on button should focus
        this.focus();

        super._onPointerUp(target, coordinates, pointerId, buttonIndex, notifyClick, pi);
    }

    public displose() {
        super.dispose();

        this.onBlurObservable.clear();
        this.onFocusObservable.clear();
        this.onKeyboardEventProcessedObservable.clear();
    }
}
_TypeStore.RegisteredTypes["BABYLON.GUI.FocusableButton"] = FocusableButton;