import "core/Engines/Extensions/engine.dynamicTexture";

import type { ThinEngine } from "core/Engines/thinEngine";
import type { InternalTexture } from "core/Materials/Textures/internalTexture";
import type { IVector2Like } from "core/Maths/math.like";
import { ThinTexture } from "core/Materials/Textures/thinTexture";

import type { RawBezier, RawElement, RawFillShape, RawFont, RawGradientFillShape, RawPathShape, RawRectangleShape, RawStrokeShape, RawTextData, RawTextDocument } from "./rawTypes";

import type { BoundingBox } from "../maths/boundingBox";
import { GetShapesBoundingBox, GetTextBoundingBox } from "../maths/boundingBox";

import type { AnimationConfiguration } from "../animationConfiguration";

/**
 * Information about a sprite in the sprite atlas.
 */
export type SpriteAtlasInfo = {
    /**
     * Offset in the x axis of the sprite in the atlas.
     * Normalized between 0 and 1, left to right.
     */
    uOffset: number;
    /**
     * Offset in the y axis of the sprite in the atlas.
     * Normalized between 0 and 1, top to bottom.
     */
    vOffset: number;

    /**
     * Width of the sprite in the atlas.
     * In pixels.
     */
    cellWidth: number;

    /**
     * Height of the sprite in the atlas.
     * In pixels.
     */
    cellHeight: number;

    /**
     * Width of the sprite in the screen.
     * In pixels.
     */
    widthPx: number;
    /**
     * Height of the sprite in the screen.
     * In pixels.
     */
    heightPx: number;

    /**
     * X coordinate of the center of the sprite bounding box, used for final positioning in the screen
     */
    centerX: number;

    /**
     * Y coordinate of the center of the sprite bounding box, used for final positioning in the screen
     */
    centerY: number;
};

/**
 * Information about a gradient stop.
 * Used for gradient fills when adding vector shapes to the sprite atlas.
 */
type GradientStop = {
    offset: number;
    color: string;
};

/**
 * SpritePacker is a class that handles the packing of sprites into a texture atlas.
 */
export class SpritePacker {
    private readonly _engine: ThinEngine;
    private _atlasScale: number;
    private readonly _variables: Map<string, string>;
    private readonly _configuration: AnimationConfiguration;
    private _rawFonts: Map<string, RawFont> | undefined;

    private _spritesCanvas: OffscreenCanvas | HTMLCanvasElement;
    private _spritesCanvasContext: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
    private readonly _spritesInternalTexture: InternalTexture;
    private readonly _spritesTexture: ThinTexture;

    private _isDirty: boolean; // Indicates if the sprite atlas needs to be updated
    private _currentX: number;
    private _currentY: number;
    private _maxRowHeight: number; // Keep track of the maximum height of the current row to handle sprite packing correctly

    // Variable to avoid allocations
    private _spriteAtlasInfo: SpriteAtlasInfo;

    /**
     * Gets the texture atlas that contains all the sprites packed by this SpritePacker.
     * @returns The texture atlas containing the sprites.
     */
    public get texture(): ThinTexture {
        return this._spritesTexture;
    }

    /**
     * Sets the fonts that will be used to render text in the sprite atlas.
     * @param rawFonts A map of font names to RawFont objects.
     */
    public set rawFonts(rawFonts: Map<string, RawFont>) {
        this._rawFonts = rawFonts;
    }

    /**
     * Creates a new instance of SpritePacker.
     * @param engine Engine that will render the sprites.
     * @param isHtmlCanvas Whether we should render the atlas in an HTMLCanvasElement or an OffscreenCanvas.
     * @param atlasScale The atlas scale factor to apply to the sprites (always \>= 1 to keep sprites crisp).
     * @param variables Map of variables to replace in the animation file.
     * @param configuration Configuration options for the sprite packer.
     */
    public constructor(engine: ThinEngine, isHtmlCanvas: boolean, atlasScale: number, variables: Map<string, string>, configuration: AnimationConfiguration) {
        this._engine = engine;
        this._atlasScale = atlasScale;
        this._variables = variables;
        this._configuration = configuration;
        this._isDirty = false;
        this._currentX = this._configuration.gapSize;
        this._currentY = this._configuration.gapSize;
        this._maxRowHeight = 0;

        if (isHtmlCanvas) {
            this._spritesCanvas = document.createElement("canvas");
            this._spritesCanvas.width = this._configuration.spriteAtlasWidth;
            this._spritesCanvas.height = this._configuration.spriteAtlasHeight;
            this._spritesCanvasContext = this._spritesCanvas.getContext("2d") as CanvasRenderingContext2D;
        } else {
            this._spritesCanvas = new OffscreenCanvas(this._configuration.spriteAtlasWidth, this._configuration.spriteAtlasHeight);
            this._spritesCanvasContext = this._spritesCanvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
        }

        this._spritesInternalTexture = this._engine.createDynamicTexture(this._configuration.spriteAtlasWidth, this._configuration.spriteAtlasHeight, false, 2); // Linear filtering
        this._engine.updateDynamicTexture(this._spritesInternalTexture, this._spritesCanvas, false);

        this._spritesTexture = new ThinTexture(this._spritesInternalTexture);
        this._spritesTexture.wrapU = 0; // Disable wrapping
        this._spritesTexture.wrapV = 0; // Disable wrapping

        this._spriteAtlasInfo = {
            uOffset: 0,
            vOffset: 0,
            cellWidth: 0,
            cellHeight: 0,
            widthPx: 0,
            heightPx: 0,
            centerX: 0,
            centerY: 0,
        };
    }

