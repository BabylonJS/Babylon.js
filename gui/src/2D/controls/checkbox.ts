import { Control } from "./control";
import { Measure } from "../measure";
import { Observable, Vector2 } from "babylonjs";
import { StackPanel } from "./stackPanel";
import { TextBlock } from "./textBlock";

/**
 * Class used to represent a 2D checkbox
 */
export class Checkbox extends Control {
    private _isChecked = false;
    private _background = "black";
    private _checkSizeRatio = 0.8;
    private _thickness = 1;

    /** Gets or sets border thickness  */
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

    /**
     * Observable raised when isChecked property changes
     */
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
    }

    /**
     * Creates a new CheckBox
     * @param name defines the control name
     */
    constructor(public name?: string) {
        super(name);
        this.isPointerBlocker = true;
    }

    protected _getTypeName(): string {
        return "CheckBox";
    }

    /** @hidden */
    public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        context.save();

        this._applyStates(context);
        if (this._processMeasures(parentMeasure, context)) {
            let actualWidth = this._currentMeasure.width - this._thickness;
            let actualHeight = this._currentMeasure.height - this._thickness;

            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                context.shadowColor = this.shadowColor;
                context.shadowBlur = this.shadowBlur;
                context.shadowOffsetX = this.shadowOffsetX;
                context.shadowOffsetY = this.shadowOffsetY;
            }

            context.fillStyle = this._isEnabled ? this._background : this._disabledColor;
            context.fillRect(this._currentMeasure.left + this._thickness / 2, this._currentMeasure.top + this._thickness / 2, actualWidth, actualHeight);

            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                context.shadowBlur = 0;
                context.shadowOffsetX = 0;
                context.shadowOffsetY = 0;
            }

            if (this._isChecked) {
                context.fillStyle = this._isEnabled ? this.color : this._disabledColor;
                let offsetWidth = actualWidth * this._checkSizeRatio;
                let offseHeight = actualHeight * this._checkSizeRatio;

                context.fillRect(this._currentMeasure.left + this._thickness / 2 + (actualWidth - offsetWidth) / 2, this._currentMeasure.top + this._thickness / 2 + (actualHeight - offseHeight) / 2, offsetWidth, offseHeight);
            }

            context.strokeStyle = this.color;
            context.lineWidth = this._thickness;

            context.strokeRect(this._currentMeasure.left + this._thickness / 2, this._currentMeasure.top + this._thickness / 2, actualWidth, actualHeight);
        }
        context.restore();
    }

    // Events

    /** @hidden */
    public _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean {
        if (!super._onPointerDown(target, coordinates, pointerId, buttonIndex)) {
            return false;
        }

        this.isChecked = !this.isChecked;

        return true;
    }

    /**
     * Utility function to easily create a checkbox with a header
     * @param title defines the label to use for the header
     * @param onValueChanged defines the callback to call when value changes
     * @returns a StackPanel containing the checkbox and a textBlock
     */
    public static AddCheckBoxWithHeader(title: string, onValueChanged: (value: boolean) => void): StackPanel {
        var panel = new StackPanel();
        panel.isVertical = false;
        panel.height = "30px";

        var checkbox = new Checkbox();
        checkbox.width = "20px";
        checkbox.height = "20px";
        checkbox.isChecked = true;
        checkbox.color = "green";
        checkbox.onIsCheckedChangedObservable.add(onValueChanged);
        panel.addControl(checkbox);

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
