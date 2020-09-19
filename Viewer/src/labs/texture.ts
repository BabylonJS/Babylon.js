import { Scene } from "babylonjs/scene";
import { CubeTexture } from "babylonjs/Materials/Textures/cubeTexture";
import { InternalTexture, InternalTextureSource } from "babylonjs/Materials/Textures/internalTexture";
import { Scalar } from "babylonjs/Maths/math.scalar";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { Texture } from "babylonjs/Materials/Textures/texture";

/**
 * WebGL Pixel Formats
 */
export const enum PixelFormat {
    DEPTH_COMPONENT = 0x1902,
    ALPHA = 0x1906,
    RGB = 0x1907,
    RGBA = 0x1908,
    LUMINANCE = 0x1909,
    LUMINANCE_ALPHA = 0x190a,
}

/**
 * WebGL Pixel Types
 */
export const enum PixelType {
    UNSIGNED_BYTE = 0x1401,
    UNSIGNED_SHORT_4_4_4_4 = 0x8033,
    UNSIGNED_SHORT_5_5_5_1 = 0x8034,
    UNSIGNED_SHORT_5_6_5 = 0x8363,
}

/**
 * WebGL Texture Magnification Filter
 */
export const enum TextureMagFilter {
    NEAREST = 0x2600,
    LINEAR = 0x2601,
}

/**
 * WebGL Texture Minification Filter
 */
export const enum TextureMinFilter {
    NEAREST = 0x2600,
    LINEAR = 0x2601,
    NEAREST_MIPMAP_NEAREST = 0x2700,
    LINEAR_MIPMAP_NEAREST = 0x2701,
    NEAREST_MIPMAP_LINEAR = 0x2702,
    LINEAR_MIPMAP_LINEAR = 0x2703,
}

/**
 * WebGL Texture Wrap Modes
 */
export const enum TextureWrapMode {
    REPEAT = 0x2901,
    CLAMP_TO_EDGE = 0x812f,
    MIRRORED_REPEAT = 0x8370,
}

/**
 * Raw texture data and descriptor sufficient for WebGL texture upload
 */
export interface TextureData {
    /**
     * Width of image
     */
    width: number;
    /**
     * Height of image
     */
    height: number;
    /**
     * Format of pixels in data
     */
    format: PixelFormat;
    /**
     * Row byte alignment of pixels in data
     */
    alignment: number;
    /**
     * Pixel data
     */
    data: ArrayBufferView;
}

/**
 * Wraps sampling parameters for a WebGL texture
 */
export interface SamplingParameters {
    /**
     * Magnification mode when upsampling from a WebGL texture
     */
    magFilter?: TextureMagFilter;
    /**
     * Minification mode when upsampling from a WebGL texture
     */
    minFilter?: TextureMinFilter;
    /**
     * X axis wrapping mode when sampling out of a WebGL texture bounds
     */
    wrapS?: TextureWrapMode;
    /**
     * Y axis wrapping mode when sampling out of a WebGL texture bounds
     */
    wrapT?: TextureWrapMode;
    /**
    * Anisotropic filtering samples
    */
    maxAnisotropy?: number;
}

/**
 * Represents a valid WebGL texture source for use in texImage2D
 */
export type TextureSource = TextureData | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;

/**
 * A generic set of texture mipmaps (where index 0 has the largest dimension)
 */
export type Mipmaps<T> = Array<T>;

/**
 * A set of 6 cubemap arranged in the order [+x, -x, +y, -y, +z, -z]
 */
export type Faces<T> = Array<T>;

/**
 * A set of texture mipmaps specifically for 2D textures in WebGL (where index 0 has the largest dimension)
 */
export type Mipmaps2D = Mipmaps<TextureSource>;

/**
 * A set of texture mipmaps specifically for cubemap textures in WebGL (where index 0 has the largest dimension)
 */
export type MipmapsCube = Mipmaps<Faces<TextureSource>>;

