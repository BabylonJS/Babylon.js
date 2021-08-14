import { InternalTexture } from "../Materials/Textures/internalTexture";
import { Texture } from "../Materials/Textures/texture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { PassPostProcess } from "../PostProcesses/passPostProcess";
import { Constants } from "../Engines/constants";
import { Scene } from "../scene";
import { PostProcess } from '../PostProcesses/postProcess';
import { Engine } from '../Engines/engine';

/**
 * Class used to host texture specific utilities
 */
export class TextureTools {
    /**
     * Uses the GPU to create a copy texture rescaled at a given size
     * @param texture Texture to copy from
     * @param width defines the desired width
     * @param height defines the desired height
     * @param useBilinearMode defines if bilinear mode has to be used
     * @return the generated texture
     */
    public static CreateResizedCopy(texture: Texture, width: number, height: number, useBilinearMode: boolean = true): Texture {

        var scene = <Scene>texture.getScene();
        var engine = scene.getEngine();

        let rtt = new RenderTargetTexture(
            'resized' + texture.name,
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

        let passPostProcess = new PassPostProcess("pass", 1, null, useBilinearMode ? Texture.BILINEAR_SAMPLINGMODE : Texture.NEAREST_SAMPLINGMODE, engine, false, Constants.TEXTURETYPE_UNSIGNED_INT);
        passPostProcess.getEffect().executeWhenCompiled(() => {
            passPostProcess.onApply = function (effect) {
                effect.setTexture("textureSampler", texture);
            };

            let rtWrapper = rtt.rtWrapper;

            if (rtWrapper) {
                scene.postProcessManager.directRender([passPostProcess], rtWrapper);

                engine.unBindFramebuffer(rtWrapper);
                rtt.disposeFramebufferObjects();
                passPostProcess.dispose();

                rtt.getInternalTexture()!.isReady = true;
            }
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
     * @return a promise with the internalTexture having its texture replaced by the result of the processing
     */
    public static ApplyPostProcess(postProcessName: string, internalTexture: InternalTexture, scene: Scene, type?: number, samplingMode?: number, format?: number): Promise<InternalTexture> {
        // Gets everything ready.
        const engine = internalTexture.getEngine() as Engine;

        internalTexture.isReady = false;

        samplingMode = samplingMode ?? internalTexture.samplingMode;
        type = type ?? internalTexture.type;
        format = format ?? internalTexture.format;

        if (type === -1) {
            type = Constants.TEXTURETYPE_UNSIGNED_BYTE;
        }

        return new Promise((resolve) => {
            // Create the post process
            const postProcess = new PostProcess("postprocess", postProcessName, null, null, 1, null, samplingMode, engine,
                false, undefined, type, undefined, null, false, format);

            // Hold the output of the decoding.
            const encodedTexture = engine.createRenderTargetTexture({ width: internalTexture.width, height: internalTexture.height }, {
                generateDepthBuffer: false,
                generateMipMaps: false,
                generateStencilBuffer: false,
                samplingMode,
                type,
                format
            });

            postProcess.getEffect().executeWhenCompiled(() => {
                // PP Render Pass
                postProcess.onApply = (effect) => {
                    effect._bindTexture("textureSampler", internalTexture);
                    effect.setFloat2("scale", 1, 1);
                };
                scene.postProcessManager.directRender([postProcess!], encodedTexture, true);

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
    }

    // ref: http://stackoverflow.com/questions/32633585/how-do-you-convert-to-half-floats-in-javascript
    private static _FloatView: Float32Array;
    private static _Int32View: Int32Array;
    /**
     * Converts a number to half float
     * @param value number to convert
     * @returns converted number
     */
    public static ToHalfFloat(value: number): number {
        if (!TextureTools._FloatView) {
            TextureTools._FloatView = new Float32Array(1);
            TextureTools._Int32View = new Int32Array(TextureTools._FloatView.buffer);
        }

        TextureTools._FloatView[0] = value;
        const x = TextureTools._Int32View[0];

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
            bits |= ((e == 255) ? 0 : 1) && (x & 0x007fffff);
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
    public static FromHalfFloat(value: number): number {
        const s = (value & 0x8000) >> 15;
        const e = (value & 0x7C00) >> 10;
        const f = value & 0x03FF;

        if (e === 0) {
            return (s ? -1 : 1) * Math.pow(2, -14) * (f / Math.pow(2, 10));
        } else if (e == 0x1F) {
            return f ? NaN : ((s ? -1 : 1) * Infinity);
        }

        return (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + (f / Math.pow(2, 10)));
    }
}