    /**
     * Adds a vector shape that comes from lottie data to the sprite atlas.
     * @param rawElements The raw element that contains the paths and fills to add to the atlas.
     * @param scalingFactor The scaling factor to apply to the shape.
     * @returns The information on how to find the sprite in the atlas.
     */
    public addLottieShape(rawElements: RawElement[], scalingFactor: IVector2Like): SpriteAtlasInfo {
        const boundingBox = GetShapesBoundingBox(rawElements);

        scalingFactor.x = scalingFactor.x * this._atlasScale * this._configuration.devicePixelRatio;
        scalingFactor.y = scalingFactor.y * this._atlasScale * this._configuration.devicePixelRatio;

        // Calculate the size of the sprite in the atlas in pixels
        // This takes into account the scaling factor so in the call to _drawVectorShape the canvas will be scaled when rendering
        this._spriteAtlasInfo.cellWidth = boundingBox.width * scalingFactor.x;
        this._spriteAtlasInfo.cellHeight = boundingBox.height * scalingFactor.y;

        // Check if the sprite fits in the current row
        if (this._currentX + this._spriteAtlasInfo.cellWidth > this._configuration.spriteAtlasWidth) {
            // Add a gap between sprites to avoid bleeding issues
            this._currentX = this._configuration.gapSize;
            this._currentY += this._maxRowHeight + this._configuration.gapSize;
            this._maxRowHeight = 0;
        }

        // Draw the shape in the canvas
        this._drawVectorShape(rawElements, boundingBox, scalingFactor);
        this._isDirty = true;

        // Get the rest of the sprite information required to render the shape
        this._spriteAtlasInfo.uOffset = this._currentX / this._configuration.spriteAtlasWidth;
        this._spriteAtlasInfo.vOffset = this._currentY / this._configuration.spriteAtlasHeight;

        this._spriteAtlasInfo.widthPx = boundingBox.width;
        this._spriteAtlasInfo.heightPx = boundingBox.height;

        this._spriteAtlasInfo.centerX = boundingBox.offsetX;
        this._spriteAtlasInfo.centerY = boundingBox.offsetY;

        // Advance the current position for the next sprite
        this._currentX += this._spriteAtlasInfo.cellWidth + this._configuration.gapSize; // Add a gap between sprites to avoid bleeding
        this._maxRowHeight = Math.max(this._maxRowHeight, this._spriteAtlasInfo.cellHeight);

        return this._spriteAtlasInfo;
    }

