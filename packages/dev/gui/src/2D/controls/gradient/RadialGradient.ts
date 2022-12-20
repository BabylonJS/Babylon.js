import { ICanvasGradient, ICanvasRenderingContext } from "core/Engines/ICanvas";
import { BaseGradient } from "./BaseGradient";

export class RadialGradient extends BaseGradient {
    private _x0: number;
    private _y0: number;
    private _r0: number;
    private _x1: number;
    private _y1: number;
    private _r1: number;

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
}
