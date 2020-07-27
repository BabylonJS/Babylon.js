import { Observable } from "babylonjs/Misc/observable";
import { Vector2 } from "babylonjs/Maths/math.vector";

import { Control } from "../control";
import { ValueAndUnit } from "../../valueAndUnit";

/**
 * Class used to create slider controls
 */
export class BaseSlider extends Control {
    protected _thumbWidth = new ValueAndUnit(20, ValueAndUnit.UNITMODE_PIXEL, false);
    private _minimum = 0;
    private _maximum = 100;
    private _value = 50;
    private _isVertical = false;
    protected _barOffset = new ValueAndUnit(5, ValueAndUnit.UNITMODE_PIXEL, false);
    private _isThumbClamped = false;
    protected _displayThumb = true;
    private _step = 0;

    private _lastPointerDownID = -1;

    // Shared rendering info
    protected _effectiveBarOffset = 0;
    protected _renderLeft: number;
    protected _renderTop: number;
    protected _renderWidth: number;
    protected _renderHeight: number;
    protected _backgroundBoxLength: number;
    protected _backgroundBoxThickness: number;
    protected _effectiveThumbThickness: number;

    /** Observable raised when the sldier value changes */
    public onValueChangedObservable = new Observable<number>();

    /** Gets or sets a boolean indicating if the thumb must be rendered */
    public get displayThumb(): boolean {
        return this._displayThumb;
    }

    public set displayThumb(value: boolean) {
        if (this._displayThumb === value) {
            return;
        }

        this._displayThumb = value;
        this._markAsDirty();
    }

    /** Gets or sets a step to apply to values (0 by default) */
    public get step(): number {
        return this._step;
    }

    public set step(value: number) {
        if (this._step === value) {
            return;
        }

        this._step = value;
        this._markAsDirty();
    }

    /** Gets or sets main bar offset (ie. the margin applied to the value bar) */
    public get barOffset(): string | number {
        return this._barOffset.toString(this._host);
    }

    /** Gets main bar offset in pixels*/
    public get barOffsetInPixels(): number {
        return this._barOffset.getValueInPixel(this._host, this._cachedParentMeasure.width);
    }

    public set barOffset(value: string | number) {
        if (this._barOffset.toString(this._host) === value) {
            return;
        }

        if (this._barOffset.fromString(value)) {
            this._markAsDirty();
        }
    }

    /** Gets or sets thumb width */
    public get thumbWidth(): string | number {
        return this._thumbWidth.toString(this._host);
    }

    /** Gets thumb width in pixels */
    public get thumbWidthInPixels(): number {
        return this._thumbWidth.getValueInPixel(this._host, this._cachedParentMeasure.width);
    }

    public set thumbWidth(value: string | number) {
        if (this._thumbWidth.toString(this._host) === value) {
            return;
        }

        if (this._thumbWidth.fromString(value)) {
            this._markAsDirty();
        }
    }

    /** Gets or sets minimum value */
    public get minimum(): number {
        return this._minimum;
    }

    public set minimum(value: number) {
        if (this._minimum === value) {
            return;
        }

        this._minimum = value;
        this._markAsDirty();

        this.value = Math.max(Math.min(this.value, this._maximum), this._minimum);
    }

    /** Gets or sets maximum value */
    public get maximum(): number {
        return this._maximum;
    }

    public set maximum(value: number) {
        if (this._maximum === value) {
            return;
        }

        this._maximum = value;
        this._markAsDirty();

        this.value = Math.max(Math.min(this.value, this._maximum), this._minimum);
    }

    /** Gets or sets current value */
    public get value(): number {
        return this._value;
    }

    public set value(value: number) {
        value = Math.max(Math.min(value, this._maximum), this._minimum);

        if (this._value === value) {
            return;
        }

        this._value = value;
        this._markAsDirty();
        this.onValueChangedObservable.notifyObservers(this._value);
    }

    /**Gets or sets a boolean indicating if the slider should be vertical or horizontal */
    public get isVertical(): boolean {
        return this._isVertical;
    }

    public set isVertical(value: boolean) {
        if (this._isVertical === value) {
            return;
        }

        this._isVertical = value;
        this._markAsDirty();
    }

    /** Gets or sets a value indicating if the thumb can go over main bar extends */
    public get isThumbClamped(): boolean {
        return this._isThumbClamped;
    }

    public set isThumbClamped(value: boolean) {
        if (this._isThumbClamped === value) {
            return;
        }

        this._isThumbClamped = value;
        this._markAsDirty();
    }

    /**
     * Creates a new BaseSlider
     * @param name defines the control name
     */
    constructor(public name?: string) {
        super(name);

        this.isPointerBlocker = true;
    }

    protected _getTypeName(): string {
        return "BaseSlider";
    }