    /**
     * Adds a text element that comes from lottie data to the sprite atlas.
     * @param textData The raw text data to add to the atlas.
     * @param scalingFactor The scaling factor to apply to the text.
     * @returns The information on how to find the sprite in the atlas.
     */
    public addLottieText(textData: RawTextData, scalingFactor: IVector2Like): SpriteAtlasInfo | undefined {
        if (this._rawFonts === undefined) {
            return undefined;
        }

        // If the text information is malformed and we can't get the bounding box, then just return
        const boundingBox = GetTextBoundingBox(this._spritesCanvasContext, textData, this._rawFonts, this._variables);
        if (boundingBox === undefined) {
            return undefined;
        }

        scalingFactor.x = scalingFactor.x * this._atlasScale * this._configuration.devicePixelRatio;
        scalingFactor.y = scalingFactor.y * this._atlasScale * this._configuration.devicePixelRatio;

        // Calculate the size of the sprite in the atlas in pixels
        // This takes into account the scaling factor so in the call to _drawText the canvas will be scaled when rendering
        this._spriteAtlasInfo.cellWidth = boundingBox.width * scalingFactor.x;
        this._spriteAtlasInfo.cellHeight = boundingBox.height * scalingFactor.y;

        // Find the position to draw the text
        // If the text doesn't fit in the current row, move to the next row
        if (this._currentX + this._spriteAtlasInfo.cellWidth > this._configuration.spriteAtlasWidth) {
            // Add a gap between sprites to avoid bleeding issues
            this._currentX = this._configuration.gapSize;
            this._currentY += this._maxRowHeight + this._configuration.gapSize;
            this._maxRowHeight = 0;
        }

        // Draw the text in the canvas
        this._drawText(textData, boundingBox, scalingFactor);
        this._isDirty = true;

        // Get the rest of the sprite information required to render the text
        this._spriteAtlasInfo.uOffset = this._currentX / this._configuration.spriteAtlasWidth;
        this._spriteAtlasInfo.vOffset = this._currentY / this._configuration.spriteAtlasHeight;

        this._spriteAtlasInfo.widthPx = boundingBox.width;
        this._spriteAtlasInfo.heightPx = boundingBox.height;

        this._spriteAtlasInfo.centerX = boundingBox.offsetX;
        this._spriteAtlasInfo.centerY = boundingBox.offsetY;

        // Advance the current position for the next sprite
        this._currentX += this._spriteAtlasInfo.cellWidth + this._configuration.gapSize; // Add a gap between sprites to avoid bleeding
        this._maxRowHeight = Math.max(this._maxRowHeight, this._spriteAtlasInfo.cellHeight);

        return this._spriteAtlasInfo;
    }

    /**
     * Updates the internal atlas texture with the information that has been added to the SpritePacker.
     */
    public updateAtlasTexture(): void {
        if (!this._isDirty) {
            return; // No need to update if nothing has changed
        }

        // Update the internal texture with the new canvas content
        this._engine.updateDynamicTexture(this._spritesInternalTexture, this._spritesCanvas, false);
        this._isDirty = false;
    }

    /**
     * Releases the canvas and its context to allow garbage collection.
     */
    public releaseCanvas(): void {
        this._spritesCanvasContext = undefined as any; // Clear the context to allow garbage collection
        this._spritesCanvas = undefined as any; // Clear the canvas to allow garbage collection
    }

    private _drawVectorShape(rawElements: RawElement[], boundingBox: BoundingBox, scalingFactor: IVector2Like): void {
        this._spritesCanvasContext.save();
        this._spritesCanvasContext.globalCompositeOperation = "destination-over";

        this._spritesCanvasContext.translate(this._currentX + Math.ceil(boundingBox.strokeInset / 2), this._currentY + Math.ceil(boundingBox.strokeInset / 2));
        this._spritesCanvasContext.scale(scalingFactor.x, scalingFactor.y);

        this._spritesCanvasContext.beginPath();

        for (let i = 0; i < rawElements.length; i++) {
            const shape = rawElements[i];
            switch (shape.ty) {
                case "rc":
                    this._drawRectangle(shape as RawRectangleShape);
                    break;
                case "sh":
                    this._drawPath(shape as RawPathShape, boundingBox);
                    break;
                case "fl":
                    this._drawFill(shape as RawFillShape);
                    break;
                case "st":
                    this._drawStroke(shape as RawStrokeShape);
                    break;
                case "gf":
                    this._drawGradientFill(shape as RawGradientFillShape, boundingBox);
                    break;
                case "tr":
                    break; // Nothing needed with transforms
            }
        }

        this._spritesCanvasContext.restore();
    }

