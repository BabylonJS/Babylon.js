import type { ICanvasGradient, ICanvasRenderingContext } from "core/Engines/ICanvas";
import { BaseGradient } from "./BaseGradient";
import { RegisterClass } from "core/Misc/typeStore";

/**
 * Gradient along a line that connects two coordinates.
 * These coordinates are relative to the canvas' space, not to any control's space.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/createLinearGradient
 */
export class LinearGradient extends BaseGradient {
    private _x0: number;
    private _y0: number;
    private _x1: number;
    private _y1: number;

    /**
     * Creates a new linear gradient
     * @param x0
     * @param y0
     * @param x1
     * @param y1
     */
    constructor(x0?: number, y0?: number, x1?: number, y1?: number) {
        super();
        this._x0 = x0 ?? 0;
        this._y0 = y0 ?? 0;
        this._x1 = x1 ?? 0;
        this._y1 = y1 ?? 0;
    }

    protected _createCanvasGradient(context: ICanvasRenderingContext): ICanvasGradient {
        return context.createLinearGradient(this._x0, this._y0, this._x1, this._y1);
    }

    public get x0() {
        return this._x0;
    }

    public get x1() {
        return this._x1;
    }

    public get y0() {
        return this._y0;
    }

    public get y1() {
        return this._y1;
    }

    public getClassName(): string {
        return "LinearGradient";
    }

    public serialize(serializationObject: any): void {
        super.serialize(serializationObject);
        serializationObject.x0 = this._x0;
        serializationObject.y0 = this._y0;
        serializationObject.x1 = this._x1;
        serializationObject.y1 = this._y1;
    }

    public parse(serializationObject: any): void {
        super.parse(serializationObject);
        this._x0 = serializationObject.x0;
        this._y0 = serializationObject.y0;
        this._x1 = serializationObject.x1;
        this._y1 = serializationObject.y1;
    }
}
RegisterClass("BABYLON.GUI.LinearGradient", LinearGradient);
