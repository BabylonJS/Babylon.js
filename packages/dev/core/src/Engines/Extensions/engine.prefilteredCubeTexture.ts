import { ThinEngine } from "../../Engines/thinEngine";
import { InternalTexture, InternalTextureSource } from "../../Materials/Textures/internalTexture";
import { Logger } from "../../Misc/logger";
import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import { Constants } from "../constants";
import { SphericalPolynomial } from "core/Maths/sphericalPolynomial";
import { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { DDSInfo } from "core/Misc/dds";
import { DDSTools } from "core/Misc/dds";

declare module "../../Engines/abstractEngine" {
    export interface AbstractEngine {
        /**
         * Create a cube texture from prefiltered data (ie. the mipmaps contain ready to use data for PBR reflection)
         * @param rootUrl defines the url where the file to load is located
         * @param scene defines the current scene
         * @param lodScale defines scale to apply to the mip map selection
         * @param lodOffset defines offset to apply to the mip map selection
         * @param onLoad defines an optional callback raised when the texture is loaded
         * @param onError defines an optional callback raised if there is an issue to load the texture
         * @param format defines the format of the data
         * @param forcedExtension defines the extension to use to pick the right loader
         * @param createPolynomials defines wheter or not to create polynomails harmonics for the texture
         * @returns the cube texture as an InternalTexture
         */
        createPrefilteredCubeTexture(
            rootUrl: string,
            scene: Nullable<Scene>,
            lodScale: number,
            lodOffset: number,
            onLoad?: Nullable<(internalTexture: Nullable<InternalTexture>) => void>,
            onError?: Nullable<(message?: string, exception?: any) => void>,
            format?: number,
            forcedExtension?: any,
            createPolynomials?: boolean
        ): InternalTexture;
    }
}

ThinEngine.prototype.createPrefilteredCubeTexture = function (
    rootUrl: string,
    scene: Nullable<Scene>,
    lodScale: number,
    lodOffset: number,
    onLoad: Nullable<(internalTexture: Nullable<InternalTexture>) => void> = null,
    onError: Nullable<(message?: string, exception?: any) => void> = null,
    format?: number,
    forcedExtension: any = null,
    createPolynomials: boolean = true
): InternalTexture {
    const callback = (loadData: any) => {
        if (!loadData) {
            if (onLoad) {
                onLoad(null);
            }
            return;
        }

        const texture = loadData.texture as InternalTexture;
        if (!createPolynomials) {
            texture._sphericalPolynomial = new SphericalPolynomial();
        } else if (loadData.info.sphericalPolynomial) {
            texture._sphericalPolynomial = loadData.info.sphericalPolynomial;
        }
        texture._source = InternalTextureSource.CubePrefiltered;

        if (this.getCaps().textureLOD) {
            // Do not add extra process if texture lod is supported.
            if (onLoad) {
                onLoad(texture);
            }
            return;
        }

        const mipSlices = 3;

        const gl = this._gl;
        const width = loadData.width;
        if (!width) {
            return;
        }

        const textures: BaseTexture[] = [];
        for (let i = 0; i < mipSlices; i++) {
            //compute LOD from even spacing in smoothness (matching shader calculation)
            const smoothness = i / (mipSlices - 1);
            const roughness = 1 - smoothness;

            const minLODIndex = lodOffset; // roughness = 0
            const maxLODIndex = Math.log2(width) * lodScale + lodOffset; // roughness = 1

            const lodIndex = minLODIndex + (maxLODIndex - minLODIndex) * roughness;
            const mipmapIndex = Math.round(Math.min(Math.max(lodIndex, 0), maxLODIndex));

            const glTextureFromLod = new InternalTexture(this, InternalTextureSource.Temp);
            glTextureFromLod.type = texture.type;
            glTextureFromLod.format = texture.format;
            glTextureFromLod.width = Math.pow(2, Math.max(Math.log2(width) - mipmapIndex, 0));
            glTextureFromLod.height = glTextureFromLod.width;
            glTextureFromLod.isCube = true;
            glTextureFromLod._cachedWrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
            glTextureFromLod._cachedWrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, glTextureFromLod, true);

            glTextureFromLod.samplingMode = Constants.TEXTURE_LINEAR_LINEAR;
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            if (loadData.isDDS) {
                const info: DDSInfo = loadData.info;
                const data: any = loadData.data;
                this._unpackFlipY(info.isCompressed);

                DDSTools.UploadDDSLevels(this, glTextureFromLod, data, info, true, 6, mipmapIndex);
            } else {
                Logger.Warn("DDS is the only prefiltered cube map supported so far.");
            }

            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);

            // Wrap in a base texture for easy binding.
            const lodTexture = new BaseTexture(scene);
            lodTexture._isCube = true;
            lodTexture._texture = glTextureFromLod;

            glTextureFromLod.isReady = true;
            textures.push(lodTexture);
        }

        texture._lodTextureHigh = textures[2];
        texture._lodTextureMid = textures[1];
        texture._lodTextureLow = textures[0];

        if (onLoad) {
            onLoad(texture);
        }
    };

    return this.createCubeTexture(rootUrl, scene, null, false, callback, onError, format, forcedExtension, createPolynomials, lodScale, lodOffset);
};