    // This function assumes that GetTextBoundingBox has already been called as to measure the text
    // we need to setup the canvas context with the correct font and styles, so we don't set them up here
    // again, but we still need to make sure to restore the context when we are done
    private _drawText(textData: RawTextData, boundingBox: BoundingBox, scalingFactor: IVector2Like): void {
        if (this._rawFonts === undefined) {
            this._spritesCanvasContext.restore();
            return;
        }

        this._spritesCanvasContext.translate(this._currentX, this._currentY);
        this._spritesCanvasContext.scale(scalingFactor.x, scalingFactor.y);

        let textInfo: RawTextDocument | undefined = undefined;
        textInfo = textData.d.k[0].s as RawTextDocument;

        if (textInfo.fc !== undefined && textInfo.fc.length >= 3) {
            const rawFillStyle = textInfo.fc;
            if (Array.isArray(rawFillStyle)) {
                // If the fill style is an array, we assume it's a color array
                this._spritesCanvasContext.fillStyle = this._lottieColorToCSSColor(rawFillStyle, 1);
            } else {
                // If it's a string, we need to get the value from the variables map
                const variableFillStyle = this._variables.get(rawFillStyle);
                if (variableFillStyle !== undefined) {
                    this._spritesCanvasContext.fillStyle = variableFillStyle;
                }
            }
        }

        if (textInfo.sc !== undefined && textInfo.sc.length >= 3 && textInfo.sw !== undefined && textInfo.sw > 0) {
            this._spritesCanvasContext.strokeStyle = this._lottieColorToCSSColor(textInfo.sc, 1);
        }

        // Text is supported as a possible variable (for localization for example)
        // Check if the text is a variable and replace it if it is
        let text = textInfo.t;
        const variableText = this._variables.get(text);
        if (variableText !== undefined) {
            text = variableText;
        }

        this._spritesCanvasContext.fillText(text, 0, boundingBox.actualBoundingBoxAscent!);
        if (textInfo.sc !== undefined && textInfo.sc.length >= 3 && textInfo.sw !== undefined && textInfo.sw > 0 && textInfo.of === true) {
            this._spritesCanvasContext.strokeText(text, 0, boundingBox.actualBoundingBoxAscent!);
        }

        this._spritesCanvasContext.restore();
    }

    private _drawRectangle(shape: RawRectangleShape): void {
        const size = shape.s.k as number[];
        const radius = shape.r.k as number;

        if (radius <= 0) {
            this._spritesCanvasContext.rect(0, 0, size[0], size[1]);
        } else {
            this._spritesCanvasContext.roundRect(0, 0, size[0], size[1], radius);
        }
    }

    private _drawPath(shape: RawPathShape, boundingBox: BoundingBox): void {
        // The path data has to be translated to the center of the bounding box
        // If the paths have stroke, we need to account for the stroke width
        const pathData = shape.ks.k as RawBezier;
        const xTranslate = boundingBox.centerX - Math.ceil(boundingBox.strokeInset);
        const yTranslate = boundingBox.centerY - Math.ceil(boundingBox.strokeInset);

        const vertices = pathData.v;
        const inTangents = pathData.i;
        const outTangents = pathData.o;

        if (vertices.length > 0) {
            this._spritesCanvasContext.moveTo(vertices[0][0] + xTranslate, vertices[0][1] + yTranslate);

            for (let i = 0; i < vertices.length - 1; i++) {
                const start = vertices[i];
                const end = vertices[i + 1];
                const outTangent = outTangents[i];
                const inTangent = inTangents[i + 1];

                this._spritesCanvasContext.bezierCurveTo(
                    start[0] + xTranslate + outTangent[0],
                    start[1] + yTranslate + outTangent[1],
                    end[0] + xTranslate + inTangent[0],
                    end[1] + yTranslate + inTangent[1],
                    end[0] + xTranslate,
                    end[1] + yTranslate
                );
            }

            if (pathData.c) {
                // Close path with curve from last to first point
                const start = vertices[vertices.length - 1];
                const end = vertices[0];
                const outTangent = outTangents[vertices.length - 1];
                const inTangent = inTangents[0];

                this._spritesCanvasContext.bezierCurveTo(
                    start[0] + xTranslate + outTangent[0],
                    start[1] + yTranslate + outTangent[1],
                    end[0] + xTranslate + inTangent[0],
                    end[1] + yTranslate + inTangent[1],
                    end[0] + xTranslate,
                    end[1] + yTranslate
                );

                this._spritesCanvasContext.closePath();
            }
        }
    }

    private _drawFill(fill: RawFillShape): void {
        const color = this._lottieColorToCSSColor(fill.c.k as number[], (fill.o.k as number) / 100);
        this._spritesCanvasContext.fillStyle = color;

        this._spritesCanvasContext.fill();
    }

