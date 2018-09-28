import { Control } from "./control";
import { ValueAndUnit } from "../valueAndUnit";
import { Observable, Vector2 } from "babylonjs";
import { Measure } from "../measure";

/**
 * Class used to create slider controls
 */
export class Slider extends Control {
    private _thumbWidth = new ValueAndUnit(20, ValueAndUnit.UNITMODE_PIXEL, false);
    private _minimum = 0;
    private _maximum = 100;
    private _value = 50;
    private _isVertical = false;
    private _background = "black";
    private _borderColor = "white";
    private _barOffset = new ValueAndUnit(5, ValueAndUnit.UNITMODE_PIXEL, false);
    private _isThumbCircle = false;
    private _isThumbClamped = false;

    /** Observable raised when the sldier value changes */
    public onValueChangedObservable = new Observable<number>();

    /** Gets or sets border color */
    public get borderColor(): string {
        return this._borderColor;
    }

    public set borderColor(value: string) {
        if (this._borderColor === value) {
            return;
        }

        this._borderColor = value;
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

    /** Gets or sets main bar offset */
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

    /** Gets or sets a boolean indicating if the thumb should be round or square */
    public get isThumbCircle(): boolean {
        return this._isThumbCircle;
    }

    public set isThumbCircle(value: boolean) {
        if (this._isThumbCircle === value) {
            return;
        }

        this._isThumbCircle = value;
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
     * Creates a new Slider
     * @param name defines the control name
     */
    constructor(public name?: string) {
        super(name);

        this.isPointerBlocker = true;
    }

    protected _getTypeName(): string {
        return "Slider";
    }

    protected _getThumbThickness(type: string, backgroundLength: number): number {
        var thumbThickness = 0;
        switch (type) {
            case "circle":
                if (this._thumbWidth.isPixel) {
                    thumbThickness = Math.max(this._thumbWidth.getValue(this._host), backgroundLength);
                }
                else {
                    thumbThickness = backgroundLength * this._thumbWidth.getValue(this._host);
                }
                break;
            case "rectangle":
                if (this._thumbWidth.isPixel) {
                    thumbThickness = Math.min(this._thumbWidth.getValue(this._host), backgroundLength);
                }
                else {
                    thumbThickness = backgroundLength * this._thumbWidth.getValue(this._host);
                }
        }
        return thumbThickness;
    }

    public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        context.save();

        this._applyStates(context);
        if (this._processMeasures(parentMeasure, context)) {
            // Main bar
            var effectiveBarOffset = 0;
            var type = this.isThumbCircle ? "circle" : "rectangle";
            var left = this._currentMeasure.left;
            var top = this._currentMeasure.top;
            var width = this._currentMeasure.width;
            var height = this._currentMeasure.height;

            var backgroundBoxLength = Math.max(this._currentMeasure.width, this._currentMeasure.height);
            var backgroundBoxThickness = Math.min(this._currentMeasure.width, this._currentMeasure.height);

            var effectiveThumbThickness = this._getThumbThickness(type, backgroundBoxThickness);
            backgroundBoxLength -= effectiveThumbThickness;

            var radius = 0;

            //throw error when height is less than width for vertical slider
            if ((this._isVertical && this._currentMeasure.height < this._currentMeasure.width)) {
                console.error("Height should be greater than width");
                return;
            }
            if (this._barOffset.isPixel) {
                effectiveBarOffset = Math.min(this._barOffset.getValue(this._host), backgroundBoxThickness);
            }
            else {
                effectiveBarOffset = backgroundBoxThickness * this._barOffset.getValue(this._host);
            }

            backgroundBoxThickness -= (effectiveBarOffset * 2);

            if (this._isVertical) {
                left += effectiveBarOffset;
                if (!this.isThumbClamped) {
                    top += (effectiveThumbThickness / 2);
                }

                height = backgroundBoxLength;
                width = backgroundBoxThickness;

            }
            else {
                top += effectiveBarOffset;
                if (!this.isThumbClamped) {
                    left += (effectiveThumbThickness / 2);
                }
                height = backgroundBoxThickness;
                width = backgroundBoxLength;
            }

            if (this.isThumbClamped && this.isThumbCircle) {
                if (this._isVertical) {
                    top += (effectiveThumbThickness / 2);
                }
                else {
                    left += (effectiveThumbThickness / 2);
                }

                radius = backgroundBoxThickness / 2;
            }
            else {
                radius = (effectiveThumbThickness - effectiveBarOffset) / 2;
            }

            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                context.shadowColor = this.shadowColor;
                context.shadowBlur = this.shadowBlur;
                context.shadowOffsetX = this.shadowOffsetX;
                context.shadowOffsetY = this.shadowOffsetY;
            }

            var thumbPosition = (this._isVertical) ? ((this._maximum - this._value) / (this._maximum - this._minimum)) * backgroundBoxLength : ((this._value - this._minimum) / (this._maximum - this._minimum)) * backgroundBoxLength;
            context.fillStyle = this._background;

            if (this._isVertical) {
                if (this.isThumbClamped) {
                    if (this.isThumbCircle) {
                        context.beginPath();
                        context.arc(left + backgroundBoxThickness / 2, top, radius, Math.PI, 2 * Math.PI);
                        context.fill();
                        context.fillRect(left, top, width, height);
                    }
                    else {
                        context.fillRect(left, top, width, height + effectiveThumbThickness);
                    }
                }
                else {
                    context.fillRect(left, top, width, height);
                }
            }
            else {
                if (this.isThumbClamped) {
                    if (this.isThumbCircle) {
                        context.beginPath();
                        context.arc(left + backgroundBoxLength, top + (backgroundBoxThickness / 2), radius, 0, 2 * Math.PI);
                        context.fill();
                        context.fillRect(left, top, width, height);
                    }
                    else {
                        context.fillRect(left, top, width + effectiveThumbThickness, height);
                    }
                }
                else {
                    context.fillRect(left, top, width, height);
                }
            }

            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                context.shadowBlur = 0;
                context.shadowOffsetX = 0;
                context.shadowOffsetY = 0;
            }

            context.fillStyle = this.color;
            if (this._isVertical) {
                if (this.isThumbClamped) {
                    if (this.isThumbCircle) {
                        context.beginPath();
                        context.arc(left + backgroundBoxThickness / 2, top + backgroundBoxLength, radius, 0, 2 * Math.PI);
                        context.fill();
                        context.fillRect(left, top + thumbPosition, width, height - thumbPosition);
                    }
                    else {
                        context.fillRect(left, top + thumbPosition, width, this._currentMeasure.height - thumbPosition);
                    }
                }
                else {
                    context.fillRect(left, top + thumbPosition, width, height - thumbPosition);
                }
            }
            else {
                if (this.isThumbClamped) {
                    if (this.isThumbCircle) {
                        context.beginPath();
                        context.arc(left, top + backgroundBoxThickness / 2, radius, 0, 2 * Math.PI);
                        context.fill();
                        context.fillRect(left, top, thumbPosition, height);
                    }
                    else {
                        context.fillRect(left, top, thumbPosition, height);
                    }
                }
                else {
                    context.fillRect(left, top, thumbPosition, height);
                }
            }

            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                context.shadowColor = this.shadowColor;
                context.shadowBlur = this.shadowBlur;
                context.shadowOffsetX = this.shadowOffsetX;
                context.shadowOffsetY = this.shadowOffsetY;
            }
            if (this._isThumbCircle) {
                context.beginPath();
                if (this._isVertical) {
                    context.arc(left + backgroundBoxThickness / 2, top + thumbPosition, radius, 0, 2 * Math.PI);
                }
                else {
                    context.arc(left + thumbPosition, top + (backgroundBoxThickness / 2), radius, 0, 2 * Math.PI);
                }
                context.fill();
                if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                    context.shadowBlur = 0;
                    context.shadowOffsetX = 0;
                    context.shadowOffsetY = 0;
                }
                context.strokeStyle = this._borderColor;
                context.stroke();
            }
            else {
                if (this._isVertical) {
                    context.fillRect(left - effectiveBarOffset, this._currentMeasure.top + thumbPosition, this._currentMeasure.width, effectiveThumbThickness);
                }
                else {
                    context.fillRect(this._currentMeasure.left + thumbPosition, this._currentMeasure.top, effectiveThumbThickness, this._currentMeasure.height);
                }
                if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                    context.shadowBlur = 0;
                    context.shadowOffsetX = 0;
                    context.shadowOffsetY = 0;
                }
                context.strokeStyle = this._borderColor;
                if (this._isVertical) {
                    context.strokeRect(left - effectiveBarOffset, this._currentMeasure.top + thumbPosition, this._currentMeasure.width, effectiveThumbThickness);
                }
                else {
                    context.strokeRect(this._currentMeasure.left + thumbPosition, this._currentMeasure.top, effectiveThumbThickness, this._currentMeasure.height);
                }
            }
        }
        context.restore();
    }

    // Events
    private _pointerIsDown = false;

    private _updateValueFromPointer(x: number, y: number): void {
        if (this.rotation != 0) {
            this._invertTransformMatrix.transformCoordinates(x, y, this._transformedPosition);
            x = this._transformedPosition.x;
            y = this._transformedPosition.y;
        }

        if (this._isVertical) {
            this.value = this._minimum + (1 - ((y - this._currentMeasure.top) / this._currentMeasure.height)) * (this._maximum - this._minimum);
        }
        else {
            this.value = this._minimum + ((x - this._currentMeasure.left) / this._currentMeasure.width) * (this._maximum - this._minimum);
        }
    }

    public _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean {
        if (!super._onPointerDown(target, coordinates, pointerId, buttonIndex)) {
            return false;
        }

        this._pointerIsDown = true;

        this._updateValueFromPointer(coordinates.x, coordinates.y);
        this._host._capturingControl[pointerId] = this;

        return true;
    }

    public _onPointerMove(target: Control, coordinates: Vector2): void {
        if (this._pointerIsDown) {
            this._updateValueFromPointer(coordinates.x, coordinates.y);
        }

        super._onPointerMove(target, coordinates);
    }

    public _onPointerUp(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean): void {
        this._pointerIsDown = false;

        delete this._host._capturingControl[pointerId];
        super._onPointerUp(target, coordinates, pointerId, buttonIndex, notifyClick);
    }
}
