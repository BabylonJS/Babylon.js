/*
 * Base Gradient class. Should not be used directly.
 */

import type { ICanvasGradient, ICanvasRenderingContext } from "core/Engines/ICanvas";

/**
 * Type that represents a single stop on the gradient.
 */
export type GradientColorStop = {
    /**
     * Offset from the start where the color will be applied.
     */
    offset: number;
    /**
     * Color to be applied.
     */
    color: string;
};

/**
 * Class that serves as a base for all the gradients created from context.
 */
export abstract class BaseGradient {
    private _colorStops: GradientColorStop[] = [];

    private _canvasGradient: CanvasGradient;
    private _context: ICanvasRenderingContext;
    private _gradientDirty: boolean = true;

    /**
     * Overwritten by child classes to create the canvas gradient.
     * @param context
     */
    protected abstract _createCanvasGradient(context: ICanvasRenderingContext): ICanvasGradient;

    private _addColorStopsToCanvasGradient() {
        for (const stop of this._colorStops) {
            this._canvasGradient.addColorStop(stop.offset, stop.color);
        }
    }

    /**
     * If there are any changes or the context changed, regenerate the canvas gradient object. Else,
     * reuse the existing gradient.
     * @param context the context to create the gradient from
     * @returns the canvas gradient
     */
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
        this._colorStops.push({ offset, color });
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

    /**
     * Color stops of the gradient
     */
    public get colorStops() {
        return this._colorStops;
    }

    /**
     * @returns Type of the gradient
     */
    public getClassName() {
        return "BaseGradient";
    }

    /**
     * Serialize into a json object
     * @param serializationObject object to serialize into
     */
    public serialize(serializationObject: any) {
        serializationObject.colorStops = this._colorStops;
        serializationObject.className = this.getClassName();
    }

    /**
     * Parse from json object
     * @param serializationObject object to parse from
     */
    public parse(serializationObject: any) {
        this._colorStops = serializationObject.colorStops;
    }
}
