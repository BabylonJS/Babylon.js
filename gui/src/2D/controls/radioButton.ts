import { Observable } from "babylonjs/Misc/observable";
import { Vector2 } from "babylonjs/Maths/math.vector";

import { Control } from "./control";
import { StackPanel } from "./stackPanel";
import { TextBlock } from "./textBlock";
import { _TypeStore } from 'babylonjs/Misc/typeStore';

/**
 * Class used to create radio button controls
 */
export class RadioButton extends Control {
    private _isChecked = false;
    private _background = "black";
    private _checkSizeRatio = 0.8;
    private _thickness = 1;

    /** Gets or sets border thickness */
    public get thickness(): number {
        return this._thickness;
    }

    public set thickness(value: number) {
        if (this._thickness === value) {
            return;
        }

        this._thickness = value;
        this._markAsDirty();
    }

    /** Gets or sets group name */
    public group = "";

    /** Observable raised when isChecked is changed */
    public onIsCheckedChangedObservable = new Observable<boolean>();

    /** Gets or sets a value indicating the ratio between overall size and check size */
    public get checkSizeRatio(): number {
        return this._checkSizeRatio;
    }

    public set checkSizeRatio(value: number) {
        value = Math.max(Math.min(1, value), 0);

        if (this._checkSizeRatio === value) {
            return;
        }

        this._checkSizeRatio = value;
        this._markAsDirty();
    }

    /** Gets or sets background color */
    public get background(): string {
        return this._background;
    }

    public set background(value: string) {
        if (this._background === value) {
            return;
        }

        this._background = value;
        this._markAsDirty();
    }

    /** Gets or sets a boolean indicating if the checkbox is checked or not */
    public get isChecked(): boolean {
        return this._isChecked;
    }

    public set isChecked(value: boolean) {
        if (this._isChecked === value) {
            return;
        }

        this._isChecked = value;
        this._markAsDirty();

        this.onIsCheckedChangedObservable.notifyObservers(value);

        if (this._isChecked && this._host) {
            // Update all controls from same group
            this._host.executeOnAllControls((control) => {
                if (control === this) {
                    return;
                }

                if ((<any>control).group === undefined) {
                    return;
                }
                var childRadio = (<RadioButton>control);
                if (childRadio.group === this.group) {
                    childRadio.isChecked = false;
                }
            });
        }
    }

    /**
     * Creates a new RadioButton
     * @param name defines the control name
     */
    constructor(public name?: string) {
        super(name);

        this.isPointerBlocker = true;
    }

    protected _getTypeName(): string {
        return "RadioButton";
    }

    public _draw(context: CanvasRenderingContext2D): void {
        context.save();

        this._applyStates(context);
        let actualWidth = this._currentMeasure.width - this._thickness;
        let actualHeight = this._currentMeasure.height - this._thickness;

        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }

        // Outer
        Control.drawEllipse(this._currentMeasure.left + this._currentMeasure.width / 2, this._currentMeasure.top + this._currentMeasure.height / 2,
            this._currentMeasure.width / 2 - this._thickness / 2, this._currentMeasure.height / 2 - this._thickness / 2, context);

        context.fillStyle = this._isEnabled ? this._background : this._disabledColor;
        context.fill();

        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowBlur = 0;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
        }

        context.strokeStyle = this.color;
        context.lineWidth = this._thickness;

        context.stroke();

        // Inner
        if (this._isChecked) {
            context.fillStyle = this._isEnabled ? this.color : this._disabledColor;
            let offsetWidth = actualWidth * this._checkSizeRatio;
            let offseHeight = actualHeight * this._checkSizeRatio;

            Control.drawEllipse(this._currentMeasure.left + this._currentMeasure.width / 2, this._currentMeasure.top + this._currentMeasure.height / 2,
                offsetWidth / 2 - this._thickness / 2, offseHeight / 2 - this._thickness / 2, context);

            context.fill();
        }
        context.restore();
    }

    // Events
    public _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean {
        if (!super._onPointerDown(target, coordinates, pointerId, buttonIndex)) {
            return false;
        }

        if (!this.isChecked) {
            this.isChecked = true;
        }

        return true;
    }

    /**
     * Utility function to easily create a radio button with a header
     * @param title defines the label to use for the header
     * @param group defines the group to use for the radio button
     * @param isChecked defines the initial state of the radio button
     * @param onValueChanged defines the callback to call when value changes
     * @returns a StackPanel containing the radio button and a textBlock
     */
    public static AddRadioButtonWithHeader(title: string, group: string, isChecked: boolean, onValueChanged: (button: RadioButton, value: boolean) => void): StackPanel {
        var panel = new StackPanel();
        panel.isVertical = false;
        panel.height = "30px";

        var radio = new RadioButton();
        radio.width = "20px";
        radio.height = "20px";
        radio.isChecked = isChecked;
        radio.color = "green";
        radio.group = group;
        radio.onIsCheckedChangedObservable.add((value) => onValueChanged(radio, value));
        panel.addControl(radio);

        var header = new TextBlock();
        header.text = title;
        header.width = "180px";
        header.paddingLeft = "5px";
        header.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        header.color = "white";
        panel.addControl(header);

        return panel;
    }
}
_TypeStore.RegisteredTypes["BABYLON.GUI.RadioButton"] = RadioButton;