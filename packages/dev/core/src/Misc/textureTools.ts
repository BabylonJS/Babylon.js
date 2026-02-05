/* eslint-disable @typescript-eslint/naming-convention */
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { InternalTexture } from "../Materials/Textures/internalTexture";
import { Texture } from "../Materials/Textures/texture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { PassPostProcess } from "../PostProcesses/passPostProcess";
import { Constants } from "../Engines/constants";
import type { Scene } from "../scene";
import { PostProcess } from "../PostProcesses/postProcess";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import type { Observable } from "./observable";
import type { Nullable } from "../types";
import { Clamp } from "../Maths/math.scalar.functions";

/**
 * Uses the GPU to create a copy texture rescaled at a given size
 * @param texture Texture to copy from
 * @param width defines the desired width
 * @param height defines the desired height
 * @param useBilinearMode defines if bilinear mode has to be used
 * @returns the generated texture
 */
export function CreateResizedCopy(texture: Texture, width: number, height: number, useBilinearMode: boolean = true): Texture {
    const scene = <Scene>texture.getScene();
    const engine = scene.getEngine();

    const rtt = new RenderTargetTexture(
        "resized" + texture.name,
        { width: width, height: height },
        scene,
        !texture.noMipmap,
        true,
        (<InternalTexture>texture._texture).type,
        false,
        texture.samplingMode,
        false
    );

    rtt.wrapU = texture.wrapU;
    rtt.wrapV = texture.wrapV;
    rtt.uOffset = texture.uOffset;
    rtt.vOffset = texture.vOffset;
    rtt.uScale = texture.uScale;
    rtt.vScale = texture.vScale;
    rtt.uAng = texture.uAng;
    rtt.vAng = texture.vAng;
    rtt.wAng = texture.wAng;
    rtt.coordinatesIndex = texture.coordinatesIndex;
    rtt.level = texture.level;
    rtt.anisotropicFilteringLevel = texture.anisotropicFilteringLevel;
    (<InternalTexture>rtt._texture).isReady = false;

    texture.wrapU = Texture.CLAMP_ADDRESSMODE;
    texture.wrapV = Texture.CLAMP_ADDRESSMODE;

    const passPostProcess = new PassPostProcess(
        "pass",
        1,
        null,
        useBilinearMode ? Texture.BILINEAR_SAMPLINGMODE : Texture.NEAREST_SAMPLINGMODE,
        engine,
        false,
        Constants.TEXTURETYPE_UNSIGNED_BYTE
    );
    passPostProcess.externalTextureSamplerBinding = true;
    passPostProcess.onEffectCreatedObservable.addOnce((e) => {
        e.executeWhenCompiled(() => {
            passPostProcess.onApply = function (effect) {
                effect.setTexture("textureSampler", texture);
            };

            const internalTexture = rtt.renderTarget;

            if (internalTexture) {
                scene.postProcessManager.directRender([passPostProcess], internalTexture);

                engine.unBindFramebuffer(internalTexture);
                rtt.disposeFramebufferObjects();
                passPostProcess.dispose();

                rtt.getInternalTexture()!.isReady = true;
            }
        });
    });

    return rtt;
}

/**
 * Apply a post process to a texture
 * @param postProcessName name of the fragment post process
 * @param internalTexture the texture to encode
 * @param scene the scene hosting the texture
 * @param type type of the output texture. If not provided, use the one from internalTexture
 * @param samplingMode sampling mode to use to sample the source texture. If not provided, use the one from internalTexture
 * @param format format of the output texture. If not provided, use the one from internalTexture
 * @param width width of the output texture. If not provided, use the one from internalTexture
 * @param height height of the output texture. If not provided, use the one from internalTexture
 * @returns a promise with the internalTexture having its texture replaced by the result of the processing
 */
