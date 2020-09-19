import { Vector2 } from "babylonjs/Maths/math.vector";
import { BaseSlider } from "./baseSlider";
import { Control } from "../control";
import { Measure } from "../../measure";

/**
 * Class used to create slider controls
 */
export class ScrollBar extends BaseSlider {
    private _background = "black";
    private _borderColor = "white";
    private _tempMeasure = new Measure(0, 0, 0, 0);

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

    /**
     * Creates a new Slider
     * @param name defines the control name
     */
    constructor(public name?: string) {
        super(name);
    }

    protected _getTypeName(): string {
        return "Scrollbar";
    }

    protected _getThumbThickness(): number {
        var thumbThickness = 0;
        if (this._thumbWidth.isPixel) {
            thumbThickness = this._thumbWidth.getValue(this._host);
        }
        else {
            thumbThickness = this._backgroundBoxThickness * this._thumbWidth.getValue(this._host);
        }
        return thumbThickness;
    }

    public _draw(context: CanvasRenderingContext2D): void {
        context.save();

        this._applyStates(context);
        this._prepareRenderingData("rectangle");
        var left = this._renderLeft;

        const thumbPosition = this._getThumbPosition();
        context.fillStyle = this._background;

        context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);

        // Value bar
        context.fillStyle = this.color;

        // Thumb
        if (this.isVertical) {
            this._tempMeasure.left = left - this._effectiveBarOffset;
            this._tempMeasure.top = this._currentMeasure.top + thumbPosition;
            this._tempMeasure.width = this._currentMeasure.width;
            this._tempMeasure.height = this._effectiveThumbThickness;
        }
        else {
            this._tempMeasure.left = this._currentMeasure.left + thumbPosition;
            this._tempMeasure.top = this._currentMeasure.top;
            this._tempMeasure.width = this._effectiveThumbThickness;
            this._tempMeasure.height = this._currentMeasure.height;
        }

        context.fillRect(this._tempMeasure.left, this._tempMeasure.top, this._tempMeasure.width, this._tempMeasure.height);

        context.restore();
    }

    private _first: boolean;
    private _originX: number;
    private _originY: number;

    /** @hidden */
    protected _updateValueFromPointer(x: number, y: number): void {
        if (this.rotation != 0) {
            this._invertTransformMatrix.transformCoordinates(x, y, this._transformedPosition);
            x = this._transformedPosition.x;
            y = this._transformedPosition.y;
        }

        if (this._first) {
            this._first = false;
            this._originX = x;
            this._originY = y;

            // Check if move is required
            if (x < this._tempMeasure.left || x > this._tempMeasure.left + this._tempMeasure.width || y < this._tempMeasure.top || y > this._tempMeasure.top + this._tempMeasure.height) {
                if (this.isVertical) {
                    this.value = this.minimum + (1 - ((y - this._currentMeasure.top) / this._currentMeasure.height)) * (this.maximum - this.minimum);
                }
                else {
                    this.value = this.minimum + ((x - this._currentMeasure.left) / this._currentMeasure.width) * (this.maximum - this.minimum);
                }
            }
        }

        // Delta mode
        let delta = 0;
        if (this.isVertical) {
            delta = -((y - this._originY) / (this._currentMeasure.height - this._effectiveThumbThickness));
        }
        else {
            delta = (x - this._originX) / (this._currentMeasure.width - this._effectiveThumbThickness);
        }

        this.value += delta * (this.maximum - this.minimum);

        this._originX = x;
        this._originY = y;
    }

    public _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean {
        this._first = true;

        return super._onPointerDown(target, coordinates, pointerId, buttonIndex);
    }
}
