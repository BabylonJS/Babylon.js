declare module "babylonjs-post-process/asciiArt/asciiart.fragment" {
    /** @hidden */
    export var asciiartPixelShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-post-process/asciiArt/asciiArtPostProcess" {
    import { Nullable } from "babylonjs/types";
    import { Camera } from "babylonjs/Cameras/camera";
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    import { PostProcess } from "babylonjs/PostProcesses/postProcess";
    import { Scene } from "babylonjs/scene";
    import "babylonjs-post-process/asciiArt/asciiart.fragment";
    /**
     * AsciiArtFontTexture is the helper class used to easily create your ascii art font texture.
     *
     * It basically takes care rendering the font front the given font size to a texture.
     * This is used later on in the postprocess.
     */
    export class AsciiArtFontTexture extends BaseTexture {
        private _font;
        private _text;
        private _charSize;
        /**
         * Gets the size of one char in the texture (each char fits in size * size space in the texture).
         */
        readonly charSize: number;
        /**
         * Create a new instance of the Ascii Art FontTexture class
         * @param name the name of the texture
         * @param font the font to use, use the W3C CSS notation
         * @param text the caracter set to use in the rendering.
         * @param scene the scene that owns the texture
         */
        constructor(name: string, font: string, text: string, scene?: Nullable<Scene>);
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
        static Parse(source: any, scene: Scene): AsciiArtFontTexture;
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
    export class AsciiArtPostProcess extends PostProcess {
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
        constructor(name: string, camera: Camera, options?: string | IAsciiArtPostProcessOptions);
    }
}
declare module "babylonjs-post-process/asciiArt/index" {
    export * from "babylonjs-post-process/asciiArt/asciiArtPostProcess";
}
declare module "babylonjs-post-process/digitalRain/digitalrain.fragment" {
    /** @hidden */
    export var digitalrainPixelShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-post-process/digitalRain/digitalRainPostProcess" {
    import { Nullable } from "babylonjs/types";
    import { Camera } from "babylonjs/Cameras/camera";
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    import { PostProcess } from "babylonjs/PostProcesses/postProcess";
    import { Scene } from "babylonjs/scene";
    import "babylonjs-post-process/digitalRain/digitalrain.fragment";
    /**
     * DigitalRainFontTexture is the helper class used to easily create your digital rain font texture.
     *
     * It basically takes care rendering the font front the given font size to a texture.
     * This is used later on in the postprocess.
     */
    export class DigitalRainFontTexture extends BaseTexture {
        private _font;
        private _text;
        private _charSize;
        /**
         * Gets the size of one char in the texture (each char fits in size * size space in the texture).
         */
        readonly charSize: number;
        /**
         * Create a new instance of the Digital Rain FontTexture class
         * @param name the name of the texture
         * @param font the font to use, use the W3C CSS notation
         * @param text the caracter set to use in the rendering.
         * @param scene the scene that owns the texture
         */
        constructor(name: string, font: string, text: string, scene?: Nullable<Scene>);
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
        static Parse(source: any, scene: Scene): DigitalRainFontTexture;
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
        constructor(name: string, camera: Camera, options?: string | IDigitalRainPostProcessOptions);
    }
}
declare module "babylonjs-post-process/digitalRain/index" {
    export * from "babylonjs-post-process/digitalRain/digitalRainPostProcess";
}
declare module "babylonjs-post-process/ocean/oceanPostProcess.fragment" {
    /** @hidden */
    export var oceanPostProcessPixelShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-post-process/ocean/oceanPostProcess" {
    import { TargetCamera } from "babylonjs/Cameras/targetCamera";
    import { MirrorTexture } from "babylonjs/Materials/Textures/mirrorTexture";
    import { RenderTargetTexture } from "babylonjs/Materials/Textures/renderTargetTexture";
    import { PostProcess } from "babylonjs/PostProcesses/postProcess";
    import "babylonjs-post-process/ocean/oceanPostProcess.fragment";
    /**
     * Option available in the Ocean Post Process.
     */
    export interface IOceanPostProcessOptions {
        /**
         * The size of the reflection RTT (number if square, or {width: number, height:number} or {ratio:} to define a ratio from the main scene)
         */
        reflectionSize?: number | {
            width: number;
            height: number;
        } | {
            ratio: number;
        };
        /**
         * The size of the refraction RTT (number if square, or {width: number, height:number} or {ratio:} to define a ratio from the main scene)
         */
        refractionSize?: number | {
            width: number;
            height: number;
        } | {
            ratio: number;
        };
    }
    /**
     * OceanPostProcess helps rendering an infinite ocean surface that can reflect and refract environment.
     *
     * Simmply add it to your scene and let the nerd that lives in you have fun.
     * Example usage:
     *  var pp = new OceanPostProcess("myOcean", camera);
     *  pp.reflectionEnabled = true;
     *  pp.refractionEnabled = true;
     */
    export class OceanPostProcess extends PostProcess {
        /**
         * Gets a boolean indicating if the real-time reflection is enabled on the ocean.
         */
        /**
        * Sets weither or not the real-time reflection is enabled on the ocean.
        * Is set to true, the reflection mirror texture will be used as reflection texture.
        */
        reflectionEnabled: boolean;
        /**
         * Gets a boolean indicating if the real-time refraction is enabled on the ocean.
         */
        /**
        * Sets weither or not the real-time refraction is enabled on the ocean.
        * Is set to true, the refraction render target texture will be used as refraction texture.
        */
        refractionEnabled: boolean;
        /**
         * Gets wether or not the post-processes is supported by the running hardware.
         * This requires draw buffer supports.
         */
        readonly isSupported: boolean;
        /**
         * This is the reflection mirror texture used to display reflections on the ocean.
         * By default, render list is empty.
         */
        reflectionTexture: MirrorTexture;
        /**
         * This is the refraction render target texture used to display refraction on the ocean.
         * By default, render list is empty.
         */
        refractionTexture: RenderTargetTexture;
        private _time;
        private _cameraRotation;
        private _cameraViewMatrix;
        private _reflectionEnabled;
        private _refractionEnabled;
        private _geometryRenderer;
        /**
         * Instantiates a new Ocean Post Process.
         * @param name the name to give to the postprocess.
         * @camera the camera to apply the post process to.
         * @param options optional object following the IOceanPostProcessOptions format used to customize reflection and refraction render targets sizes.
         */
        constructor(name: string, camera: TargetCamera, options?: IOceanPostProcessOptions);
        /**
         * Returns the appropriate defines according to the current configuration.
         */
        private _getDefines;
        /**
         * Computes the current camera rotation as the shader requires a camera rotation.
         */
        private _computeCameraRotation;
    }
}
declare module "babylonjs-post-process/ocean/index" {
    export * from "babylonjs-post-process/ocean/oceanPostProcess";
}
declare module "babylonjs-post-process/index" {
    export * from "babylonjs-post-process/asciiArt/index";
    export * from "babylonjs-post-process/digitalRain/index";
    export * from "babylonjs-post-process/ocean/index";
}
declare module "babylonjs-post-process/legacy/legacy-asciiArt" {
    export * from "babylonjs-post-process/asciiArt/index";
}
declare module "babylonjs-post-process/legacy/legacy-digitalRain" {
    export * from "babylonjs-post-process/digitalRain/index";
}
declare module "babylonjs-post-process/legacy/legacy-ocean" {
    export * from "babylonjs-post-process/ocean/index";
}
declare module "babylonjs-post-process/legacy/legacy" {
    export * from "babylonjs-post-process/index";
}
declare module "babylonjs-post-process" {
    export * from "babylonjs-post-process/legacy/legacy";
}
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
        readonly charSize: number;
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
        readonly charSize: number;
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
declare module BABYLON {
    /** @hidden */
    export var oceanPostProcessPixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    /**
     * Option available in the Ocean Post Process.
     */
    export interface IOceanPostProcessOptions {
        /**
         * The size of the reflection RTT (number if square, or {width: number, height:number} or {ratio:} to define a ratio from the main scene)
         */
        reflectionSize?: number | {
            width: number;
            height: number;
        } | {
            ratio: number;
        };
        /**
         * The size of the refraction RTT (number if square, or {width: number, height:number} or {ratio:} to define a ratio from the main scene)
         */
        refractionSize?: number | {
            width: number;
            height: number;
        } | {
            ratio: number;
        };
    }
    /**
     * OceanPostProcess helps rendering an infinite ocean surface that can reflect and refract environment.
     *
     * Simmply add it to your scene and let the nerd that lives in you have fun.
     * Example usage:
     *  var pp = new OceanPostProcess("myOcean", camera);
     *  pp.reflectionEnabled = true;
     *  pp.refractionEnabled = true;
     */
    export class OceanPostProcess extends BABYLON.PostProcess {
        /**
         * Gets a boolean indicating if the real-time reflection is enabled on the ocean.
         */
        /**
        * Sets weither or not the real-time reflection is enabled on the ocean.
        * Is set to true, the reflection mirror texture will be used as reflection texture.
        */
        reflectionEnabled: boolean;
        /**
         * Gets a boolean indicating if the real-time refraction is enabled on the ocean.
         */
        /**
        * Sets weither or not the real-time refraction is enabled on the ocean.
        * Is set to true, the refraction render target texture will be used as refraction texture.
        */
        refractionEnabled: boolean;
        /**
         * Gets wether or not the post-processes is supported by the running hardware.
         * This requires draw buffer supports.
         */
        readonly isSupported: boolean;
        /**
         * This is the reflection mirror texture used to display reflections on the ocean.
         * By default, render list is empty.
         */
        reflectionTexture: BABYLON.MirrorTexture;
        /**
         * This is the refraction render target texture used to display refraction on the ocean.
         * By default, render list is empty.
         */
        refractionTexture: BABYLON.RenderTargetTexture;
        private _time;
        private _cameraRotation;
        private _cameraViewMatrix;
        private _reflectionEnabled;
        private _refractionEnabled;
        private _geometryRenderer;
        /**
         * Instantiates a new Ocean Post Process.
         * @param name the name to give to the postprocess.
         * @camera the camera to apply the post process to.
         * @param options optional object following the IOceanPostProcessOptions format used to customize reflection and refraction render targets sizes.
         */
        constructor(name: string, camera: BABYLON.TargetCamera, options?: IOceanPostProcessOptions);
        /**
         * Returns the appropriate defines according to the current configuration.
         */
        private _getDefines;
        /**
         * Computes the current camera rotation as the shader requires a camera rotation.
         */
        private _computeCameraRotation;
    }
}