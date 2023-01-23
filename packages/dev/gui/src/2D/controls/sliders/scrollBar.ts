import type { Vector2 } from "core/Maths/math.vector";
import { BaseSlider } from "./baseSlider";
import type { Control } from "../control";
import { Measure } from "../../measure";
import type { PointerInfoBase } from "core/Events/pointerEvents";
import { serialize } from "core/Misc/decorators";
import type { ICanvasRenderingContext } from "core/Engines/ICanvas";
import type { Nullable } from "core/types";
import type { BaseGradient } from "../gradient/BaseGradient";
import type { AdvancedDynamicTexture } from "gui/2D/advancedDynamicTexture";
import { Tools } from "core/Misc/tools";
import { RegisterClass } from "core/Misc/typeStore";

/**
 * Class used to create slider controls
 */
export class ScrollBar extends BaseSlider {
    private _background = "black";
    private _borderColor = "white";
    private _tempMeasure = new Measure(0, 0, 0, 0);
    private _invertScrollDirection = false;
    private _backgroundGradient: Nullable<BaseGradient> = null;

    /** Gets or sets border color */
    @serialize()
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

    /** Gets or sets background gradient. Takes precedence over gradient. */
    public get backgroundGradient(): Nullable<BaseGradient> {
        return this._backgroundGradient;
    }

    public set backgroundGradient(value: Nullable<BaseGradient>) {
        if (this._backgroundGradient === value) {
            return;
        }

        this._backgroundGradient = value;
        this._markAsDirty();
    }

    /** Inverts the scrolling direction (default: false) */
    @serialize()
    public get invertScrollDirection() {
        return this._invertScrollDirection;
    }

    public set invertScrollDirection(invert: boolean) {
        this._invertScrollDirection = invert;
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
        let thumbThickness = 0;
        if (this._thumbWidth.isPixel) {
            thumbThickness = this._thumbWidth.getValue(this._host);
        } else {
            thumbThickness = this._backgroundBoxThickness * this._thumbWidth.getValue(this._host);
        }
        return thumbThickness;
    }

    private _getBackgroundColor(context: ICanvasRenderingContext) {
        return this._backgroundGradient ? this._backgroundGradient.getCanvasGradient(context) : this._background;
    }

    public _draw(context: ICanvasRenderingContext): void {
        context.save();

        this._applyStates(context);
        this._prepareRenderingData("rectangle");
        const left = this._renderLeft;

        const thumbPosition = this._getThumbPosition();
        context.fillStyle = this._getBackgroundColor(context);

        context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);

        // Value bar
        context.fillStyle = this._getColor(context);

        // Thumb
        if (this.isVertical) {
            this._tempMeasure.left = left - this._effectiveBarOffset;
            this._tempMeasure.top = this._currentMeasure.top + thumbPosition;
            this._tempMeasure.width = this._currentMeasure.width;
            this._tempMeasure.height = this._effectiveThumbThickness;
        } else {
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

    /**
     * @internal
     */
    protected _updateValueFromPointer(x: number, y: number): void {
        if (this.rotation != 0) {
            this._invertTransformMatrix.transformCoordinates(x, y, this._transformedPosition);
            x = this._transformedPosition.x;
            y = this._transformedPosition.y;
        }

        const sign = this._invertScrollDirection ? -1 : 1;

        if (this._first) {
            this._first = false;
            this._originX = x;
            this._originY = y;

            // Check if move is required
            if (
                x < this._tempMeasure.left ||
                x > this._tempMeasure.left + this._tempMeasure.width ||
                y < this._tempMeasure.top ||
                y > this._tempMeasure.top + this._tempMeasure.height
            ) {
                if (this.isVertical) {
                    this.value = this.minimum + (1 - (y - this._currentMeasure.top) / this._currentMeasure.height) * (this.maximum - this.minimum);
                } else {
                    this.value = this.minimum + ((x - this._currentMeasure.left) / this._currentMeasure.width) * (this.maximum - this.minimum);
                }
            }
        }

        // Delta mode
        let delta = 0;
        if (this.isVertical) {
            delta = -((y - this._originY) / (this._currentMeasure.height - this._effectiveThumbThickness));
        } else {
            delta = (x - this._originX) / (this._currentMeasure.width - this._effectiveThumbThickness);
        }

        this.value += sign * delta * (this.maximum - this.minimum);

        this._originX = x;
        this._originY = y;
    }

    public _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, pi: PointerInfoBase): boolean {
        this._first = true;

        return super._onPointerDown(target, coordinates, pointerId, buttonIndex, pi);
    }

    public serialize(serializationObject: any) {
        super.serialize(serializationObject);

        if (this.backgroundGradient) {
            serializationObject.backgroundGradient = {};
            this.backgroundGradient.serialize(serializationObject.backgroundGradient);
        }
    }

    public _parseFromContent(serializationObject: any, host: AdvancedDynamicTexture) {
        super._parseFromContent(serializationObject, host);

        if (serializationObject.backgroundGradient) {
            const className = Tools.Instantiate("BABYLON.GUI." + serializationObject.backgroundGradient.className);
            this.backgroundGradient = new className();
            this.backgroundGradient!.parse(serializationObject.backgroundGradient);
        }
    }
}
RegisterClass("BABYLON.GUI.Scrollbar", ScrollBar);
