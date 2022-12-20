import { ICanvasGradient, ICanvasRenderingContext } from "core/Engines/ICanvas";
import { BaseGradient } from "./BaseGradient";
import { RegisterClass } from "core/Misc/typeStore";
import { serialize } from "core/Misc/decorators";

/**
 * Gradient formed from two circles with their own centers and radius.
 * The coordinates of the circles centers are relative to the canvas' space, not to any control's space.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/createRadialGradient
 */
export class RadialGradient extends BaseGradient {
    private _x0: number;
    private _y0: number;
    private _r0: number;
    private _x1: number;
    private _y1: number;
    private _r1: number;

    /**
     * Creates a new radial gradient
     * @param x0 x coordinate of the first circle's center
     * @param y0 y coordinate of the first circle's center
     * @param r0 radius of the first circle
     * @param x1 x coordinate of the second circle's center
     * @param y1 y coordinate of the second circle's center
     * @param r1 radius of the second circle
     */
    constructor(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) {
        super();
        this._x0 = x0;
        this._y0 = y0;
        this._r0 = r0;
        this._x1 = x1;
        this._y1 = y1;
        this._r1 = r1;
    }

    protected _createCanvasGradient(context: ICanvasRenderingContext): ICanvasGradient {
        return context.createRadialGradient(this._x0, this._y0, this._r0, this._x1, this._y1, this._r1);
    }

    @serialize()
    public get x0() {
        return this._x0;
    }

    @serialize()
    public get x1() {
        return this._x1;
    }

    @serialize()
    public get y0() {
        return this._y0;
    }

    @serialize()
    public get y1() {
        return this._y1;
    }

    @serialize()
    public get r0() {
        return this._r0;
    }

    @serialize()
    public get r1() {
        return this._r1;
    }
}
RegisterClass("BABYLON.GUI.RadialGradient", RadialGradient);
