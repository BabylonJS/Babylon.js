import "core/Engines/Extensions/engine.dynamicTexture";

import { type ThinEngine } from "core/Engines/thinEngine";
import { type InternalTexture } from "core/Materials/Textures/internalTexture";
import { type IVector2Like } from "core/Maths/math.like";
import { ThinTexture } from "core/Materials/Textures/thinTexture";

import {
    type RawElement,
    type RawEllipseShape,
    type RawFillShape,
    type RawFont,
    type RawGradientFillShape,
    type RawPathShape,
    type RawRectangleShape,
    type RawStrokeShape,
    type RawTextData,
    type RawTextDocument,
} from "./rawTypes";
import { GetInitialScalarValue, GetInitialVectorValues, GetInitialBezierData } from "./rawPropertyHelpers";

import { type BoundingBox, GetShapesBoundingBox, GetTextBoundingBox } from "../maths/boundingBox";

import { type AnimationConfiguration } from "../animationConfiguration";

/**
 * Type alias for the 2D drawing context used by the sprite packer.
 */
type DrawingContext = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

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

    /**
     * Index of the atlas page this sprite belongs to.
     * Used when the animation has more sprites than fit in a single atlas texture.
     */
    atlasIndex: number;
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
 * Represents a single page in the sprite atlas. When sprites exceed the capacity of one
 * texture, additional pages are created automatically.
 */
type AtlasPage = {
    canvas: OffscreenCanvas | HTMLCanvasElement;
    context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
    internalTexture: InternalTexture;
    texture: ThinTexture;
    isDirty: boolean;
    currentX: number;
    currentY: number;
    maxRowHeight: number;
};

/**
 * SpritePacker is a class that handles the packing of sprites into a texture atlas.
 * If sprites exceed the capacity of a single atlas texture, additional atlas pages are created.
 */
export class SpritePacker {
    private readonly _engine: ThinEngine;
    private readonly _isHtmlCanvas: boolean;
    private _atlasScale: number;
    private readonly _variables: Map<string, string>;
    private readonly _configuration: AnimationConfiguration;
    private _rawFonts: Map<string, RawFont> | undefined;

    private _pages: AtlasPage[];

    // Variable to avoid allocations
    private _spriteAtlasInfo: SpriteAtlasInfo;

