/*
 * Base Gradient class. Should not be used directly.
 */

import { ICanvasGradient, ICanvasRenderingContext } from "core/Engines/ICanvas";

export class ColorStop {
    public offset: number;

    public color: string;

    constructor(offset: number, color: string) {
        this.offset = offset;

        this.color = color;
    }
}

export class BaseGradient {
    private _colorStops: ColorStop[];

    private _canvasGradient: CanvasGradient;
    private _context: ICanvasRenderingContext;
    private _gradientDirty: boolean = true;

    constructor() {
        this._colorStops = [];
    }

    /**
     * Overwritten by child classes to create the canvas gradient.
     * @param context
     */
    protected _createCanvasGradient(context: ICanvasRenderingContext): ICanvasGradient {
        throw new Error("BaseGradient shouldn't be used directly.");
    }

    private _addColorStops() {
        for (const stop of this._colorStops) {
            this._canvasGradient.addColorStop(stop.offset, stop.color);
        }
    }

    public getCanvasGradient(context: ICanvasRenderingContext) {
        if (this._gradientDirty || this._context !== context) {
            this._context = context;
            this._canvasGradient = this._createCanvasGradient(context);
            this._addColorStops();
            this._gradientDirty = false;
        }
        return this._canvasGradient;
    }

    public addColorStop(offset: number, color: string) {
        this._colorStops.push(new ColorStop(offset, color));
        this._gradientDirty = true;
    }

    public removeColorStop(offset: number) {
        this._colorStops = this._colorStops.filter((colorStop) => colorStop.offset !== offset);
        this._gradientDirty = true;
    }

    public clearColorStops() {
        this._colorStops = [];
        this._gradientDirty = true;
    }
}
