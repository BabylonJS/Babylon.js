import type { Nullable } from "core/types";
import { serialize, SerializationHelper } from "core/Misc/decorators";
import { Matrix } from "core/Maths/math.vector";
import type { Camera } from "core/Cameras/camera";
import { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Texture } from "core/Materials/Textures/texture";
import type { Effect } from "core/Materials/effect";
import { PostProcess } from "core/PostProcesses/postProcess";
import type { Scene } from "core/scene";
import "core/Engines/Extensions/engine.dynamicTexture";
import "./digitalrain.fragment";

/**
 * DigitalRainFontTexture is the helper class used to easily create your digital rain font texture.
 *
 * It basically takes care rendering the font front the given font size to a texture.
 * This is used later on in the postprocess.
 */
export class DigitalRainFontTexture extends BaseTexture {
    @serialize("font")
    private _font: string;

    @serialize("text")
    private _text: string;

    private _charSize: number;

    /**
     * Gets the size of one char in the texture (each char fits in size * size space in the texture).
     */
    public get charSize(): number {
        return this._charSize;
    }

    /**
     * Create a new instance of the Digital Rain FontTexture class
     * @param name the name of the texture
     * @param font the font to use, use the W3C CSS notation
     * @param text the caracter set to use in the rendering.
     * @param scene the scene that owns the texture
     */
    constructor(name: string, font: string, text: string, scene: Nullable<Scene> = null) {
        super(scene);

        scene = this.getScene();

        if (!scene) {
            return;
        }

        this.name = name;
        this._text == text;
        this._font == font;

        this.wrapU = Texture.CLAMP_ADDRESSMODE;
        this.wrapV = Texture.CLAMP_ADDRESSMODE;

        // Get the font specific info.
        const maxCharHeight = this._getFontHeight(font);
        const maxCharWidth = this._getFontWidth(font);

        this._charSize = Math.max(maxCharHeight.height, maxCharWidth);

        // This is an approximate size, but should always be able to fit at least the maxCharCount.
        const textureWidth = this._charSize;
        const textureHeight = Math.ceil(this._charSize * text.length);

        // Create the texture that will store the font characters.
        this._texture = scene.getEngine().createDynamicTexture(textureWidth, textureHeight, false, Texture.NEAREST_SAMPLINGMODE);
        //scene.getEngine().setclamp
        const textureSize = this.getSize();

        // Create a canvas with the final size: the one matching the texture.
        const canvas = document.createElement("canvas");
        canvas.width = textureSize.width;
        canvas.height = textureSize.height;
        const context = <CanvasRenderingContext2D>canvas.getContext("2d");
        context.textBaseline = "top";
        context.font = font;
        context.fillStyle = "white";
        context.imageSmoothingEnabled = false;

        // Sets the text in the texture.
        for (let i = 0; i < text.length; i++) {
            context.fillText(text[i], 0, i * this._charSize - maxCharHeight.offset);
        }

        // Flush the text in the dynamic texture.
        scene.getEngine().updateDynamicTexture(this._texture, canvas, false, true);
    }

    /**
     * Gets the max char width of a font.
     * @param font the font to use, use the W3C CSS notation
     * @returns the max char width
     */
    private _getFontWidth(font: string): number {
        const fontDraw = document.createElement("canvas");
        const ctx = <CanvasRenderingContext2D>fontDraw.getContext("2d");
        ctx.fillStyle = "white";
        ctx.font = font;

        return ctx.measureText("W").width;
    }

    // More info here: https://videlais.com/2014/03/16/the-many-and-varied-problems-with-measuring-font-height-for-html5-canvas/
    /**
     * Gets the max char height of a font.
     * @param font the font to use, use the W3C CSS notation
     * @returns the max char height
     */
    private _getFontHeight(font: string): { height: number; offset: number } {
        const fontDraw = document.createElement("canvas");
        const ctx = <CanvasRenderingContext2D>fontDraw.getContext("2d");
        ctx.fillRect(0, 0, fontDraw.width, fontDraw.height);
        ctx.textBaseline = "top";
        ctx.fillStyle = "white";
        ctx.font = font;
        ctx.fillText("jH|", 0, 0);
        const pixels = ctx.getImageData(0, 0, fontDraw.width, fontDraw.height).data;
        let start = -1;
        let end = -1;
        for (let row = 0; row < fontDraw.height; row++) {
            for (let column = 0; column < fontDraw.width; column++) {
                const index = (row * fontDraw.width + column) * 4;
                if (pixels[index] === 0) {
                    if (column === fontDraw.width - 1 && start !== -1) {
                        end = row;
                        row = fontDraw.height;
                        break;
                    }
                    continue;
                } else {
                    if (start === -1) {
                        start = row;
                    }
                    break;
                }
            }
        }
        return { height: end - start + 1, offset: start - 1 };
    }

