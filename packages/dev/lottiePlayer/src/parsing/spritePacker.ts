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
    type RawGradientStrokeShape,
    type RawPathShape,
    type RawRectangleShape,
    type RawStrokeShape,
    type RawTextData,
} from "./rawTypes";
import { GetInitialColorValue, GetInitialScalarValue, GetInitialVectorValues, GetInitialBezierData } from "./rawPropertyHelpers";
import { ApplyLottieTextContext, DrawLottieText, MeasureLottieText, ResolveLottieText } from "./textLayout";

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

    // Tracks unsupported shape types encountered while drawing into the atlas. Deduplicated by `ty`
    // so a single unknown type doesn't spam the log once per sprite/element. Surfaced via the public
    // getter so the parser can include these entries in its debug() output.
    private readonly _unsupportedFeatures: string[] = [];
    private readonly _seenUnsupportedShapeTypes: Set<string> = new Set<string>();

    /**
     * Gets the textures for all atlas pages.
     * @returns An array of textures, one per atlas page.
     */
    public get textures(): ThinTexture[] {
        return this._pages.map((p) => p.texture);
    }

    /**
     * Gets the list of unsupported features encountered while rasterizing shapes into the atlas.
     * Each unknown shape type is reported only once.
     */
    public get unsupportedFeatures(): readonly string[] {
        return this._unsupportedFeatures;
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
     * @param debugName Optional human-readable identifier (e.g. owning layer name) included in oversize warnings.
     * @returns The information on how to find the sprite in the atlas.
     */
    public addLottieShape(rawElements: RawElement[], scalingFactor: IVector2Like, debugName?: string): SpriteAtlasInfo {
        const boundingBox = GetShapesBoundingBox(rawElements);

        const layerScaleX = scalingFactor.x;
        const layerScaleY = scalingFactor.y;
        this._applyAtlasScaleAndFit("shape", debugName, boundingBox, scalingFactor, layerScaleX, layerScaleY);

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
     * @param debugName Optional human-readable identifier (e.g. owning layer name) included in oversize warnings.
     * @returns The information on how to find the sprite in the atlas.
     */
    public addLottieText(textData: RawTextData, scalingFactor: IVector2Like, debugName?: string): SpriteAtlasInfo | undefined {
        if (this._rawFonts === undefined) {
            return undefined;
        }

        // If the text information is malformed and we can't get the bounding box, then just return
        const boundingBox = GetTextBoundingBox(
            this._pages[this._pages.length - 1].context,
            textData,
            this._rawFonts,
            this._variables,
            this._configuration.textLayerCompatibilityMode
        );
        if (boundingBox === undefined) {
            return undefined;
        }

        const layerScaleX = scalingFactor.x;
        const layerScaleY = scalingFactor.y;
        this._applyAtlasScaleAndFit("text", debugName, boundingBox, scalingFactor, layerScaleX, layerScaleY);

        // Calculate the size of the sprite in the atlas in pixels
        // This takes into account the scaling factor so in the call to _drawText the canvas will be scaled when rendering
        this._spriteAtlasInfo.cellWidth = this._getAtlasCellDimension(boundingBox.width * scalingFactor.x);
        this._spriteAtlasInfo.cellHeight = this._getAtlasCellDimension(boundingBox.height * scalingFactor.y);

        // Get (or create) the page that has room for this sprite
        const page = this._getPageWithRoom(this._spriteAtlasInfo.cellWidth, this._spriteAtlasInfo.cellHeight);

        // Draw the text in the canvas
        this._drawText(textData, scalingFactor, page);
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

        // Defensive clamp: _applyAtlasScaleAndFit should have already downscaled oversized cells
        // to fit on a single page. This handles the rounding edge case where ceil() pushes a cell
        // a single pixel past the limit.
        const maxCellWidth = this._configuration.spriteAtlasWidth - 2 * this._configuration.gapSize;
        const maxCellHeight = this._configuration.spriteAtlasHeight - 2 * this._configuration.gapSize;
        if (cellWidth > maxCellWidth || cellHeight > maxCellHeight) {
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

    /**
     * Combines the layer-side scale with the global atlas scale and devicePixelRatio, then
     * automatically downscales the result if the rasterized cell would not fit on a single
     * atlas page. The on-screen size of the sprite is unaffected (it is sourced from the raw
     * lottie bounding box), only the atlas resolution of this particular sprite is reduced.
     *
     * Mutates `scalingFactor` in place with the final effective scale to use when drawing
     * into the atlas canvas. When a downscale is applied, emits a warning that identifies the
     * offending layer and the scale factors involved so the source can be diagnosed.
     * @param kind Whether the sprite is a vector shape or a text element.
     * @param debugName Optional human-readable identifier (typically the owning layer name).
     * @param boundingBox Source bounding box in lottie coordinates, before any scaling.
     * @param scalingFactor Layer-side scale on input; receives the final effective scale on output.
     * @param layerScaleX Original layer-side X scale (preserved for the warning message).
     * @param layerScaleY Original layer-side Y scale (preserved for the warning message).
     */
    private _applyAtlasScaleAndFit(
        kind: "shape" | "text",
        debugName: string | undefined,
        boundingBox: BoundingBox,
        scalingFactor: IVector2Like,
        layerScaleX: number,
        layerScaleY: number
    ): void {
        const atlasW = this._configuration.spriteAtlasWidth;
        const atlasH = this._configuration.spriteAtlasHeight;
        const maxCellWidth = atlasW - 2 * this._configuration.gapSize;
        const maxCellHeight = atlasH - 2 * this._configuration.gapSize;

        let effectiveScaleX = scalingFactor.x * this._atlasScale * this._configuration.devicePixelRatio;
        let effectiveScaleY = scalingFactor.y * this._atlasScale * this._configuration.devicePixelRatio;

        const projectedWidth = boundingBox.width * effectiveScaleX;
        const projectedHeight = boundingBox.height * effectiveScaleY;

        // Auto-fit: if the projected cell exceeds an atlas page on either axis, scale uniformly
        // down by the worst-axis ratio so the sprite still fits at the highest resolution we can
        // afford. Uniform scaling preserves the sprite's aspect ratio in the atlas.
        // Use the ceiled projected dimensions so that after the caller re-applies Math.ceil to
        // size the cell, the result is provably <= maxCellWidth/maxCellHeight and the defensive
        // clamp in _getPageWithRoom is not triggered by sub-pixel rounding.
        const ceiledProjectedWidth = projectedWidth > 0 ? Math.ceil(projectedWidth) : 0;
        const ceiledProjectedHeight = projectedHeight > 0 ? Math.ceil(projectedHeight) : 0;
        const fitScale = Math.min(1, ceiledProjectedWidth > 0 ? maxCellWidth / ceiledProjectedWidth : 1, ceiledProjectedHeight > 0 ? maxCellHeight / ceiledProjectedHeight : 1);

        if (fitScale < 1) {
            effectiveScaleX *= fitScale;
            effectiveScaleY *= fitScale;

            const dpr = this._configuration.devicePixelRatio;
            const atlasScale = this._atlasScale;
            const rawW = boundingBox.width.toFixed(2);
            const rawH = boundingBox.height.toFixed(2);
            const lsx = layerScaleX.toFixed(3);
            const lsy = layerScaleY.toFixed(3);
            const name = debugName ?? "<unknown>";
            const finalW = Math.max(1, Math.ceil(boundingBox.width * effectiveScaleX));
            const finalH = Math.max(1, Math.ceil(boundingBox.height * effectiveScaleY));
            const gap = this._configuration.gapSize;
            // eslint-disable-next-line no-console
            console.warn(
                `[SpritePacker] ${kind} sprite for layer "${name}" would produce a ${ceiledProjectedWidth}x${ceiledProjectedHeight}px cell that exceeds the usable ${maxCellWidth}x${maxCellHeight}px atlas area ` +
                    `(within a ${atlasW}x${atlasH}px page with ${gap}px reserved on each side). ` +
                    `Auto-downscaled by ${fitScale.toFixed(3)} to ${finalW}x${finalH}px (on-screen size unchanged; sprite will appear softer than the rest of the atlas). ` +
                    `Source bounding box: ${rawW}x${rawH}px at lottie scale ${lsx}x${lsy} \u00d7 atlasScale ${atlasScale} \u00d7 devicePixelRatio ${dpr}.`
            );
        }

        scalingFactor.x = effectiveScaleX;
        scalingFactor.y = effectiveScaleY;
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
                case "gs":
                    this._drawGradientStroke(shape as RawGradientStrokeShape, boundingBox, page.context);
                    break;
                case "tr":
                    break; // Nothing needed with transforms
                default:
                    // Record once per unknown `ty` so we get observability into shape types that fall
                    // through the rasterizer (e.g. `gs`, modifiers like `tm`/`rp`, etc.) instead of
                    // silently producing an empty sprite.
                    if (!this._seenUnsupportedShapeTypes.has(shape.ty)) {
                        this._seenUnsupportedShapeTypes.add(shape.ty);
                        this._unsupportedFeatures.push(`Unsupported shape type in vector shape: ${shape.ty}`);
                    }
                    break;
            }
        }

        page.context.restore();
    }

    private _drawText(textData: RawTextData, scalingFactor: IVector2Like, page: AtlasPage): void {
        if (this._rawFonts === undefined) {
            return;
        }

        const resolvedText = ResolveLottieText(textData, this._rawFonts, this._variables);
        if (!resolvedText) {
            return;
        }

        page.context.save();
        page.context.translate(page.currentX, page.currentY);
        page.context.scale(scalingFactor.x, scalingFactor.y);

        // Resolve fill color. fc is either an RGB array or a variable name string; the two shapes need different guards
        // (arrays need at least 3 components; strings just need a non-undefined variable lookup).
        if (resolvedText.textInfo.fc !== undefined) {
            const rawFillStyle = resolvedText.textInfo.fc;
            if (Array.isArray(rawFillStyle)) {
                if (rawFillStyle.length >= 3) {
                    page.context.fillStyle = this._lottieColorToCSSColor(rawFillStyle, 1);
                }
            } else {
                const variableFillStyle = this._variables.get(rawFillStyle);
                if (variableFillStyle !== undefined) {
                    page.context.fillStyle = variableFillStyle;
                }
            }
        }

        if (resolvedText.hasStroke) {
            // ResolveLottieText only sets hasStroke when sc is present and well-formed, so the non-null assertion here is safe.
            page.context.strokeStyle = this._lottieColorToCSSColor(resolvedText.textInfo.sc!, 1);
        }

        ApplyLottieTextContext(page.context, resolvedText);

        const layout = MeasureLottieText(resolvedText, (text) => page.context.measureText(text), this._configuration.textLayerCompatibilityMode);

        // Clip to cell bounds to prevent text overdraw into adjacent cells
        page.context.beginPath();
        page.context.rect(0, 0, layout.width, layout.height);
        page.context.clip();

        DrawLottieText(page.context, resolvedText, layout);

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
        // Read initial (first-frame) values so animated fills (a===1) render their starting state into the atlas
        // instead of feeding a keyframe array through `as number[]` / `as number` casts.
        const colorRgb = GetInitialColorValue(fill.c);
        const opacity = GetInitialScalarValue(fill.o, 100);
        const color = this._lottieColorToCSSColor(colorRgb, opacity / 100);
        ctx.fillStyle = color;

        ctx.fill();
    }

    private _drawStroke(stroke: RawStrokeShape, ctx: DrawingContext): void {
        // Color and opacity. Use initial-value helpers so animated stroke color/opacity render their first-frame
        // value into the atlas instead of producing NaN / malformed CSS via `as number[]` / `as number` casts.
        const opacity = stroke.o ? GetInitialScalarValue(stroke.o, 100) : 100;
        const colorRgb = stroke.c ? GetInitialColorValue(stroke.c) : [0, 0, 0];
        const color = this._lottieColorToCSSColor(colorRgb, opacity / 100);
        ctx.strokeStyle = color;

        this._applyStrokeStyle(stroke, ctx);

        ctx.stroke();
    }

    /**
     * Apply the geometric stroke styling (width, line cap, line join, miter limit, dash pattern) to the
     * drawing context. Shared by `_drawStroke` (solid-color strokes, `ty:"st"`) and `_drawGradientStroke`
     * (gradient strokes, `ty:"gs"`) — both have identical width/cap/join/miter/dash semantics; they only
     * differ in how `strokeStyle` is built (CSS color vs CanvasGradient).
     * @param stroke The raw solid or gradient stroke shape to read styling from.
     * @param ctx The drawing context to mutate (`lineWidth`, `lineCap`, `lineJoin`, `miterLimit`, dash).
     */
    private _applyStrokeStyle(stroke: RawStrokeShape | RawGradientStrokeShape, ctx: DrawingContext): void {
        // Width
        const width = stroke.w ? GetInitialScalarValue(stroke.w, 1) : 1;
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
                    // Dash length may be animated (a === 1), in which case `v.k` is a keyframe array.
                    // Use GetInitialScalarValue so the first-frame length is rasterized instead of NaN.
                    lineDashes.push(GetInitialScalarValue(dashes[i].v));
                }
            }

            ctx.setLineDash(lineDashes);
        } else {
            // Canvas line-dash state persists across strokes within the same `_drawVectorShape` save/restore
            // pair. Without this reset, a dashed stroke drawn earlier in the shape would leak its dash
            // pattern onto subsequent strokes that don't declare `d`.
            ctx.setLineDash([]);
        }
    }

    private _drawGradientStroke(stroke: RawGradientStrokeShape, boundingBox: BoundingBox, ctx: DrawingContext): void {
        // Build the gradient that will be used as `strokeStyle`. Mirrors `_drawGradientFill` dispatch on `t`
        // (1 = linear, 2 = radial) and reuses the same translation into the bounding box's local space.
        const xTranslate = boundingBox.centerX;
        const yTranslate = boundingBox.centerY;
        // Read initial-frame endpoints so animated gradient endpoints (a===1) build a valid gradient instead
        // of feeding a keyframe array through `as number[]` casts.
        const startPoint = GetInitialVectorValues(stroke.s);
        const endPoint = GetInitialVectorValues(stroke.e);

        let gradient: CanvasGradient | undefined;
        switch (stroke.t) {
            case 1:
                gradient = ctx.createLinearGradient(startPoint[0] + xTranslate, startPoint[1] + yTranslate, endPoint[0] + xTranslate, endPoint[1] + yTranslate);
                break;
            case 2: {
                const centerX = startPoint[0] + xTranslate;
                const centerY = startPoint[1] + yTranslate;
                const outerRadius = Math.hypot(endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]);
                gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, outerRadius);
                break;
            }
        }

        if (gradient === undefined) {
            return;
        }

        // Reuse the existing color-stop builder. `_addColorStops` only reads `g`, which is shared between
        // gradient fills and gradient strokes. Stroke `o` (overall opacity) is intentionally not applied
        // here to match the existing `_drawGradientFill` behavior; if that ever gains opacity support, this
        // method should follow.
        this._addColorStops(gradient, stroke);

        ctx.strokeStyle = gradient;
        this._applyStrokeStyle(stroke, ctx);

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

        // Create the gradient. Use initial-value helpers so animated endpoints (a===1) render their
        // first-frame value into the atlas instead of feeding a keyframe array through `as number[]`.
        const startPoint = GetInitialVectorValues(fill.s);
        const endPoint = GetInitialVectorValues(fill.e);
        const gradient = ctx.createLinearGradient(startPoint[0] + xTranslate, startPoint[1] + yTranslate, endPoint[0] + xTranslate, endPoint[1] + yTranslate);

        this._addColorStops(gradient, fill);

        ctx.fillStyle = gradient;
        ctx.fill();
    }

    private _drawRadialGradientFill(fill: RawGradientFillShape, boundingBox: BoundingBox, ctx: DrawingContext): void {
        // We need to translate the gradient to the center of the bounding box
        const xTranslate = boundingBox.centerX;
        const yTranslate = boundingBox.centerY;

        // Create the gradient. Use initial-value helpers so animated endpoints (a===1) render their
        // first-frame value into the atlas instead of feeding a keyframe array through `as number[]`.
        const startPoint = GetInitialVectorValues(fill.s);
        const endPoint = GetInitialVectorValues(fill.e);

        const centerX = startPoint[0] + xTranslate;
        const centerY = startPoint[1] + yTranslate;
        const outerRadius = Math.hypot(endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]);
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, outerRadius);

        this._addColorStops(gradient, fill);

        ctx.fillStyle = gradient;
        ctx.fill();
    }

    private _addColorStops(gradient: CanvasGradient, fill: RawGradientFillShape | RawGradientStrokeShape): void {
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