    protected _getThumbPosition() {
        if (this.isVertical) {
            return ((this.maximum - this.value) / (this.maximum - this.minimum)) * this._backgroundBoxLength;
        }

        return ((this.value - this.minimum) / (this.maximum - this.minimum)) * this._backgroundBoxLength;
    }

    protected _getThumbThickness(type: string): number {
        var thumbThickness = 0;
        switch (type) {
            case "circle":
                if (this._thumbWidth.isPixel) {
                    thumbThickness = Math.max(this._thumbWidth.getValue(this._host), this._backgroundBoxThickness);
                }
                else {
                    thumbThickness = this._backgroundBoxThickness * this._thumbWidth.getValue(this._host);
                }
                break;
            case "rectangle":
                if (this._thumbWidth.isPixel) {
                    thumbThickness = Math.min(this._thumbWidth.getValue(this._host), this._backgroundBoxThickness);
                }
                else {
                    thumbThickness = this._backgroundBoxThickness * this._thumbWidth.getValue(this._host);
                }
        }
        return thumbThickness;
    }

    protected _prepareRenderingData(type: string) {
        // Main bar
        this._effectiveBarOffset = 0;
        this._renderLeft = this._currentMeasure.left;
        this._renderTop = this._currentMeasure.top;
        this._renderWidth = this._currentMeasure.width;
        this._renderHeight = this._currentMeasure.height;

        this._backgroundBoxLength = Math.max(this._currentMeasure.width, this._currentMeasure.height);
        this._backgroundBoxThickness = Math.min(this._currentMeasure.width, this._currentMeasure.height);
        this._effectiveThumbThickness = this._getThumbThickness(type);

        if (this.displayThumb) {
            this._backgroundBoxLength -= this._effectiveThumbThickness;
        }
        //throw error when height is less than width for vertical slider
        if ((this.isVertical && this._currentMeasure.height < this._currentMeasure.width)) {
            console.error("Height should be greater than width");
            return;
        }
        if (this._barOffset.isPixel) {
            this._effectiveBarOffset = Math.min(this._barOffset.getValue(this._host), this._backgroundBoxThickness);
        }
        else {
            this._effectiveBarOffset = this._backgroundBoxThickness * this._barOffset.getValue(this._host);
        }

        this._backgroundBoxThickness -= (this._effectiveBarOffset * 2);

        if (this.isVertical) {
            this._renderLeft += this._effectiveBarOffset;
            if (!this.isThumbClamped && this.displayThumb) {
                this._renderTop += (this._effectiveThumbThickness / 2);
            }

            this._renderHeight = this._backgroundBoxLength;
            this._renderWidth = this._backgroundBoxThickness;

        }
        else {
            this._renderTop += this._effectiveBarOffset;
            if (!this.isThumbClamped && this.displayThumb) {
                this._renderLeft += (this._effectiveThumbThickness / 2);
            }
            this._renderHeight = this._backgroundBoxThickness;
            this._renderWidth = this._backgroundBoxLength;
        }
    }

    // Events
    private _pointerIsDown = false;

    /** @hidden */
    protected _updateValueFromPointer(x: number, y: number): void {
        if (this.rotation != 0) {
            this._invertTransformMatrix.transformCoordinates(x, y, this._transformedPosition);
            x = this._transformedPosition.x;
            y = this._transformedPosition.y;
        }

        let value: number;
        if (this._isVertical) {
            value = this._minimum + (1 - ((y - this._currentMeasure.top) / this._currentMeasure.height)) * (this._maximum - this._minimum);
        }
        else {
            value = this._minimum + ((x - this._currentMeasure.left) / this._currentMeasure.width) * (this._maximum - this._minimum);
        }

        const mult = (1 / this._step) | 0;
        this.value = this._step ? ((value * mult) | 0) / mult : value;
    }

    public _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean {
        if (!super._onPointerDown(target, coordinates, pointerId, buttonIndex)) {
            return false;
        }

        this._pointerIsDown = true;

        this._updateValueFromPointer(coordinates.x, coordinates.y);
        this._host._capturingControl[pointerId] = this;
        this._lastPointerDownID = pointerId;
        return true;
    }

    public _onPointerMove(target: Control, coordinates: Vector2, pointerId: number): void {
        // Only listen to pointer move events coming from the last pointer to click on the element (To support dual vr controller interaction)
        if (pointerId != this._lastPointerDownID) {
            return;
        }

        if (this._pointerIsDown) {
            this._updateValueFromPointer(coordinates.x, coordinates.y);
        }

        super._onPointerMove(target, coordinates, pointerId);
    }

    public _onPointerUp(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean): void {
        this._pointerIsDown = false;

        delete this._host._capturingControl[pointerId];
        super._onPointerUp(target, coordinates, pointerId, buttonIndex, notifyClick);
    }
}
