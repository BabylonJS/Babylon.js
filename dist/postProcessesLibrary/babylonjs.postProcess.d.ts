declare module BABYLON {
    /** @hidden */
    export var asciiartPixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    /**
     * AsciiArtFontTexture is the helper class used to easily create your ascii art font texture.
     *
     * It basically takes care rendering the font front the given font size to a texture.
     * This is used later on in the postprocess.
     */
    export class AsciiArtFontTexture extends BABYLON.BaseTexture {
        private _font;
        private _text;
        private _charSize;
        /**
         * Gets the size of one char in the texture (each char fits in size * size space in the texture).
         */
        get charSize(): number;
        /**
         * Create a new instance of the Ascii Art FontTexture class
         * @param name the name of the texture
         * @param font the font to use, use the W3C CSS notation
         * @param text the caracter set to use in the rendering.
         * @param scene the scene that owns the texture
         */
        constructor(name: string, font: string, text: string, scene?: BABYLON.Nullable<BABYLON.Scene>);
        /**
         * Gets the max char width of a font.
         * @param font the font to use, use the W3C CSS notation
         * @return the max char width
         */
        private getFontWidth;
        /**
         * Gets the max char height of a font.
         * @param font the font to use, use the W3C CSS notation
         * @return the max char height
         */
        private getFontHeight;
        /**
         * Clones the current AsciiArtTexture.
         * @return the clone of the texture.
         */
        clone(): AsciiArtFontTexture;
        /**
         * Parses a json object representing the texture and returns an instance of it.
         * @param source the source JSON representation
         * @param scene the scene to create the texture for
         * @return the parsed texture
         */
        static Parse(source: any, scene: BABYLON.Scene): AsciiArtFontTexture;
    }
    /**
     * Option available in the Ascii Art Post Process.
     */
    export interface IAsciiArtPostProcessOptions {
        /**
         * The font to use following the w3c font definition.
         */
        font?: string;
        /**
         * The character set to use in the postprocess.
         */
        characterSet?: string;
        /**
         * This defines the amount you want to mix the "tile" or caracter space colored in the ascii art.
         * This number is defined between 0 and 1;
         */
        mixToTile?: number;
        /**
         * This defines the amount you want to mix the normal rendering pass in the ascii art.
         * This number is defined between 0 and 1;
         */
        mixToNormal?: number;
    }
    /**
     * AsciiArtPostProcess helps rendering everithing in Ascii Art.
     *
     * Simmply add it to your scene and let the nerd that lives in you have fun.
     * Example usage: var pp = new AsciiArtPostProcess("myAscii", "20px Monospace", camera);
     */
    export class AsciiArtPostProcess extends BABYLON.PostProcess {
        /**
         * The font texture used to render the char in the post process.
         */
        private _asciiArtFontTexture;
        /**
         * This defines the amount you want to mix the "tile" or caracter space colored in the ascii art.
         * This number is defined between 0 and 1;
         */
        mixToTile: number;
        /**
         * This defines the amount you want to mix the normal rendering pass in the ascii art.
         * This number is defined between 0 and 1;
         */
        mixToNormal: number;
        /**
         * Instantiates a new Ascii Art Post Process.
         * @param name the name to give to the postprocess
         * @camera the camera to apply the post process to.
         * @param options can either be the font name or an option object following the IAsciiArtPostProcessOptions format
         */
        constructor(name: string, camera: BABYLON.Camera, options?: string | IAsciiArtPostProcessOptions);
    }
}
declare module BABYLON {
    /** @hidden */
    export var digitalrainPixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    /**
     * DigitalRainFontTexture is the helper class used to easily create your digital rain font texture.
     *
     * It basically takes care rendering the font front the given font size to a texture.
     * This is used later on in the postprocess.
     */
    export class DigitalRainFontTexture extends BABYLON.BaseTexture {
        private _font;
        private _text;
        private _charSize;
        /**
         * Gets the size of one char in the texture (each char fits in size * size space in the texture).
         */
        get charSize(): number;
        /**
         * Create a new instance of the Digital Rain FontTexture class
         * @param name the name of the texture
         * @param font the font to use, use the W3C CSS notation
         * @param text the caracter set to use in the rendering.
         * @param scene the scene that owns the texture
         */
        constructor(name: string, font: string, text: string, scene?: BABYLON.Nullable<BABYLON.Scene>);
        /**
         * Gets the max char width of a font.
         * @param font the font to use, use the W3C CSS notation
         * @return the max char width
         */
        private getFontWidth;
        /**
         * Gets the max char height of a font.
         * @param font the font to use, use the W3C CSS notation
         * @return the max char height
         */
        private getFontHeight;
        /**
         * Clones the current DigitalRainFontTexture.
         * @return the clone of the texture.
         */
        clone(): DigitalRainFontTexture;
        /**
         * Parses a json object representing the texture and returns an instance of it.
         * @param source the source JSON representation
         * @param scene the scene to create the texture for
         * @return the parsed texture
         */
        static Parse(source: any, scene: BABYLON.Scene): DigitalRainFontTexture;
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
    export class DigitalRainPostProcess extends BABYLON.PostProcess {
        /**
         * The font texture used to render the char in the post process.
         */
        private _digitalRainFontTexture;
        /**
         * This defines the amount you want to mix the "tile" or caracter space colored in the digital rain.
         * This number is defined between 0 and 1;
         */
        mixToTile: number;
        /**
         * This defines the amount you want to mix the normal rendering pass in the digital rain.
         * This number is defined between 0 and 1;
         */
        mixToNormal: number;
        /**
         * Instantiates a new Digital Rain Post Process.
         * @param name the name to give to the postprocess
         * @camera the camera to apply the post process to.
         * @param options can either be the font name or an option object following the IDigitalRainPostProcessOptions format
         */
        constructor(name: string, camera: BABYLON.Camera, options?: string | IDigitalRainPostProcessOptions);
    }
}