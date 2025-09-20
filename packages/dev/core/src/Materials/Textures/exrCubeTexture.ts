import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import { EnvCubeTexture } from "./envCubeTexture";
import { RegisterClass } from "../../Misc/typeStore";
import type { AbstractEngine } from "../../Engines/abstractEngine";
import "../../Materials/Textures/baseTexture.polynomial";
import { PanoramaToCubeMapTools } from "../../Misc/HighDynamicRange/panoramaToCubemap";
import type { CubeMapInfo } from "../../Misc/HighDynamicRange/panoramaToCubemap";
import { ReadExrDataAsync } from "./Loaders/exrTextureLoader";

/**
 * This represents a texture coming from an EXR input.
 */
export class EXRCubeTexture extends EnvCubeTexture {
    /**
     * Instantiates an HDRTexture from the following parameters.
     *
     * @param url The location of the HDR raw data (Panorama stored in RGBE format)
     * @param sceneOrEngine The scene or engine the texture will be used in
     * @param size The cubemap desired size (the more it increases the longer the generation will be)
     * @param noMipmap Forces to not generate the mipmap if true
     * @param generateHarmonics Specifies whether you want to extract the polynomial harmonics during the generation process
     * @param gammaSpace Specifies if the texture will be use in gamma or linear space (the PBR material requires those texture in linear space, but the standard material would require them in Gamma space)
     * @param prefilterOnLoad Prefilters HDR texture to allow use of this texture as a PBR reflection texture.
     * @param onLoad on success callback function
     * @param onError on error callback function
     * @param supersample Defines if texture must be supersampled (default: false)
     * @param prefilterIrradianceOnLoad Prefilters HDR texture to allow use of this texture for irradiance lighting.
     * @param prefilterUsingCdf Defines if the prefiltering should be done using a CDF instead of the default approach.
     */
    constructor(
        url: string,
        sceneOrEngine: Scene | AbstractEngine,
        size: number,
        noMipmap = false,
        generateHarmonics = true,
        gammaSpace = false,
        prefilterOnLoad = false,
        onLoad: Nullable<() => void> = null,
        onError: Nullable<(message?: string, exception?: any) => void> = null,
        supersample = false,
        prefilterIrradianceOnLoad = false,
        prefilterUsingCdf = false
    ) {
        super(url, sceneOrEngine, size, noMipmap, generateHarmonics, gammaSpace, prefilterOnLoad, onLoad, onError, supersample, prefilterIrradianceOnLoad, prefilterUsingCdf);
    }

    /**
     * Get the current class name of the texture useful for serialization or dynamic coding.
     * @returns "EXRCubeTexture"
     */
    public override getClassName(): string {
        return "EXRCubeTexture";
    }

    /**
     * Convert the raw data from the server into cubemap faces
     * @param buffer The buffer containing the texture data
     * @param size The cubemap face size
     * @param supersample Defines if texture must be supersampled
     * @returns The cube map data
     */
    protected async _getCubeMapTextureDataAsync(buffer: ArrayBuffer, size: number, supersample: boolean): Promise<CubeMapInfo> {
        const exrData = await ReadExrDataAsync(buffer);
        if (!exrData.data) {
            throw new Error("EXR data could not be decoded.");
        }

        const cubeMapData = PanoramaToCubeMapTools.ConvertPanoramaToCubemap(exrData.data, exrData.width, exrData.height, size, supersample, false);
        return cubeMapData;
    }

    protected _instantiateClone(): this {
        return new EXRCubeTexture(this.url, this.getScene() || this._getEngine()!, this._size, this._noMipmap, this._generateHarmonics, this.gammaSpace) as this;
    }

    /**
     * Serialize the texture to a JSON representation.
     * @returns The JSON representation of the texture
     */
    public override serialize(): any {
        const serializationObject = super.serialize();
        if (!serializationObject) {
            return null;
        }

        serializationObject.customType = "BABYLON.EXRCubeTexture";

        return serializationObject;
    }

    /**
     * Parses a JSON representation of an EXR Texture in order to create the texture
     * @param parsedTexture Define the JSON representation
     * @param scene Define the scene the texture should be created in
     * @param rootUrl Define the root url in case we need to load relative dependencies
     * @returns the newly created texture after parsing
     */
    public static Parse(parsedTexture: any, scene: Scene, rootUrl: string): Nullable<EXRCubeTexture> {
        if (!parsedTexture.name || parsedTexture.isRenderTarget) {
            return null;
        }

        const texture = new EXRCubeTexture(
            rootUrl + parsedTexture.name,
            scene,
            parsedTexture.size,
            parsedTexture.noMipmap,
            parsedTexture.generateHarmonics,
            parsedTexture.useInGammaSpace
        );
        this._Parse(parsedTexture, texture);
        return texture;
    }
}

RegisterClass("BABYLON.EXRCubeTexture", EXRCubeTexture);
