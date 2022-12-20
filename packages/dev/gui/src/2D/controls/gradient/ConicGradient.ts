import { ICanvasGradient, ICanvasRenderingContext } from "core/Engines/ICanvas";
import { BaseGradient } from "./BaseGradient";
import { RegisterClass } from "core/Misc/typeStore";
import { serialize } from "core/Misc/decorators";

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

    @serialize()
    public get startAngle() {
        return this._startAngle;
    }

    public get x() {
        return this._x;
    }

    public get y() {
        return this._y;
    }

    public getClassName() {
        return "ConicGradient";
    }
}
RegisterClass("BABYLON.GUI.ConicGradient", ConicGradient);