    private _drawStroke(stroke: RawStrokeShape): void {
        // Color and opacity
        const opacity = (stroke.o?.k as number) ?? 100;
        const color = this._lottieColorToCSSColor((stroke.c?.k as number[]) ?? [0, 0, 0], opacity / 100);
        this._spritesCanvasContext.strokeStyle = color;

        // Width
        const width = (stroke.w?.k as number) ?? 1;
        this._spritesCanvasContext.lineWidth = width;

        // Line cap
        switch (stroke.lc) {
            case 1:
                this._spritesCanvasContext.lineCap = "butt";
                break;
            case 2:
                this._spritesCanvasContext.lineCap = "round";
                break;
            case 3:
                this._spritesCanvasContext.lineCap = "square";
                break;
            default:
                // leave default
                break;
        }

        // Line join
        switch (stroke.lj) {
            case 1:
                this._spritesCanvasContext.lineJoin = "miter";
                break;
            case 2:
                this._spritesCanvasContext.lineJoin = "round";
                break;
            case 3:
                this._spritesCanvasContext.lineJoin = "bevel";
                break;
            default:
                // leave default
                break;
        }

        // Miter limit
        if (stroke.ml !== undefined) {
            this._spritesCanvasContext.miterLimit = stroke.ml;
        }

        // Dash pattern
        const dashes = stroke.d;
        if (dashes !== undefined) {
            const lineDashes: number[] = [];
            for (let i = 0; i < dashes.length; i++) {
                if (dashes[i].n === "d") {
                    lineDashes.push(dashes[i].v.k as number);
                }
            }

            this._spritesCanvasContext.setLineDash(lineDashes);
        }

        this._spritesCanvasContext.stroke();
    }

    private _drawGradientFill(fill: RawGradientFillShape, boundingBox: BoundingBox): void {
        switch (fill.t) {
            case 1: {
                this._drawLinearGradientFill(fill, boundingBox);
                break;
            }
            case 2: {
                this._drawRadialGradientFill(fill, boundingBox);
                break;
            }
        }
    }

    private _drawLinearGradientFill(fill: RawGradientFillShape, boundingBox: BoundingBox): void {
        // We need to translate the gradient to the center of the bounding box
        const xTranslate = boundingBox.centerX;
        const yTranslate = boundingBox.centerY;

        // Create the gradient
        const startPoint = fill.s.k as number[];
        const endPoint = fill.e.k as number[];
        const gradient = this._spritesCanvasContext.createLinearGradient(
            startPoint[0] + xTranslate,
            startPoint[1] + yTranslate,
            endPoint[0] + xTranslate,
            endPoint[1] + yTranslate
        );

        this._addColorStops(gradient, fill);

        this._spritesCanvasContext.fillStyle = gradient;
        this._spritesCanvasContext.fill();
    }

    private _drawRadialGradientFill(fill: RawGradientFillShape, boundingBox: BoundingBox): void {
        // We need to translate the gradient to the center of the bounding box
        const xTranslate = boundingBox.centerX;
        const yTranslate = boundingBox.centerY;

        // Create the gradient
        const startPoint = fill.s.k as number[];
        const endPoint = fill.e.k as number[];

        const centerX = startPoint[0] + xTranslate;
        const centerY = startPoint[1] + yTranslate;
        const outerRadius = Math.hypot(endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]);
        const gradient = this._spritesCanvasContext.createRadialGradient(centerX, centerY, 0, centerX, centerY, outerRadius);

        this._addColorStops(gradient, fill);

        this._spritesCanvasContext.fillStyle = gradient;
        this._spritesCanvasContext.fill();
    }

    private _addColorStops(gradient: CanvasGradient, fill: RawGradientFillShape): void {
        const stops = fill.g.p;
        const rawColors = fill.g.k.k;

        let stopsData: GradientStop[] | undefined = undefined;
        if (rawColors.length / stops === 4) {
            // Offset + RGB
            stopsData = this._gradientColorsToCssColor(rawColors, stops, false);
        } else if (rawColors.length / stops === 6) {
            // Offset + RGB + Offset + Alpha
            stopsData = this._gradientColorsToCssColor(rawColors, stops, true);
        } else {
            return;
        }

        for (let i = 0; i < stops; i++) {
            gradient.addColorStop(stopsData[i].offset, stopsData[i].color);
        }
    }

    private _gradientColorsToCssColor(colors: number[], stops: number, hasAlpha: boolean): GradientStop[] {
        const result: GradientStop[] = [];
        for (let i = 0; i < stops; i++) {
            const index = i * 4;
            result.push({
                offset: colors[index],
                color: this._lottieColorToCSSColor(colors.slice(index + 1, index + 4), hasAlpha ? colors[stops * 4 + i * 2 + 1] : 1),
            });
        }

        return result;
    }

    private _lottieColorToCSSColor(color: number[], opacity: number): string {
        if (color.length !== 3 && color.length !== 4) {
            return "rgba(0, 0, 0, 1)"; // Default to black if invalid
        }

        const r = Math.round(color[0] * 255);
        const g = Math.round(color[1] * 255);
        const b = Math.round(color[2] * 255);
        const a = (color[3] || 1) * opacity;

        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
}