/**
 * A minimal WebGL cubemap descriptor
 */
export class TextureCube {

    /**
     * Returns the width of a face of the texture or 0 if not available
     */
    public get Width(): number {
        return (this.source && this.source[0] && this.source[0][0]) ? this.source[0][0].width : 0;
    }

    /**
     * Returns the height of a face of the texture or 0 if not available
     */
    public get Height(): number {
        return (this.source && this.source[0] && this.source[0][0]) ? this.source[0][0].height : 0;
    }

    /**
     * constructor
     * @param internalFormat WebGL pixel format for the texture on the GPU
     * @param type WebGL pixel type of the supplied data and texture on the GPU
     * @param source An array containing mipmap levels of faces, where each mipmap level is an array of faces and each face is a TextureSource object
     */
    constructor(public internalFormat: PixelFormat, public type: PixelType, public source: MipmapsCube = []) { }
}

/**
     * A static class providing methods to aid working with Bablyon textures.
     */
export class TextureUtils {

    /**
     * A prefix used when storing a babylon texture object reference on a Spectre texture object
     */
    public static BabylonTextureKeyPrefix = '__babylonTexture_';

    /**
     * Controls anisotropic filtering for deserialized textures.
     */
    public static MaxAnisotropy = 4;

    /**
     * Returns a BabylonCubeTexture instance from a Spectre texture cube, subject to sampling parameters.
     * If such a texture has already been requested in the past, this texture will be returned, otherwise a new one will be created.
     * The advantage of this is to enable working with texture objects without the need to initialize on the GPU until desired.
     * @param scene A Babylon Scene instance
     * @param textureCube A Spectre TextureCube object
     * @param parameters WebGL texture sampling parameters
     * @param automaticMipmaps Pass true to enable automatic mipmap generation where possible (requires power of images)
     * @param environment Specifies that the texture will be used as an environment
     * @param singleLod Specifies that the texture will be a singleLod (for environment)
     * @return Babylon cube texture
     */
    public static GetBabylonCubeTexture(scene: Scene, textureCube: TextureCube, automaticMipmaps: boolean, environment = false, singleLod = false): CubeTexture {
        if (!textureCube) { throw new Error("no texture cube provided"); }

        var parameters: SamplingParameters;
        if (environment) {
            parameters = singleLod ? TextureUtils._EnvironmentSingleMipSampling : TextureUtils._EnvironmentSampling;
        }
        else {
            parameters = {
                magFilter: TextureMagFilter.NEAREST,
                minFilter: TextureMinFilter.NEAREST,
                wrapS: TextureWrapMode.CLAMP_TO_EDGE,
                wrapT: TextureWrapMode.CLAMP_TO_EDGE
            };
        }

        let key = TextureUtils.BabylonTextureKeyPrefix + parameters.magFilter + '' + parameters.minFilter + '' + parameters.wrapS + '' + parameters.wrapT;

        let babylonTexture: CubeTexture = (<any>textureCube)[key];

        if (!babylonTexture) {

            //initialize babylon texture
            babylonTexture = new CubeTexture('', scene);
            if (environment) {
                babylonTexture.lodGenerationOffset = TextureUtils.EnvironmentLODOffset;
                babylonTexture.lodGenerationScale = TextureUtils.EnvironmentLODScale;
            }

            babylonTexture.gammaSpace = false;

            let internalTexture = new InternalTexture(scene.getEngine(), InternalTextureSource.CubeRaw);
            let glTexture = internalTexture._webGLTexture;
            //babylon properties
            internalTexture.isCube = true;
            internalTexture.generateMipMaps = false;

            babylonTexture._texture = internalTexture;

            TextureUtils.ApplySamplingParameters(babylonTexture, parameters);

            let maxMipLevel = automaticMipmaps ? 0 : textureCube.source.length - 1;
            let texturesUploaded = 0;

            var textureComplete = function() {
                return texturesUploaded === ((maxMipLevel + 1) * 6);
            };

            var uploadFace = function(i: number, level: number, face: TextureSource) {
                if (!glTexture) { return; }

                if (i === 0 && level === 0) {
                    internalTexture.width = face.width;
                    internalTexture.height = face.height;
                }

                let gl = (<any>(scene.getEngine()))._gl;
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, glTexture);
                scene.getEngine()._unpackFlipY(false);
                if (face instanceof HTMLElement || face instanceof ImageData) {
                    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, level, textureCube.internalFormat, textureCube.internalFormat, textureCube.type, <any>face);
                } else {
                    let textureData = <TextureData>face;
                    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, level, textureCube.internalFormat, textureData.width, textureData.height, 0, textureData.format, textureCube.type, textureData.data);
                }

