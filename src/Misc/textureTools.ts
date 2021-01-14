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
            passPostProcess.onApply = function(effect) {
                effect.setTexture("textureSampler", texture);
            };

            let internalTexture = rtt.getInternalTexture();

            if (internalTexture) {
                scene.postProcessManager.directRender([passPostProcess], internalTexture);

                engine.unBindFramebuffer(internalTexture);
                rtt.disposeFramebufferObjects();
                passPostProcess.dispose();

                internalTexture.isReady = true;
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
                engine._releaseFramebufferObjects(encodedTexture);
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

}