// eslint-disable-next-line @typescript-eslint/promise-function-async
export function ApplyPostProcess(
    postProcessName: string,
    internalTexture: InternalTexture,
    scene: Scene,
    type?: number,
    samplingMode?: number,
    format?: number,
    width?: number,
    height?: number
): Promise<InternalTexture> {
    // Gets everything ready.
    const engine = internalTexture.getEngine();

    internalTexture.isReady = false;

    samplingMode = samplingMode ?? internalTexture.samplingMode;
    type = type ?? internalTexture.type;
    format = format ?? internalTexture.format;
    width = width ?? internalTexture.width;
    height = height ?? internalTexture.height;

    if (type === -1) {
        type = Constants.TEXTURETYPE_UNSIGNED_BYTE;
    }

    return new Promise((resolve) => {
        // Create the post process
        const postProcess = new PostProcess("postprocess", postProcessName, null, null, 1, null, samplingMode, engine, false, undefined, type, undefined, null, false, format);
        postProcess.externalTextureSamplerBinding = true;

        // Hold the output of the decoding.
        const encodedTexture = engine.createRenderTargetTexture(
            { width: width, height: height },
            {
                generateDepthBuffer: false,
                generateMipMaps: false,
                generateStencilBuffer: false,
                samplingMode,
                type,
                format,
            }
        );

        postProcess.onEffectCreatedObservable.addOnce((e) => {
            e.executeWhenCompiled(() => {
                // PP Render Pass
                postProcess.onApply = (effect) => {
                    effect._bindTexture("textureSampler", internalTexture);
                    effect.setFloat2("scale", 1, 1);
                };
                scene.postProcessManager.directRender([postProcess], encodedTexture, true);

                // Cleanup
                engine.restoreDefaultFramebuffer();
                engine._releaseTexture(internalTexture);
                if (postProcess) {
                    postProcess.dispose();
                }

                // Internal Swap
                encodedTexture._swapAndDie(internalTexture);

                // Ready to get rolling again.
                internalTexture.type = type!;
                internalTexture.format = Constants.TEXTUREFORMAT_RGBA;
                internalTexture.isReady = true;

                resolve(internalTexture);
            });
        });
    });
}

// ref: http://stackoverflow.com/questions/32633585/how-do-you-convert-to-half-floats-in-javascript
let floatView: Float32Array;
let int32View: Int32Array;
/**
 * Converts a number to half float
 * @param value number to convert
 * @returns converted number
 */
export function ToHalfFloat(value: number): number {
    if (!floatView) {
        floatView = new Float32Array(1);
        int32View = new Int32Array(floatView.buffer);
    }

    floatView[0] = value;
    const x = int32View[0];

    let bits = (x >> 16) & 0x8000; /* Get the sign */
    let m = (x >> 12) & 0x07ff; /* Keep one extra bit for rounding */
    const e = (x >> 23) & 0xff; /* Using int is faster here */

    /* If zero, or denormal, or exponent underflows too much for a denormal
     * half, return signed zero. */
    if (e < 103) {
        return bits;
    }

    /* If NaN, return NaN. If Inf or exponent overflow, return Inf. */
    if (e > 142) {
        bits |= 0x7c00;
        /* If exponent was 0xff and one mantissa bit was set, it means NaN,
         * not Inf, so make sure we set one mantissa bit too. */
        bits |= (e == 255 ? 0 : 1) && x & 0x007fffff;
        return bits;
    }

    /* If exponent underflows but not too much, return a denormal */
    if (e < 113) {
        m |= 0x0800;
        /* Extra rounding may overflow and set mantissa to 0 and exponent
         * to 1, which is OK. */
        bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1);
        return bits;
    }

    bits |= ((e - 112) << 10) | (m >> 1);
    bits += m & 1;
    return bits;
}

/**
 * Converts a half float to a number
 * @param value half float to convert
 * @returns converted half float
 */
export function FromHalfFloat(value: number): number {
    const s = (value & 0x8000) >> 15;
    const e = (value & 0x7c00) >> 10;
    const f = value & 0x03ff;

    if (e === 0) {
        return (s ? -1 : 1) * Math.pow(2, -14) * (f / Math.pow(2, 10));
    } else if (e == 0x1f) {
        return f ? NaN : (s ? -1 : 1) * Infinity;
    }

    return (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + f / Math.pow(2, 10));
}

