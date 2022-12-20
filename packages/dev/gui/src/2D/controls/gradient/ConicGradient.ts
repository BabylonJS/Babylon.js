import { ICanvasGradient, ICanvasRenderingContext } from "core/Engines/ICanvas";
import { BaseGradient } from "./BaseGradient";

export class ConicGradient extends BaseGradient {
    private _startAngle: number;
    private _x: number;
    private _y: number;

    constructor(startAngle: number, x: number, y: number) {
        super();
        this._startAngle = startAngle;
        this._x = x;
        this._y = y;
    }

    protected _createCanvasGradient(context: ICanvasRenderingContext): ICanvasGradient {
        return context.createConicGradient(this._startAngle, this._x, this._y);
    }
}
