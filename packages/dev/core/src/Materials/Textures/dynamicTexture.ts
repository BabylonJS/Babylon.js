import { Logger } from "../../Misc/logger";
import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import type { ISize } from "../../Maths/math.size";
import type { ITextureCreationOptions } from "../../Materials/Textures/texture";
import { Texture } from "../../Materials/Textures/texture";
import { Constants } from "../../Engines/constants";
import type { ICanvas, ICanvasRenderingContext } from "../../Engines/ICanvas";

import "../../Engines/Extensions/engine.dynamicTexture";

/**
 * Interface defining options used to create a dynamic texture
 */
export interface IDynamicTextureOptions extends ITextureCreationOptions {
    /** defines the width of the texture (default: 0) */
    width?: number;
    /** defines the height of the texture (default: 0) */
    height?: number;
    /** defines the hosting scene (default: null) */
    scene?: Nullable<Scene>;
}

/**
 * A class extending Texture allowing drawing on a texture
 * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/dynamicTexture
 */
export class DynamicTexture extends Texture {
    private _generateMipMaps: boolean;
    private _canvas: ICanvas;
    private _ownCanvas: boolean;
    private _context: ICanvasRenderingContext;

    /**
     * Creates a DynamicTexture
     * @param name defines the name of the texture
     * @param canvasOrSize provides 3 alternatives for width and height of texture, a canvas, object with width and height properties, number for both width and height
     * @param options The options to be used when constructing the dynamic texture
     */
    constructor(name: string, canvasOrSize: ICanvas | { width: number; height: number } | number, options?: IDynamicTextureOptions);

    /**
     * Creates a DynamicTexture
     * @param name defines the name of the texture
     * @param options provides 3 alternatives for width and height of texture, a canvas, object with width and height properties, number for both width and height
     * @param scene defines the scene where you want the texture
     * @param generateMipMaps defines the use of MinMaps or not (default is false)
     * @param samplingMode defines the sampling mode to use (default is Texture.TRILINEAR_SAMPLINGMODE)
     * @param format defines the texture format to use (default is Engine.TEXTUREFORMAT_RGBA)
     * @param invertY defines if the texture needs to be inverted on the y axis during loading
     */
    constructor(
        name: string,
        options: ICanvas | { width: number; height: number } | number,
        scene?: Nullable<Scene>,
        generateMipMaps?: boolean,
        samplingMode?: number,
        format?: number,
        invertY?: boolean
    );

    /** @internal */
    constructor(
        name: string,
        canvasOrSize: ICanvas | { width: number; height: number } | number,
        sceneOrOptions?: Nullable<Scene> | IDynamicTextureOptions,
        generateMipMaps?: boolean,
        samplingMode?: number,
        format?: number,
        invertY?: boolean
    );

    /** @internal */
    constructor(
        name: string,
        canvasOrSize: ICanvas | { width: number; height: number } | number,
        sceneOrOptions?: Nullable<Scene> | IDynamicTextureOptions,
        generateMipMaps: boolean = false,
        samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
        format: number = Constants.TEXTUREFORMAT_RGBA,
        invertY?: boolean
    ) {
        const isScene = !sceneOrOptions || (sceneOrOptions as Scene)._isScene;
        const scene = isScene ? (sceneOrOptions as Scene) : (sceneOrOptions as IDynamicTextureOptions)?.scene;
        const noMipmap = isScene ? !generateMipMaps : (sceneOrOptions as IDynamicTextureOptions);

        super(null, scene, noMipmap, invertY, samplingMode, undefined, undefined, undefined, undefined, format);

        this.name = name;
        this.wrapU = Texture.CLAMP_ADDRESSMODE;
        this.wrapV = Texture.CLAMP_ADDRESSMODE;

        this._generateMipMaps = generateMipMaps;

        const engine = this._getEngine();
        if (!engine) {
            return;
        }

        if ((canvasOrSize as ICanvas).getContext) {
            this._canvas = canvasOrSize as ICanvas;
            this._ownCanvas = false;
            this._texture = engine.createDynamicTexture(this._canvas.width, this._canvas.height, generateMipMaps, samplingMode);
        } else {
            this._canvas = engine.createCanvas(1, 1);
            this._ownCanvas = true;

            const optionsAsSize = canvasOrSize as ISize;
            if (optionsAsSize.width || optionsAsSize.width === 0) {
                this._texture = engine.createDynamicTexture(optionsAsSize.width, optionsAsSize.height, generateMipMaps, samplingMode);
            } else {
                this._texture = engine.createDynamicTexture(canvasOrSize as number, canvasOrSize as number, generateMipMaps, samplingMode);
            }
        }

        const textureSize = this.getSize();

        if (this._canvas.width !== textureSize.width) {
            this._canvas.width = textureSize.width;
        }
        if (this._canvas.height !== textureSize.height) {
            this._canvas.height = textureSize.height;
        }
        this._context = this._canvas.getContext("2d");
    }

    /**
     * Get the current class name of the texture useful for serialization or dynamic coding.
     * @returns "DynamicTexture"
     */
    public override getClassName(): string {
        return "DynamicTexture";
    }

    /**
     * Gets the current state of canRescale
     */
    public override get canRescale(): boolean {
        return true;
    }