function IsCompressedTextureFormat(format: number): boolean {
    switch (format) {
        case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_BPTC_UNORM:
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB_ALPHA_BPTC_UNORM:
        case Constants.TEXTUREFORMAT_COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT:
        case Constants.TEXTUREFORMAT_COMPRESSED_RGB_BPTC_SIGNED_FLOAT:
        case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5:
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT:
        case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT3:
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT:
        case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT1:
        case Constants.TEXTUREFORMAT_COMPRESSED_RGB_S3TC_DXT1:
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT:
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB_S3TC_DXT1_EXT:
        case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_4x4:
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:
        case Constants.TEXTUREFORMAT_COMPRESSED_RGB_ETC1_WEBGL:
        case Constants.TEXTUREFORMAT_COMPRESSED_RGB8_ETC2:
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ETC2:
        case Constants.TEXTUREFORMAT_COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2:
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2:
        case Constants.TEXTUREFORMAT_COMPRESSED_RGBA8_ETC2_EAC:
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:
            return true;
        default:
            return false;
    }
}

/**
 * Waits for when the given texture is ready to be used (downloaded, converted, mip mapped...)
 * @param texture the texture to wait for
 * @returns a promise that resolves when the texture is ready
 */
export async function WhenTextureReadyAsync(texture: BaseTexture): Promise<void> {
    if (texture.isReady()) {
        return;
    }

    if (texture.loadingError) {
        throw new Error(texture.errorObject?.message || `Texture ${texture.name} errored while loading.`);
    }

    const onLoadObservable = (texture as any).onLoadObservable as Observable<BaseTexture>;
    if (onLoadObservable) {
        return await new Promise((res) => onLoadObservable.addOnce(() => res()));
    }

    const onLoadedObservable = texture._texture?.onLoadedObservable;
    if (onLoadedObservable) {
        return await new Promise((res) => onLoadedObservable.addOnce(() => res()));
    }

    throw new Error(`Cannot determine readiness of texture ${texture.name}.`);
}

/**
 * Gets the data of the specified texture by rendering it to an intermediate RGBA texture and retrieving the bytes from it.
 * This is convienent to get 8-bit RGBA values for a texture in a GPU compressed format, which cannot be read using readPixels.
 * @internal
 */
async function ReadPixelsUsingRTT(texture: BaseTexture, width: number, height: number, face: number, lod: number): Promise<Uint8Array> {
    const scene = texture.getScene()!;
    const engine = scene.getEngine();

    if (!engine.isWebGPU) {
        if (texture.isCube) {
            await import("../Shaders/lodCube.fragment");
        } else {
            await import("../Shaders/lod.fragment");
        }
    } else {
        if (texture.isCube) {
            await import("../ShadersWGSL/lodCube.fragment");
        } else {
            await import("../ShadersWGSL/lod.fragment");
        }
    }

    let lodPostProcess: PostProcess;

    if (!texture.isCube) {
        lodPostProcess = new PostProcess("lod", "lod", {
            uniforms: ["lod", "gamma"],
            samplingMode: Texture.NEAREST_NEAREST_MIPNEAREST,
            engine,
            shaderLanguage: engine.isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
        });
    } else {
        const faceDefines = ["#define POSITIVEX", "#define NEGATIVEX", "#define POSITIVEY", "#define NEGATIVEY", "#define POSITIVEZ", "#define NEGATIVEZ"];
        lodPostProcess = new PostProcess("lodCube", "lodCube", {
            uniforms: ["lod", "gamma"],
            samplingMode: Texture.NEAREST_NEAREST_MIPNEAREST,
            engine,
            defines: faceDefines[face],
            shaderLanguage: engine.isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
        });
    }

    await new Promise((resolve) => {
        lodPostProcess.onEffectCreatedObservable.addOnce((e) => {
            e.executeWhenCompiled(() => {
                resolve(0);
            });
        });
    });

    const rtt = new RenderTargetTexture("temp", { width: width, height: height }, scene, false);

    lodPostProcess.onApply = function (effect) {
        effect.setTexture("textureSampler", texture);
        effect.setFloat("lod", lod);
        effect.setInt("gamma", texture.gammaSpace ? 1 : 0);
    };

    const internalTexture = texture.getInternalTexture();

    try {
        if (rtt.renderTarget && internalTexture) {
            const samplingMode = internalTexture.samplingMode;
            if (lod !== 0) {
                texture.updateSamplingMode(Texture.NEAREST_NEAREST_MIPNEAREST);
            } else {
                texture.updateSamplingMode(Texture.NEAREST_NEAREST);
            }

            scene.postProcessManager.directRender([lodPostProcess], rtt.renderTarget, true);
            texture.updateSamplingMode(samplingMode);

            //Reading datas from WebGL
            const bufferView = await engine.readPixels(0, 0, width, height);
            const data = new Uint8Array(bufferView.buffer, 0, bufferView.byteLength);

            // Unbind
            engine.unBindFramebuffer(rtt.renderTarget);

            return data;
        } else {
            throw Error("Render to texture failed.");
        }
    } finally {
        rtt.dispose();
        lodPostProcess.dispose();
    }
}