                texturesUploaded++;

                if (textureComplete()) {
                    //generate mipmaps
                    if (automaticMipmaps) {
                        let w = face.width;
                        let h = face.height;
                        let isPot = (((w !== 0) && (w & (w - 1))) === 0) && (((h !== 0) && (h & (h - 1))) === 0);
                        if (isPot) {
                            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                        }
                    }

                    // Upload Separate lods in case there is no support for texture lod.
                    if (environment && !scene.getEngine().getCaps().textureLOD && !singleLod) {
                        const mipSlices = 3;
                        for (let i = 0; i < mipSlices; i++) {
                            let lodKey = TextureUtils.BabylonTextureKeyPrefix + 'lod' + i;
                            let lod: CubeTexture = (<any>textureCube)[lodKey];

                            //initialize lod texture if it doesn't already exist
                            if (lod == null && textureCube.Width) {
                                //compute LOD from even spacing in smoothness (matching shader calculation)
                                let smoothness = i / (mipSlices - 1);
                                let roughness = 1 - smoothness;
                                const kMinimumVariance = 0.0005;
                                let alphaG = roughness * roughness + kMinimumVariance;
                                let microsurfaceAverageSlopeTexels = alphaG * textureCube.Width;

                                let environmentSpecularLOD = TextureUtils.EnvironmentLODScale * (Scalar.Log2(microsurfaceAverageSlopeTexels)) + TextureUtils.EnvironmentLODOffset;

                                let maxLODIndex = textureCube.source.length - 1;
                                let mipmapIndex = Math.min(Math.max(Math.round(environmentSpecularLOD), 0), maxLODIndex);

                                lod = TextureUtils.GetBabylonCubeTexture(scene, new TextureCube(PixelFormat.RGBA, PixelType.UNSIGNED_BYTE, [textureCube.source[mipmapIndex]]), false, true, true);

                                if (i === 0) {
                                    internalTexture._lodTextureLow = lod;
                                }
                                else if (i === 1) {
                                    internalTexture._lodTextureMid = lod;
                                }
                                else {
                                    internalTexture._lodTextureHigh = lod;
                                }

                                (<any>textureCube)[lodKey] = lod;
                            }
                        }
                    }

                    internalTexture.isReady = true;
                }

                gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
                scene.getEngine().resetTextureCache();
            };

            for (let i = 0; i <= maxMipLevel; i++) {
                let faces = textureCube.source[i];
                for (let j = 0; j < faces.length; j++) {
                    let face = faces[j];
                    if (face instanceof HTMLImageElement && !face.complete) {
                        face.addEventListener('load', () => {
                            uploadFace(j, i, face);
                        }, false);
                    } else {
                        uploadFace(j, i, face);
                    }
                }
            }

            scene.getEngine().resetTextureCache();

            babylonTexture.isReady = () => {
                return textureComplete();
            };

            (<any>textureCube)[key] = babylonTexture;
        }

        return babylonTexture;
    }

    /**
     * Applies Spectre SamplingParameters to a Babylon texture by directly setting texture parameters on the internal WebGLTexture as well as setting Babylon fields
     * @param babylonTexture Babylon texture to apply texture to (requires the Babylon texture has an initialize _texture field)
     * @param parameters Spectre SamplingParameters to apply
     */
    public static ApplySamplingParameters(babylonTexture: BaseTexture, parameters: SamplingParameters) {
        let scene = babylonTexture.getScene();
        if (!scene) { return; }
        let gl = (<any>(scene.getEngine()))._gl;

        let target = babylonTexture.isCube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;

        let internalTexture = babylonTexture._texture;
        if (!internalTexture) { return; }
        let glTexture = internalTexture._webGLTexture;
        gl.bindTexture(target, glTexture);

        if (parameters.magFilter != null) { gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, parameters.magFilter); }
        if (parameters.minFilter != null) { gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, parameters.minFilter); }
        if (parameters.wrapS != null) { gl.texParameteri(target, gl.TEXTURE_WRAP_S, parameters.wrapS); }
        if (parameters.wrapT != null) { gl.texParameteri(target, gl.TEXTURE_WRAP_T, parameters.wrapT); }

        //set babylon wrap modes from sampling parameter
        switch (parameters.wrapS) {
            case TextureWrapMode.REPEAT: babylonTexture.wrapU = Texture.WRAP_ADDRESSMODE; break;
            case TextureWrapMode.CLAMP_TO_EDGE: babylonTexture.wrapU = Texture.CLAMP_ADDRESSMODE; break;
            case TextureWrapMode.MIRRORED_REPEAT: babylonTexture.wrapU = Texture.MIRROR_ADDRESSMODE; break;
            default: babylonTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
        }

        switch (parameters.wrapT) {
            case TextureWrapMode.REPEAT: babylonTexture.wrapV = Texture.WRAP_ADDRESSMODE; break;
            case TextureWrapMode.CLAMP_TO_EDGE: babylonTexture.wrapV = Texture.CLAMP_ADDRESSMODE; break;
            case TextureWrapMode.MIRRORED_REPEAT: babylonTexture.wrapV = Texture.MIRROR_ADDRESSMODE; break;
            default: babylonTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
        }

        if (parameters.maxAnisotropy != null && parameters.maxAnisotropy > 1) {
            let anisotropicExt = gl.getExtension('EXT_texture_filter_anisotropic');
            if (anisotropicExt) {
                let maxAnisotropicSamples = gl.getParameter(anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
                let maxAnisotropy = Math.min(parameters.maxAnisotropy, maxAnisotropicSamples);
                gl.texParameterf(target, anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT, maxAnisotropy);
                babylonTexture.anisotropicFilteringLevel = maxAnisotropy;
            }
        }

        gl.bindTexture(target, null);
        scene.getEngine().resetTextureCache();
    }

    private static _EnvironmentSampling: SamplingParameters = {
        magFilter: TextureMagFilter.LINEAR,
        minFilter: TextureMinFilter.LINEAR_MIPMAP_LINEAR,
        wrapS: TextureWrapMode.CLAMP_TO_EDGE,
        wrapT: TextureWrapMode.CLAMP_TO_EDGE,
        maxAnisotropy: 1
    };

    private static _EnvironmentSingleMipSampling: SamplingParameters = {
        magFilter: TextureMagFilter.LINEAR,
        minFilter: TextureMinFilter.LINEAR,
        wrapS: TextureWrapMode.CLAMP_TO_EDGE,
        wrapT: TextureWrapMode.CLAMP_TO_EDGE,
        maxAnisotropy: 1
    };

    //from "/Internal/Lighting.EnvironmentFilterScale" in Engine/*/Configuration.cpp
    /**
     * Environment preprocessing dedicated value (Internal Use or Advanced only).
     */
    public static EnvironmentLODScale = 0.8;
    /**
     * Environment preprocessing dedicated value (Internal Use or Advanced only)..
     */
    public static EnvironmentLODOffset = 1.0;
}