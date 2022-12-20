/*
 * Base Gradient class. Should not be used directly.
 */

import { ICanvasGradient, ICanvasRenderingContext } from "core/Engines/ICanvas";
import { serialize } from "core/Misc/decorators";

/**
 * Class that represents a single stop on the gradient.
 */
export class ColorStop {
    @serialize()
    public offset: number;

    @serialize()
    public color: string;

    /**
     * Build a new Color Stop
     * @param offset the offset of the stop. Should be between 0 and 1
     * @param color the color of the stop
     */
    constructor(offset: number, color: string) {
        this.offset = offset;

        this.color = color;
    }

    public getClassName() {
        return "ColorStop";
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

    private _addColorStopsToCanvasGradient() {
        for (const stop of this._colorStops) {
            this._canvasGradient.addColorStop(stop.offset, stop.color);
        }
    }

    public getCanvasGradient(context: ICanvasRenderingContext) {
        if (this._gradientDirty || this._context !== context) {
            this._context = context;
            this._canvasGradient = this._createCanvasGradient(context);
            this._addColorStopsToCanvasGradient();
            this._gradientDirty = false;
        }
        return this._canvasGradient;
    }

    /**
     * Adds a new color stop to the gradient.
     * @param offset the offset of the stop on the gradient. Should be between 0 and 1
     * @param color the color of the stop
     */
    public addColorStop(offset: number, color: string) {
        this._colorStops.push(new ColorStop(offset, color));
        this._gradientDirty = true;
    }

    /**
     * Removes an existing color stop with the specified offset from the gradient
     * @param offset the offset of the stop to be removed
     */
    public removeColorStop(offset: number) {
        this._colorStops = this._colorStops.filter((colorStop) => colorStop.offset !== offset);
        this._gradientDirty = true;
    }

    /**
     * Removes all color stops from the gradient
     */
    public clearColorStops() {
        this._colorStops = [];
        this._gradientDirty = true;
    }

    @serialize()
    public get colorStops() {
        return this._colorStops;
    }

    public getClassName() {
        return "BaseGradient";
    }
}
