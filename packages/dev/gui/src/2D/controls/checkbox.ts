import { Observable } from "core/Misc/observable";
import type { Vector2 } from "core/Maths/math.vector";

import { Control } from "./control";
import { StackPanel } from "./stackPanel";
import { TextBlock } from "./textBlock";
import { RegisterClass } from "core/Misc/typeStore";
import type { PointerInfoBase } from "core/Events/pointerEvents";
import { serialize } from "core/Misc/decorators";
import type { ICanvasRenderingContext } from "core/Engines/ICanvas";

/**
 * Class used to represent a 2D checkbox
 */
export class Checkbox extends Control {
    private _isChecked = false;
    private _background = "black";
    private _checkSizeRatio = 0.8;
    private _thickness = 1;

    /** Gets or sets border thickness  */
    @serialize()
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
    @serialize()
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
    @serialize()
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
    @serialize()
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
        return "Checkbox";
    }

    /**
     * @internal
     */
    public _draw(context: ICanvasRenderingContext): void {
        context.save();

        this._applyStates(context);
        const actualWidth = this._currentMeasure.width - this._thickness;
        const actualHeight = this._currentMeasure.height - this._thickness;

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
            // Color is white if not set
            context.fillStyle = this._isEnabled ? (this.color ? this.color : "#ffffff") : this._disabledColorItem;
            const offsetWidth = actualWidth * this._checkSizeRatio;
            const offsetHeight = actualHeight * this._checkSizeRatio;

            context.fillRect(
                this._currentMeasure.left + this._thickness / 2 + (actualWidth - offsetWidth) / 2,
                this._currentMeasure.top + this._thickness / 2 + (actualHeight - offsetHeight) / 2,
                offsetWidth,
                offsetHeight
            );
        }

        context.strokeStyle = this.color;
        context.lineWidth = this._thickness;

        context.strokeRect(this._currentMeasure.left + this._thickness / 2, this._currentMeasure.top + this._thickness / 2, actualWidth, actualHeight);

        context.restore();
    }

    // Events

    /**
     * @internal
     */
    public _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, pi: PointerInfoBase): boolean {
        if (!super._onPointerDown(target, coordinates, pointerId, buttonIndex, pi)) {
            return false;
        }

        if (!this.isReadOnly) {
            this.isChecked = !this.isChecked;
        }

        return true;
    }

    /**
     * Utility function to easily create a checkbox with a header
     * @param title defines the label to use for the header
     * @param onValueChanged defines the callback to call when value changes
     * @returns a StackPanel containing the checkbox and a textBlock
     */
    public static AddCheckBoxWithHeader(title: string, onValueChanged: (value: boolean) => void): StackPanel {
        const panel = new StackPanel();
        panel.isVertical = false;
        panel.height = "30px";

        const checkbox = new Checkbox();
        checkbox.width = "20px";
        checkbox.height = "20px";
        checkbox.isChecked = true;
        checkbox.color = "green";
        checkbox.onIsCheckedChangedObservable.add(onValueChanged);
        panel.addControl(checkbox);

        const header = new TextBlock();
        header.text = title;
        header.width = "180px";
        header.paddingLeft = "5px";
        header.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        header.color = "white";
        panel.addControl(header);

        return panel;
    }
}
RegisterClass("BABYLON.GUI.Checkbox", Checkbox);
