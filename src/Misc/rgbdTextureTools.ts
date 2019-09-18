import { Constants } from "../Engines/constants";
import { PostProcess } from "../PostProcesses/postProcess";
import "../Shaders/rgbdDecode.fragment";
import { Engine } from '../Engines/engine';

declare type Texture = import("../Materials/Textures/texture").Texture;

/**
 * Class used to host RGBD texture specific utilities
 */
export class RGBDTextureTools {
    /**
     * Expand the RGBD Texture from RGBD to Half Float if possible.
     * @param texture the texture to expand.
     */
    public static ExpandRGBDTexture(texture: Texture) {
        const internalTexture = texture._texture;
        if (!internalTexture || !texture.isRGBD) {
            return;
        }

        texture.onLoadObservable.addOnce(() => {
            // Gets everything ready.
            let engine = internalTexture.getEngine() as Engine;
            let caps = engine.getCaps();
            let expandTexture = false;

            // If half float available we can uncompress the texture
            if (caps.textureHalfFloatRender && caps.textureHalfFloatLinearFiltering) {
                expandTexture = true;
                internalTexture.type = Constants.TEXTURETYPE_HALF_FLOAT;
            }
            // If full float available we can uncompress the texture
            else if (caps.textureFloatRender && caps.textureFloatLinearFiltering) {
                expandTexture = true;
                internalTexture.type = Constants.TEXTURETYPE_FLOAT;
            }

            // Expand the texture if possible
            if (expandTexture) {
                // Do not use during decode.
                internalTexture.isReady = false;

                // Simply run through the decode PP.
                const rgbdPostProcess = new PostProcess("rgbdDecode", "rgbdDecode", null, null, 1, null, Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, engine, false, undefined, internalTexture.type, undefined, null, false);
                internalTexture._isRGBD = false;
                internalTexture.invertY = false;

                // Hold the output of the decoding.
                const expandedTexture = engine.createRenderTargetTexture(internalTexture.width, {
                    generateDepthBuffer: false,
                    generateMipMaps: false,
                    generateStencilBuffer: false,
                    samplingMode: internalTexture.samplingMode,
                    type: internalTexture.type,
                    format: Constants.TEXTUREFORMAT_RGBA
                });

                rgbdPostProcess.getEffect().executeWhenCompiled(() => {
                    // PP Render Pass
                    rgbdPostProcess.onApply = (effect) => {
                        effect._bindTexture("textureSampler", internalTexture);
                        effect.setFloat2("scale", 1, 1);
                    };
                    engine.scenes[0].postProcessManager.directRender([rgbdPostProcess!], expandedTexture, true);

                    // Cleanup
                    engine.restoreDefaultFramebuffer();
                    engine._releaseTexture(internalTexture);
                    engine._releaseFramebufferObjects(expandedTexture);
                    if (rgbdPostProcess) {
                        rgbdPostProcess.dispose();
                    }

                    // Internal Swap
                    expandedTexture._swapAndDie(internalTexture);

                    // Ready to get rolling again.
                    internalTexture.isReady = true;
                });
            }
        });
    }
}
