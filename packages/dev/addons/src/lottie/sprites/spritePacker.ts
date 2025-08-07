import "core/Engines/Extensions/engine.dynamicTexture";

import type { ThinEngine } from "core/Engines/thinEngine";
import type { InternalTexture } from "core/Materials/Textures/internalTexture";
import type { IVector2Like } from "core/Maths/math.like";
import { ThinTexture } from "core/Materials/Textures/thinTexture";

import type { RawBezier, RawFillShape, RawGradientFillShape, RawPathShape, RawRectangleShape, RawGroupShape } from "../lottie/rawTypes";

import type { BoundingBox } from "../maths/boundingBox";
import { GetBoundingBox } from "../maths/boundingBox";

import type { AnimationConfiguration } from "../lottiePlayer";

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
    private readonly _configuration: AnimationConfiguration;

    private _spritesCanvas: OffscreenCanvas;
    private _spritesCanvasContext: OffscreenCanvasRenderingContext2D;
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
     * Creates a new instance of SpritePacker.
     * @param engine Engine that will render the sprites.
     * @param configuration Configuration options for the sprite packer.
     */
    public constructor(engine: ThinEngine, configuration: AnimationConfiguration) {
        this._engine = engine;
        this._configuration = configuration;
        this._isDirty = false;
        this._currentX = 0;
        this._currentY = 0;
        this._maxRowHeight = 0;

        this._spritesCanvas = new OffscreenCanvas(this._configuration.spriteAtlasSize, this._configuration.spriteAtlasSize);
        this._spritesCanvasContext = this._spritesCanvas.getContext("2d") as OffscreenCanvasRenderingContext2D;

        this._spritesInternalTexture = this._engine.createDynamicTexture(this._configuration.spriteAtlasSize, this._configuration.spriteAtlasSize, false, 2); // Linear filtering
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
     * @param rawGroup The raw group shape to add to the atlas.
     * @param scalingFactor The scaling factor to apply to the shape.
     * @returns The information on how to find the sprite in the atlas.
     */
    public addLottieShape(rawGroup: RawGroupShape, scalingFactor: IVector2Like): SpriteAtlasInfo {
        const boundingBox = GetBoundingBox(rawGroup);
        this._spriteAtlasInfo.cellWidth = boundingBox.width * scalingFactor.x;
        this._spriteAtlasInfo.cellHeight = boundingBox.height * scalingFactor.y;

        this._spriteAtlasInfo.centerX = boundingBox.centerX;
        this._spriteAtlasInfo.centerY = boundingBox.centerY;

        // Check if the sprite fits in the current row
        if (this._currentX + this._spriteAtlasInfo.cellWidth > this._configuration.spriteAtlasSize) {
            this._currentX = 0;
            this._currentY += this._maxRowHeight + this._configuration.gapSize; // Add a gap between sprites to avoid bleeding
            this._maxRowHeight = 0;
        }

        // Normalize the x/y offsets in texture coordinates (0 to 1)
        this._spriteAtlasInfo.uOffset = this._currentX / this._configuration.spriteAtlasSize;
        this._spriteAtlasInfo.vOffset = this._currentY / this._configuration.spriteAtlasSize;

        this._drawVectorShape(rawGroup, boundingBox, scalingFactor);

        this._currentX += this._spriteAtlasInfo.cellWidth + this._configuration.gapSize; // Add a gap between sprites to avoid bleeding
        this._maxRowHeight = Math.max(this._maxRowHeight, this._spriteAtlasInfo.cellHeight);

        this._spriteAtlasInfo.widthPx = boundingBox.width;
        this._spriteAtlasInfo.heightPx = boundingBox.height;

        this._isDirty = true;

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

    private _drawVectorShape(rawGroup: RawGroupShape, boundingBox: BoundingBox, scalingFactor: IVector2Like): void {
        this._spritesCanvasContext.save();

        this._spritesCanvasContext.translate(this._currentX, this._currentY);
        this._spritesCanvasContext.scale(scalingFactor.x, scalingFactor.y);

        this._spritesCanvasContext.beginPath();
        if (rawGroup.it) {
            for (let i = 0; i < rawGroup.it.length; i++) {
                const shape = rawGroup.it[i];
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
                    case "gf":
                        this._drawGradientFill(shape as RawGradientFillShape, boundingBox);
                        break;
                    default:
                        break;
                }
            }
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
        const pathData = shape.ks.k as RawBezier;
        const xTranslate = boundingBox.width / 2 - boundingBox.centerX;
        const yTranslate = boundingBox.height / 2 - boundingBox.centerY;

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
        const xTranslate = boundingBox.width / 2 - boundingBox.centerX;
        const yTranslate = boundingBox.height / 2 - boundingBox.centerY;

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
        const xTranslate = boundingBox.width / 2 - boundingBox.centerX;
        const yTranslate = boundingBox.height / 2 - boundingBox.centerY;

        // Create the gradient
        const startPoint = fill.s.k as number[];
        const endPoint = fill.e.k as number[];

        const gradient = this._spritesCanvasContext.createRadialGradient(
            startPoint[0] + xTranslate,
            startPoint[1] + yTranslate,
            0,
            endPoint[0] + xTranslate,
            endPoint[1] + yTranslate,
            Math.hypot(endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]) // End radius
        );

        this._addColorStops(gradient, fill);

        this._spritesCanvasContext.fillStyle = gradient;
        this._spritesCanvasContext.fill();
    }

    private _addColorStops(gradient: CanvasGradient, fill: RawGradientFillShape): void {
        const stops = fill.g.p;
        const rawColors = fill.g.k.k;

        let stopsData: GradientStop[] | undefined = undefined;
        if (rawColors.length / stops === 4) {
            stopsData = this._gradientColorsToCssColor(rawColors, stops, false);
        } else if (rawColors.length / stops === 6) {
            stopsData = this._gradientColorsToCssColor(rawColors, stops, true);
        } else {
            return;
        }

        for (let i = 0; i < stops; i++) {
            gradient.addColorStop(stopsData[i].offset, stopsData[i].color);
        }
    }

    private _gradientColorsToCssColor(colors: number[], stops: number, hasAlpha: boolean): GradientStop[] {
        const skipElement = hasAlpha ? 0 : 1;
        const result: GradientStop[] = [];
        for (let i = 0; i < stops; i++) {
            const index = i * 4;
            result.push({
                offset: colors[index],
                color: this._lottieColorToCSSColor(colors.slice(index + skipElement, index + 4), 1),
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