    /**
     * Gets the textures for all atlas pages.
     * @returns An array of textures, one per atlas page.
     */
    public get textures(): ThinTexture[] {
        return this._pages.map((p) => p.texture);
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
        this._isHtmlCanvas = isHtmlCanvas;
        this._atlasScale = atlasScale;
        this._variables = variables;
        this._configuration = configuration;

        this._pages = [this._createPage()];

        this._spriteAtlasInfo = {
            uOffset: 0,
            vOffset: 0,
            cellWidth: 0,
            cellHeight: 0,
            widthPx: 0,
            heightPx: 0,
            centerX: 0,
            centerY: 0,
            atlasIndex: 0,
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
        this._spriteAtlasInfo.cellWidth = this._getAtlasCellDimension(boundingBox.width * scalingFactor.x);
        this._spriteAtlasInfo.cellHeight = this._getAtlasCellDimension(boundingBox.height * scalingFactor.y);

        // Get (or create) the page that has room for this sprite
        const page = this._getPageWithRoom(this._spriteAtlasInfo.cellWidth, this._spriteAtlasInfo.cellHeight);

        // Draw the shape in the canvas
        this._drawVectorShape(rawElements, boundingBox, scalingFactor, page);
        this._extrudeSpriteEdges(page, page.currentX, page.currentY, this._spriteAtlasInfo.cellWidth, this._spriteAtlasInfo.cellHeight);
        page.isDirty = true;

        // Get the rest of the sprite information required to render the shape
        this._spriteAtlasInfo.uOffset = page.currentX / this._configuration.spriteAtlasWidth;
        this._spriteAtlasInfo.vOffset = page.currentY / this._configuration.spriteAtlasHeight;

        this._spriteAtlasInfo.widthPx = boundingBox.width;
        this._spriteAtlasInfo.heightPx = boundingBox.height;

        this._spriteAtlasInfo.centerX = boundingBox.offsetX;
        this._spriteAtlasInfo.centerY = boundingBox.offsetY;

        this._spriteAtlasInfo.atlasIndex = this._pages.indexOf(page);

        // Advance the current position for the next sprite
        page.currentX += this._spriteAtlasInfo.cellWidth + this._configuration.gapSize; // Add a gap between sprites to avoid bleeding
        page.maxRowHeight = Math.max(page.maxRowHeight, this._spriteAtlasInfo.cellHeight);

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
        const boundingBox = GetTextBoundingBox(this._pages[this._pages.length - 1].context, textData, this._rawFonts, this._variables);
        if (boundingBox === undefined) {
            return undefined;
        }

        scalingFactor.x = scalingFactor.x * this._atlasScale * this._configuration.devicePixelRatio;
        scalingFactor.y = scalingFactor.y * this._atlasScale * this._configuration.devicePixelRatio;

        // Calculate the size of the sprite in the atlas in pixels
        // This takes into account the scaling factor so in the call to _drawText the canvas will be scaled when rendering
        this._spriteAtlasInfo.cellWidth = this._getAtlasCellDimension(boundingBox.width * scalingFactor.x);
        this._spriteAtlasInfo.cellHeight = this._getAtlasCellDimension(boundingBox.height * scalingFactor.y);

        // Get (or create) the page that has room for this sprite
        const page = this._getPageWithRoom(this._spriteAtlasInfo.cellWidth, this._spriteAtlasInfo.cellHeight);

        // Draw the text in the canvas
        this._drawText(textData, boundingBox, scalingFactor, page);
        this._extrudeSpriteEdges(page, page.currentX, page.currentY, this._spriteAtlasInfo.cellWidth, this._spriteAtlasInfo.cellHeight);
        page.isDirty = true;

        // Get the rest of the sprite information required to render the text
        this._spriteAtlasInfo.uOffset = page.currentX / this._configuration.spriteAtlasWidth;
        this._spriteAtlasInfo.vOffset = page.currentY / this._configuration.spriteAtlasHeight;

        this._spriteAtlasInfo.widthPx = boundingBox.width;
        this._spriteAtlasInfo.heightPx = boundingBox.height;

        this._spriteAtlasInfo.centerX = boundingBox.offsetX;
        this._spriteAtlasInfo.centerY = boundingBox.offsetY;

        this._spriteAtlasInfo.atlasIndex = this._pages.indexOf(page);

        // Advance the current position for the next sprite
        page.currentX += this._spriteAtlasInfo.cellWidth + this._configuration.gapSize; // Add a gap between sprites to avoid bleeding
        page.maxRowHeight = Math.max(page.maxRowHeight, this._spriteAtlasInfo.cellHeight);

        return this._spriteAtlasInfo;
    }

    /**
     * Updates all dirty atlas page textures with the latest canvas content.
     */
    public updateAtlasTexture(): void {
        for (const page of this._pages) {
            if (!page.isDirty) {
                continue;
            }
            this._engine.updateDynamicTexture(page.internalTexture, page.canvas, false);
            page.isDirty = false;
        }
    }

    /**
     * Releases the canvases and their contexts to allow garbage collection.
     */
    public releaseCanvas(): void {
        for (const page of this._pages) {
            page.context = undefined as any;
            page.canvas = undefined as any;
        }
    }

    private _createPage(): AtlasPage {
        let canvas: OffscreenCanvas | HTMLCanvasElement;
        let context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

        if (this._isHtmlCanvas) {
            canvas = document.createElement("canvas");
            canvas.width = this._configuration.spriteAtlasWidth;
            canvas.height = this._configuration.spriteAtlasHeight;
            context = canvas.getContext("2d") as CanvasRenderingContext2D;
        } else {
            canvas = new OffscreenCanvas(this._configuration.spriteAtlasWidth, this._configuration.spriteAtlasHeight);
            context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
        }

        const internalTexture = this._engine.createDynamicTexture(this._configuration.spriteAtlasWidth, this._configuration.spriteAtlasHeight, false, 2);
        this._engine.updateDynamicTexture(internalTexture, canvas, false);

        const texture = new ThinTexture(internalTexture);
        texture.wrapU = 0;
        texture.wrapV = 0;

        return {
            canvas,
            context,
            internalTexture,
            texture,
            isDirty: false,
            currentX: this._configuration.gapSize,
            currentY: this._configuration.gapSize,
            maxRowHeight: 0,
        };
    }

    /**
     * Returns a page with room for a sprite of the given size. Wraps to the next row if needed,
     * and creates a new page if the current page is full.
     * @param cellWidth The width of the sprite cell in pixels.
     * @param cellHeight The height of the sprite cell in pixels.
     * @returns An atlas page with enough room for the sprite.
     */
    private _getPageWithRoom(cellWidth: number, cellHeight: number): AtlasPage {
        let page = this._pages[this._pages.length - 1];

        // Clamp oversized cells to fit within a single atlas page
        const maxCellWidth = this._configuration.spriteAtlasWidth - 2 * this._configuration.gapSize;
        const maxCellHeight = this._configuration.spriteAtlasHeight - 2 * this._configuration.gapSize;
        if (cellWidth > maxCellWidth || cellHeight > maxCellHeight) {
            // eslint-disable-next-line no-console
            console.warn(
                `[SpritePacker] Sprite cell (${cellWidth}x${cellHeight}) exceeds atlas page (${this._configuration.spriteAtlasWidth}x${this._configuration.spriteAtlasHeight}). Clamping to fit.`
            );
            this._spriteAtlasInfo.cellWidth = Math.min(cellWidth, maxCellWidth);
            this._spriteAtlasInfo.cellHeight = Math.min(cellHeight, maxCellHeight);
            cellWidth = this._spriteAtlasInfo.cellWidth;
            cellHeight = this._spriteAtlasInfo.cellHeight;
        }

        // Check if the sprite fits in the current row
        if (page.currentX + cellWidth > this._configuration.spriteAtlasWidth) {
            // Move to the next row
            page.currentX = this._configuration.gapSize;
            page.currentY += page.maxRowHeight + this._configuration.gapSize;
            page.maxRowHeight = 0;
        }

        // Check if the sprite fits vertically on this page
        if (page.currentY + cellHeight > this._configuration.spriteAtlasHeight) {
            // Current page is full — create a new one
            page = this._createPage();
            this._pages.push(page);
        }

        return page;
    }

    private _getAtlasCellDimension(size: number): number {
        return Math.max(1, Math.ceil(size));
    }

    private _extrudeSpriteEdges(page: AtlasPage, x: number, y: number, width: number, height: number): void {
        const padding = Math.min(2, Math.floor(this._configuration.gapSize / 2));
        const pixelX = Math.floor(x);
        const pixelY = Math.floor(y);
        const pixelWidth = Math.ceil(width);
        const pixelHeight = Math.ceil(height);

        if (padding <= 0 || pixelWidth <= 0 || pixelHeight <= 0) {
            return;
        }

        for (let offset = 1; offset <= padding; offset++) {
            // Left edge
            if (pixelX - offset >= 0) {
                page.context.drawImage(page.canvas, pixelX, pixelY, 1, pixelHeight, pixelX - offset, pixelY, 1, pixelHeight);
            }

            // Right edge
            if (pixelX + pixelWidth - 1 + offset < this._configuration.spriteAtlasWidth) {
                page.context.drawImage(page.canvas, pixelX + pixelWidth - 1, pixelY, 1, pixelHeight, pixelX + pixelWidth - 1 + offset, pixelY, 1, pixelHeight);
            }

            // Top edge
            if (pixelY - offset >= 0) {
                page.context.drawImage(page.canvas, pixelX, pixelY, pixelWidth, 1, pixelX, pixelY - offset, pixelWidth, 1);
            }

            // Bottom edge
            if (pixelY + pixelHeight - 1 + offset < this._configuration.spriteAtlasHeight) {
                page.context.drawImage(page.canvas, pixelX, pixelY + pixelHeight - 1, pixelWidth, 1, pixelX, pixelY + pixelHeight - 1 + offset, pixelWidth, 1);
            }

            // Top-left corner
            if (pixelX - offset >= 0 && pixelY - offset >= 0) {
                page.context.drawImage(page.canvas, pixelX, pixelY, 1, 1, pixelX - offset, pixelY - offset, 1, 1);
            }

            // Top-right corner
            if (pixelX + pixelWidth - 1 + offset < this._configuration.spriteAtlasWidth && pixelY - offset >= 0) {
                page.context.drawImage(page.canvas, pixelX + pixelWidth - 1, pixelY, 1, 1, pixelX + pixelWidth - 1 + offset, pixelY - offset, 1, 1);
            }

            // Bottom-left corner
            if (pixelX - offset >= 0 && pixelY + pixelHeight - 1 + offset < this._configuration.spriteAtlasHeight) {
                page.context.drawImage(page.canvas, pixelX, pixelY + pixelHeight - 1, 1, 1, pixelX - offset, pixelY + pixelHeight - 1 + offset, 1, 1);
            }

            // Bottom-right corner
            if (pixelX + pixelWidth - 1 + offset < this._configuration.spriteAtlasWidth && pixelY + pixelHeight - 1 + offset < this._configuration.spriteAtlasHeight) {
                page.context.drawImage(
                    page.canvas,
                    pixelX + pixelWidth - 1,
                    pixelY + pixelHeight - 1,
                    1,
                    1,
                    pixelX + pixelWidth - 1 + offset,
                    pixelY + pixelHeight - 1 + offset,
                    1,
                    1
                );
            }
        }
    }

    private _drawVectorShape(rawElements: RawElement[], boundingBox: BoundingBox, scalingFactor: IVector2Like, page: AtlasPage): void {
        page.context.save();
        page.context.globalCompositeOperation = "destination-over";

        page.context.translate(page.currentX + Math.ceil(boundingBox.strokeInset / 2), page.currentY + Math.ceil(boundingBox.strokeInset / 2));
        page.context.scale(scalingFactor.x, scalingFactor.y);

        page.context.beginPath();
        page.context.rect(0, 0, boundingBox.width, boundingBox.height);
        page.context.clip();
        page.context.beginPath();

        for (let i = 0; i < rawElements.length; i++) {
            const shape = rawElements[i];
            switch (shape.ty) {
                case "rc":
                    this._drawRectangle(shape as RawRectangleShape, boundingBox, page.context);
                    break;
                case "el":
                    this._drawEllipse(shape as RawEllipseShape, boundingBox, page.context);
                    break;
                case "sh":
                    this._drawPath(shape as RawPathShape, boundingBox, page.context);
                    break;
                case "fl":
                    this._drawFill(shape as RawFillShape, page.context);
                    break;
                case "st":
                    this._drawStroke(shape as RawStrokeShape, page.context);
                    break;
                case "gf":
                    this._drawGradientFill(shape as RawGradientFillShape, boundingBox, page.context);
                    break;
                case "tr":
                    break; // Nothing needed with transforms
            }
        }

        page.context.restore();
    }

    private _drawText(textData: RawTextData, boundingBox: BoundingBox, scalingFactor: IVector2Like, page: AtlasPage): void {
        if (this._rawFonts === undefined) {
            return;
        }

        const textInfo = textData.d.k[0].s as RawTextDocument;

        const fontFamily = textInfo.f;
        const finalFont = this._rawFonts.get(fontFamily);
        if (!finalFont) {
            return;
        }

        page.context.save();
        page.context.translate(page.currentX, page.currentY);
        page.context.scale(scalingFactor.x, scalingFactor.y);

        // Set up font (same setup as GetTextBoundingBox for measurement consistency)
        const weight = finalFont.fWeight || "400";
        page.context.font = `${weight} ${textInfo.s}px ${finalFont.fFamily}`;

        if (textInfo.sc !== undefined && textInfo.sc.length >= 3 && textInfo.sw !== undefined && textInfo.sw > 0) {
            page.context.lineWidth = textInfo.sw;
        }

        // Clip to cell bounds to prevent text overdraw into adjacent cells
        page.context.beginPath();
        page.context.rect(0, 0, boundingBox.width, boundingBox.height);
        page.context.clip();

        if (textInfo.fc !== undefined && textInfo.fc.length >= 3) {
            const rawFillStyle = textInfo.fc;
            if (Array.isArray(rawFillStyle)) {
                // If the fill style is an array, we assume it's a color array
                page.context.fillStyle = this._lottieColorToCSSColor(rawFillStyle, 1);
            } else {
                // If it's a string, we need to get the value from the variables map
                const variableFillStyle = this._variables.get(rawFillStyle);
                if (variableFillStyle !== undefined) {
                    page.context.fillStyle = variableFillStyle;
                }
            }
        }

        if (textInfo.sc !== undefined && textInfo.sc.length >= 3 && textInfo.sw !== undefined && textInfo.sw > 0) {
            page.context.strokeStyle = this._lottieColorToCSSColor(textInfo.sc, 1);
        }

        // Text is supported as a possible variable (for localization for example)
        // Check if the text is a variable and replace it if it is
        let text = textInfo.t;
        const variableText = this._variables.get(text);
        if (variableText !== undefined) {
            text = variableText;
        }

        page.context.fillText(text, 0, boundingBox.actualBoundingBoxAscent!);
        if (textInfo.sc !== undefined && textInfo.sc.length >= 3 && textInfo.sw !== undefined && textInfo.sw > 0 && textInfo.of === true) {
            page.context.strokeText(text, 0, boundingBox.actualBoundingBoxAscent!);
        }

        page.context.restore();
    }

    private _drawRectangle(shape: RawRectangleShape, boundingBox: BoundingBox, ctx: DrawingContext): void {
        const size = GetInitialVectorValues(shape.s);
        const position = GetInitialVectorValues(shape.p);
        const radius = GetInitialScalarValue(shape.r);

        // Translate to the correct position within the atlas cell, same as paths use centerX/centerY
        const x = position[0] - size[0] / 2 + boundingBox.centerX - Math.ceil(boundingBox.strokeInset);
        const y = position[1] - size[1] / 2 + boundingBox.centerY - Math.ceil(boundingBox.strokeInset);

        if (radius <= 0) {
            ctx.rect(x, y, size[0], size[1]);
        } else {
            ctx.roundRect(x, y, size[0], size[1], radius);
        }
    }

    private _drawEllipse(shape: RawEllipseShape, boundingBox: BoundingBox, ctx: DrawingContext): void {
        const size = GetInitialVectorValues(shape.s);
        const position = GetInitialVectorValues(shape.p);

        const centerX = position[0] + boundingBox.centerX - Math.ceil(boundingBox.strokeInset);
        const centerY = position[1] + boundingBox.centerY - Math.ceil(boundingBox.strokeInset);
        const radiusX = size[0] / 2;
        const radiusY = size[1] / 2;

        ctx.moveTo(centerX + radiusX, centerY);
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    }

    private _drawPath(shape: RawPathShape, boundingBox: BoundingBox, ctx: DrawingContext): void {
        // The path data has to be translated to the center of the bounding box
        // If the paths have stroke, we need to account for the stroke width
        const pathData = GetInitialBezierData(shape.ks);
        if (!pathData) {
            return;
        }
        const xTranslate = boundingBox.centerX - Math.ceil(boundingBox.strokeInset);
        const yTranslate = boundingBox.centerY - Math.ceil(boundingBox.strokeInset);

        const vertices = pathData.v;
        const inTangents = pathData.i;
        const outTangents = pathData.o;

        if (vertices.length > 0) {
            ctx.moveTo(vertices[0][0] + xTranslate, vertices[0][1] + yTranslate);

            for (let i = 0; i < vertices.length - 1; i++) {
                const start = vertices[i];
                const end = vertices[i + 1];
                const outTangent = outTangents[i];
                const inTangent = inTangents[i + 1];

                ctx.bezierCurveTo(
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

                ctx.bezierCurveTo(
                    start[0] + xTranslate + outTangent[0],
                    start[1] + yTranslate + outTangent[1],
                    end[0] + xTranslate + inTangent[0],
                    end[1] + yTranslate + inTangent[1],
                    end[0] + xTranslate,
                    end[1] + yTranslate
                );

                ctx.closePath();
            }
        }
    }

    private _drawFill(fill: RawFillShape, ctx: DrawingContext): void {
        const color = this._lottieColorToCSSColor(fill.c.k as number[], (fill.o.k as number) / 100);
        ctx.fillStyle = color;

        ctx.fill();
    }

    private _drawStroke(stroke: RawStrokeShape, ctx: DrawingContext): void {
        // Color and opacity
        const opacity = (stroke.o?.k as number) ?? 100;
        const color = this._lottieColorToCSSColor((stroke.c?.k as number[]) ?? [0, 0, 0], opacity / 100);
        ctx.strokeStyle = color;

        // Width
        const width = (stroke.w?.k as number) ?? 1;
        ctx.lineWidth = width;

        // Line cap
        switch (stroke.lc) {
            case 1:
                ctx.lineCap = "butt";
                break;
            case 2:
                ctx.lineCap = "round";
                break;
            case 3:
                ctx.lineCap = "square";
                break;
            default:
                // leave default
                break;
        }

        // Line join
        switch (stroke.lj) {
            case 1:
                ctx.lineJoin = "miter";
                break;
            case 2:
                ctx.lineJoin = "round";
                break;
            case 3:
                ctx.lineJoin = "bevel";
                break;
            default:
                // leave default
                break;
        }

        // Miter limit
        if (stroke.ml !== undefined) {
            ctx.miterLimit = stroke.ml;
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

            ctx.setLineDash(lineDashes);
        }

        ctx.stroke();
    }

    private _drawGradientFill(fill: RawGradientFillShape, boundingBox: BoundingBox, ctx: DrawingContext): void {
        switch (fill.t) {
            case 1: {
                this._drawLinearGradientFill(fill, boundingBox, ctx);
                break;
            }
            case 2: {
                this._drawRadialGradientFill(fill, boundingBox, ctx);
                break;
            }
        }
    }

    private _drawLinearGradientFill(fill: RawGradientFillShape, boundingBox: BoundingBox, ctx: DrawingContext): void {
        // We need to translate the gradient to the center of the bounding box
        const xTranslate = boundingBox.centerX;
        const yTranslate = boundingBox.centerY;

        // Create the gradient
        const startPoint = fill.s.k as number[];
        const endPoint = fill.e.k as number[];
        const gradient = ctx.createLinearGradient(startPoint[0] + xTranslate, startPoint[1] + yTranslate, endPoint[0] + xTranslate, endPoint[1] + yTranslate);

        this._addColorStops(gradient, fill);

        ctx.fillStyle = gradient;
        ctx.fill();
    }

    private _drawRadialGradientFill(fill: RawGradientFillShape, boundingBox: BoundingBox, ctx: DrawingContext): void {
        // We need to translate the gradient to the center of the bounding box
        const xTranslate = boundingBox.centerX;
        const yTranslate = boundingBox.centerY;

        // Create the gradient
        const startPoint = fill.s.k as number[];
        const endPoint = fill.e.k as number[];

        const centerX = startPoint[0] + xTranslate;
        const centerY = startPoint[1] + yTranslate;
        const outerRadius = Math.hypot(endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]);
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, outerRadius);

        this._addColorStops(gradient, fill);

        ctx.fillStyle = gradient;
        ctx.fill();
    }

    private _addColorStops(gradient: CanvasGradient, fill: RawGradientFillShape): void {
        const stops = fill.g.p;
        const rawColors = fill.g.k.k;

        let stopsData: GradientStop[] | undefined;
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
