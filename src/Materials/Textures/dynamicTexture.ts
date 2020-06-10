import { Logger } from "../../Misc/logger";
import { Nullable } from "../../types";
import { Scene } from "../../scene";
import { ISize } from "../../Maths/math.size";
import { Texture } from "../../Materials/Textures/texture";
import { Constants } from "../../Engines/constants";
import "../../Engines/Extensions/engine.dynamicTexture";
import { CanvasGenerator } from '../../Misc/canvasGenerator';

/**
 * A class extending Texture allowing drawing on a texture
 * @see http://doc.babylonjs.com/how_to/dynamictexture
 */
export class DynamicTexture extends Texture {
    private _generateMipMaps: boolean;
    private _canvas: HTMLCanvasElement | OffscreenCanvas;
    private _context: CanvasRenderingContext2D;

    /**
     * Creates a DynamicTexture
     * @param name defines the name of the texture
     * @param options provides 3 alternatives for width and height of texture, a canvas, object with width and height properties, number for both width and height
     * @param scene defines the scene where you want the texture
     * @param generateMipMaps defines the use of MinMaps or not (default is false)
     * @param samplingMode defines the sampling mode to use (default is Texture.TRILINEAR_SAMPLINGMODE)
     * @param format defines the texture format to use (default is Engine.TEXTUREFORMAT_RGBA)
     */

    constructor(name: string, options: any, scene: Nullable<Scene> = null, generateMipMaps: boolean, samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, format: number = Constants.TEXTUREFORMAT_RGBA) {
        super(null, scene, !generateMipMaps, undefined, samplingMode, undefined, undefined, undefined, undefined, format);

        this.name = name;
        this.wrapU = Texture.CLAMP_ADDRESSMODE;
        this.wrapV = Texture.CLAMP_ADDRESSMODE;

        this._generateMipMaps = generateMipMaps;

        const engine = this._getEngine();
        if (!engine) {
            return;
        }

        if (options.getContext) {
            this._canvas = options;
            this._texture = engine.createDynamicTexture(options.width, options.height, generateMipMaps, samplingMode);
        } else {
            this._canvas = CanvasGenerator.CreateCanvas(1, 1);

            if (options.width || options.width === 0) {
                this._texture = engine.createDynamicTexture(options.width, options.height, generateMipMaps, samplingMode);
            } else {
                this._texture = engine.createDynamicTexture(options, options, generateMipMaps, samplingMode);
            }
        }

        var textureSize = this.getSize();

        this._canvas.width = textureSize.width;
        this._canvas.height = textureSize.height;
        this._context = <CanvasRenderingContext2D>this._canvas.getContext("2d");
    }

    /**
     * Get the current class name of the texture useful for serialization or dynamic coding.
     * @returns "DynamicTexture"
     */
    public getClassName(): string {
        return "DynamicTexture";
    }

    /**
     * Gets the current state of canRescale
     */
    public get canRescale(): boolean {
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
    public scale(ratio: number): void {
        var textureSize = this.getSize();

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
        var textureSize = this.getSize();

        textureSize.width = width;
        textureSize.height = height;

        this._recreate(textureSize);
    }

    /**
     * Gets the context of the canvas used by the texture
     * @returns the canvas context of the dynamic texture
     */
    public getContext(): CanvasRenderingContext2D {
        return this._context;
    }

    /**
     * Clears the texture
     */
    public clear(): void {
        var size = this.getSize();
        this._context.fillRect(0, 0, size.width, size.height);
    }

    /**
     * Updates the texture
     * @param invertY defines the direction for the Y axis (default is true - y increases downwards)
     * @param premulAlpha defines if alpha is stored as premultiplied (default is false)
     */
    public update(invertY?: boolean, premulAlpha = false): void {
        this._getEngine()!.updateDynamicTexture(this._texture, this._canvas, invertY === undefined ? true : invertY, premulAlpha, this._format || undefined);
    }

    /**
     * Draws text onto the texture
     * @param text defines the text to be drawn
     * @param x defines the placement of the text from the left
     * @param y defines the placement of the text from the top when invertY is true and from the bottom when false
     * @param font defines the font to be used with font-style, font-size, font-name
     * @param color defines the color used for the text
     * @param clearColor defines the color for the canvas, use null to not overwrite canvas
     * @param invertY defines the direction for the Y axis (default is true - y increases downwards)
     * @param update defines whether texture is immediately update (default is true)
     */
    public drawText(text: string, x: number | null | undefined, y: number | null | undefined, font: string, color: string | null, clearColor: string, invertY?: boolean, update = true) {
        var size = this.getSize();
        if (clearColor) {
            this._context.fillStyle = clearColor;
            this._context.fillRect(0, 0, size.width, size.height);
        }

        this._context.font = font;
        if (x === null || x === undefined) {
            var textSize = this._context.measureText(text);
            x = (size.width - textSize.width) / 2;
        }
        if (y === null || y === undefined) {
            var fontSize = parseInt((font.replace(/\D/g, '')));
            y = (size.height / 2) + (fontSize / 3.65);
        }

        this._context.fillStyle = color || "";
        this._context.fillText(text, x, y);

        if (update) {
            this.update(invertY);
        }
    }

    /**
     * Clones the texture
     * @returns the clone of the texture.
     */
    public clone(): DynamicTexture {
        let scene = this.getScene();

        if (!scene) {
            return this;
        }

        var textureSize = this.getSize();
        var newTexture = new DynamicTexture(this.name, textureSize, scene, this._generateMipMaps);

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
    public serialize(): any {
        const scene = this.getScene();
        if (scene && !scene.isReady()) {
            Logger.Warn("The scene must be ready before serializing the dynamic texture");
        }

        const serializationObject = super.serialize();
        if (this._IsCanvasElement(this._canvas)) {
            serializationObject.base64String = (this._canvas as HTMLCanvasElement).toDataURL();
        }

        serializationObject.invertY = this._invertY;
        serializationObject.samplingMode = this.samplingMode;

        return serializationObject;
    }

    private _IsCanvasElement(canvas: HTMLCanvasElement | OffscreenCanvas): canvas is HTMLCanvasElement {
        return (canvas as HTMLCanvasElement).toDataURL !== undefined;
    }

    /** @hidden */
    public _rebuild(): void {
        this.update();
    }
}
