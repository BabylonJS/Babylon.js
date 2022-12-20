import type { ICanvasGradient, ICanvasRenderingContext } from "core/Engines/ICanvas";
import { BaseGradient } from "./BaseGradient";
import { RegisterClass } from "core/Misc/typeStore";
import { serialize } from "core/Misc/decorators";

/**
 * Gradient along a circle with center at given (x, y) coordinates
 * These coordinates are relative to the canvas' space, not to any control's space.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/createConicGradient
 */
export class ConicGradient extends BaseGradient {
    private _startAngle: number;
    private _x: number;
    private _y: number;

    /**
     * Creates a new conic gradient
     * @param startAngle starting angle of the circle. The angle direction is clockwise.
     * @param x
     * @param y
     */
    constructor(startAngle: number, x: number, y: number) {
        super();
        this._startAngle = startAngle;
        this._x = x;
        this._y = y;
    }

    protected _createCanvasGradient(context: ICanvasRenderingContext): ICanvasGradient {
        return context.createConicGradient(this._startAngle, this._x, this._y);
    }

    @serialize()
    public get startAngle() {
        return this._startAngle;
    }

    @serialize()
    public get x() {
        return this._x;
    }

    @serialize()
    public get y() {
        return this._y;
    }

    public getClassName() {
        return "ConicGradient";
    }
}
RegisterClass("BABYLON.GUI.ConicGradient", ConicGradient);