    private _recreate(textureSize: ISize): void {
        this._canvas.width = textureSize.width;
        this._canvas.height = textureSize.height;

        this.releaseInternalTexture();

        this._texture = this._getEngine()!.createDynamicTexture(textureSize.width, textureSize.height, this._generateMipMaps, this.samplingMode);
    }

    /**
     * Scales the texture
     * @param ratio the scale factor to apply to both width and height
     */
    public override scale(ratio: number): void {
        const textureSize = this.getSize();

        textureSize.width *= ratio;
        textureSize.height *= ratio;

        this._recreate(textureSize);
    }

    /**
     * Resizes the texture
     * @param width the new width
     * @param height the new height
     */
    public scaleTo(width: number, height: number): void {
        const textureSize = this.getSize();

        textureSize.width = width;
        textureSize.height = height;

        this._recreate(textureSize);
    }

    /**
     * Gets the context of the canvas used by the texture
     * @returns the canvas context of the dynamic texture
     */
    public getContext(): ICanvasRenderingContext {
        return this._context;
    }

    /**
     * Clears the texture
     * @param clearColor Defines the clear color to use
     */
    public clear(clearColor?: string): void {
        const size = this.getSize();
        if (clearColor) {
            this._context.fillStyle = clearColor;
        }
        this._context.clearRect(0, 0, size.width, size.height);
    }

    /**
     * Updates the texture
     * @param invertY defines the direction for the Y axis (default is true - y increases downwards)
     * @param premulAlpha defines if alpha is stored as premultiplied (default is false)
     * @param allowGPUOptimization true to allow some specific GPU optimizations (subject to engine feature "allowGPUOptimizationsForGUI" being true)
     */
    public update(invertY?: boolean, premulAlpha = false, allowGPUOptimization = false): void {
        // When disposed, this._texture will be null.
        if (!this._texture) {
            return;
        }

        this._getEngine()!.updateDynamicTexture(
            this._texture,
            this._canvas,
            invertY === undefined ? true : invertY,
            premulAlpha,
            this._format || undefined,
            undefined,
            allowGPUOptimization
        );
    }

    /**
     * Draws text onto the texture
     * @param text defines the text to be drawn
     * @param x defines the placement of the text from the left
     * @param y defines the placement of the text from the top when invertY is true and from the bottom when false
     * @param font defines the font to be used with font-style, font-size, font-name
     * @param color defines the color used for the text
     * @param fillColor defines the color for the canvas, use null to not overwrite canvas (this bleands with the background to replace, use the clear function)
     * @param invertY defines the direction for the Y axis (default is true - y increases downwards)
     * @param update defines whether texture is immediately update (default is true)
     */
    public drawText(
        text: string,
        x: number | null | undefined,
        y: number | null | undefined,
        font: string,
        color: string | null,
        fillColor: string | null,
        invertY?: boolean,
        update = true
    ) {
        const size = this.getSize();
        if (fillColor) {
            this._context.fillStyle = fillColor;
            this._context.fillRect(0, 0, size.width, size.height);
        }

        this._context.font = font;
        if (x === null || x === undefined) {
            const textSize = this._context.measureText(text);
            x = (size.width - textSize.width) / 2;
        }
        if (y === null || y === undefined) {
            const fontSize = parseInt(font.replace(/\D/g, ""));
            y = size.height / 2 + fontSize / 3.65;
        }

        this._context.fillStyle = color || "";
        this._context.fillText(text, x, y);

        if (update) {
            this.update(invertY);
        }
    }

    /**
     * Disposes the dynamic texture.
     */
    public override dispose(): void {
        super.dispose();

        if (this._ownCanvas) {
            this._canvas?.remove?.();
        }
        (this._canvas as any) = null;
        (this._context as any) = null;
    }

    /**
     * Clones the texture
     * @returns the clone of the texture.
     */
    public override clone(): DynamicTexture {
        const scene = this.getScene();

        if (!scene) {
            return this;
        }

        const textureSize = this.getSize();
        const newTexture = new DynamicTexture(this.name, textureSize, scene, this._generateMipMaps);

        // Base texture
        newTexture.hasAlpha = this.hasAlpha;
        newTexture.level = this.level;

        // Dynamic Texture
        newTexture.wrapU = this.wrapU;
        newTexture.wrapV = this.wrapV;

        return newTexture;
    }

    /**
     * Serializes the dynamic texture.  The scene should be ready before the dynamic texture is serialized
     * @returns a serialized dynamic texture object
     */
    public override serialize(): any {
        const scene = this.getScene();
        if (scene && !scene.isReady()) {
            Logger.Warn("The scene must be ready before serializing the dynamic texture");
        }

        const serializationObject = super.serialize();
        if (DynamicTexture._IsCanvasElement(this._canvas)) {
            serializationObject.base64String = this._canvas.toDataURL();
        }

        serializationObject.invertY = this._invertY;
        serializationObject.samplingMode = this.samplingMode;

        return serializationObject;
    }

    private static _IsCanvasElement(canvas: HTMLCanvasElement | OffscreenCanvas | ICanvas): canvas is HTMLCanvasElement {
        return (canvas as HTMLCanvasElement).toDataURL !== undefined;
    }

    /** @internal */
    public override _rebuild(): void {
        this.update();
    }
}