    /**
     * Clones the current DigitalRainFontTexture.
     * @returns the clone of the texture.
     */
    public clone(): DigitalRainFontTexture {
        return new DigitalRainFontTexture(this.name, this._font, this._text, this.getScene());
    }

    /**
     * Parses a json object representing the texture and returns an instance of it.
     * @param source the source JSON representation
     * @param scene the scene to create the texture for
     * @returns the parsed texture
     */
    public static Parse(source: any, scene: Scene): DigitalRainFontTexture {
        const texture = SerializationHelper.Parse(() => new DigitalRainFontTexture(source.name, source.font, source.text, scene), source, scene, null);

        return texture;
    }
}

/**
 * Option available in the Digital Rain Post Process.
 */
export interface IDigitalRainPostProcessOptions {
    /**
     * The font to use following the w3c font definition.
     */
    font?: string;

    /**
     * This defines the amount you want to mix the "tile" or caracter space colored in the digital rain.
     * This number is defined between 0 and 1;
     */
    mixToTile?: number;

    /**
     * This defines the amount you want to mix the normal rendering pass in the digital rain.
     * This number is defined between 0 and 1;
     */
    mixToNormal?: number;
}

/**
 * DigitalRainPostProcess helps rendering everithing in digital rain.
 *
 * Simmply add it to your scene and let the nerd that lives in you have fun.
 * Example usage: var pp = new DigitalRainPostProcess("digitalRain", "20px Monospace", camera);
 */
export class DigitalRainPostProcess extends PostProcess {
    /**
     * The font texture used to render the char in the post process.
     */
    private _digitalRainFontTexture: DigitalRainFontTexture;

    /**
     * This defines the amount you want to mix the "tile" or caracter space colored in the digital rain.
     * This number is defined between 0 and 1;
     */
    public mixToTile: number = 0;

    /**
     * This defines the amount you want to mix the normal rendering pass in the digital rain.
     * This number is defined between 0 and 1;
     */
    public mixToNormal: number = 0;

    /**
     * Speed of the effect
     */
    public speed: number = 0.003;

    /**
     * Instantiates a new Digital Rain Post Process.
     * @param name the name to give to the postprocess
     * @camera the camera to apply the post process to.
     * @param camera
     * @param options can either be the font name or an option object following the IDigitalRainPostProcessOptions format
     */
    constructor(name: string, camera: Nullable<Camera>, options?: string | IDigitalRainPostProcessOptions) {
        super(
            name,
            "digitalrain",
            ["digitalRainFontInfos", "digitalRainOptions", "cosTimeZeroOne", "matrixSpeed"],
            ["digitalRainFont"],
            1.0,
            camera,
            Texture.TRILINEAR_SAMPLINGMODE,
            undefined,
            true
        );

        // Default values.
        let font = "15px Monospace";
        const characterSet =
            "古池や蛙飛び込む水の音ふるいけやかわずとびこむみずのおと初しぐれ猿も小蓑をほしげ也はつしぐれさるもこみのをほしげなり江戸の雨何石呑んだ時鳥えどのあめなんごくのんだほととぎす";

        // Use options.
        if (options) {
            if (typeof options === "string") {
                font = <string>options;
            } else {
                font = (<IDigitalRainPostProcessOptions>options).font || font;
                this.mixToTile = (<IDigitalRainPostProcessOptions>options).mixToTile || this.mixToTile;
                this.mixToNormal = (<IDigitalRainPostProcessOptions>options).mixToNormal || this.mixToNormal;
            }
        }

        const scene = camera?.getScene() || null;
        this._digitalRainFontTexture = new DigitalRainFontTexture(name, font, characterSet, scene);
        const textureSize = this._digitalRainFontTexture.getSize();

        let alpha = 0.0;
        let cosTimeZeroOne = 0.0;
        const matrix = Matrix.FromValues(
            Math.random(),
            Math.random(),
            Math.random(),
            Math.random(),
            Math.random(),
            Math.random(),
            Math.random(),
            Math.random(),
            Math.random(),
            Math.random(),
            Math.random(),
            Math.random(),
            Math.random(),
            Math.random(),
            Math.random(),
            Math.random()
        );

        this.onApply = (effect: Effect) => {
            effect.setTexture("digitalRainFont", this._digitalRainFontTexture);

            effect.setFloat4("digitalRainFontInfos", this._digitalRainFontTexture.charSize, characterSet.length, textureSize.width, textureSize.height);

            effect.setFloat4("digitalRainOptions", this.width, this.height, this.mixToNormal, this.mixToTile);

            effect.setMatrix("matrixSpeed", matrix);

            alpha += this.speed;
            cosTimeZeroOne = alpha;
            effect.setFloat("cosTimeZeroOne", cosTimeZeroOne);
        };
    }
}