/**
 * Gets the pixel data of the specified texture, either by reading it directly
 * or by rendering it to an intermediate RGBA texture and retrieving the bytes from it.
 * This is convenient to get 8-bit RGBA values for a texture in a GPU compressed format.
 * @param texture the source texture
 * @param width the target width of the result, which does not have to match the source texture width
 * @param height the target height of the result, which does not have to match the source texture height
 * @param face if the texture has multiple faces, the face index to use for the source
 * @param lod if the texture has multiple LODs, the lod index to use for the source
 * @param forceRTT if true, forces the use of the RTT path for reading pixels (useful for cube maps to ensure correct orientation and gamma)
 * @returns the 8-bit texture data
 */
export async function GetTextureDataAsync(
    texture: BaseTexture,
    width?: number,
    height?: number,
    face: number = 0,
    lod: number = 0,
    forceRTT: boolean = false
): Promise<Uint8Array> {
    await WhenTextureReadyAsync(texture);

    const { width: textureWidth, height: textureHeight } = texture.getSize();
    const targetWidth = width ?? textureWidth;
    const targetHeight = height ?? textureHeight;

    // If the internal texture format is compressed, we cannot read the pixels directly.
    // If we're resizing the texture, we need to use a render target texture.
    // forceRTT can be used to ensure correct orientation and gamma for cube maps.
    if (forceRTT || IsCompressedTextureFormat(texture.textureFormat) || targetWidth !== textureWidth || targetHeight !== textureHeight) {
        return await ReadPixelsUsingRTT(texture, targetWidth, targetHeight, face, lod);
    }

    let data = (await texture.readPixels(face, lod)) as Nullable<Uint8Array | Float32Array>;
    if (!data) {
        throw new Error(`Failed to read pixels from texture ${texture.name}.`);
    }

    // Convert float RGBA values to uint8, if necessary.
    if (data instanceof Float32Array) {
        const data2 = new Uint8Array(data.length);
        let n = data.length;
        while (n--) {
            const v = data[n];
            data2[n] = Math.round(Clamp(v) * 255);
        }
        data = data2;
    }

    return data;
}

/**
 * Class used to host texture specific utilities
 */
export const TextureTools = {
    /**
     * Uses the GPU to create a copy texture rescaled at a given size
     * @param texture Texture to copy from
     * @param width defines the desired width
     * @param height defines the desired height
     * @param useBilinearMode defines if bilinear mode has to be used
     * @returns the generated texture
     */
    CreateResizedCopy,

    /**
     * Apply a post process to a texture
     * @param postProcessName name of the fragment post process
     * @param internalTexture the texture to encode
     * @param scene the scene hosting the texture
     * @param type type of the output texture. If not provided, use the one from internalTexture
     * @param samplingMode sampling mode to use to sample the source texture. If not provided, use the one from internalTexture
     * @param format format of the output texture. If not provided, use the one from internalTexture
     * @returns a promise with the internalTexture having its texture replaced by the result of the processing
     */
    ApplyPostProcess,
    /**
     * Converts a number to half float
     * @param value number to convert
     * @returns converted number
     */
    ToHalfFloat,

    /**
     * Converts a half float to a number
     * @param value half float to convert
     * @returns converted half float
     */
    FromHalfFloat,

    /**
     * Gets the data of the specified texture by rendering it to an intermediate RGBA texture and retrieving the bytes from it.
     * This is convienent to get 8-bit RGBA values for a texture in a GPU compressed format.
     * @param texture the source texture
     * @param width the width of the result, which does not have to match the source texture width
     * @param height the height of the result, which does not have to match the source texture height
     * @param face if the texture has multiple faces, the face index to use for the source
     * @param lod if the texture has multiple LODs, the lod index to use for the source
     * @returns the 8-bit texture data
     */
    GetTextureDataAsync,
};
