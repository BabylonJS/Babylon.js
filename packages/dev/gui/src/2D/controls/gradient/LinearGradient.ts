import { ICanvasGradient, ICanvasRenderingContext } from "core/Engines/ICanvas";
import { BaseGradient } from "./BaseGradient";
import { RegisterClass } from "core/Misc/typeStore";
import { serialize } from "core/Misc/decorators";

export class LinearGradient extends BaseGradient {
    private _x0: number;
    private _y0: number;
    private _x1: number;
    private _y1: number;

    constructor(x0: number, y0: number, x1: number, y1: number) {
        super();
        this._x0 = x0;
        this._y0 = y0;
        this._x1 = x1;
        this._y1 = y1;
    }

    protected _createCanvasGradient(context: ICanvasRenderingContext): ICanvasGradient {
        return context.createLinearGradient(this._x0, this._y0, this._x1, this._y1);
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
}
RegisterClass("BABYLON.GUI.LinearGradient", LinearGradient);
