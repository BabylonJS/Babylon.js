import { Constants } from "../Engines/constants";
import { PostProcess } from "../PostProcesses/postProcess";
import "../Shaders/rgbdDecode.fragment";
import { Engine } from '../Engines/engine';

import "../Engines/Extensions/engine.renderTarget";
import { TextureTools } from './textureTools';

declare type Texture = import("../Materials/Textures/texture").Texture;
declare type InternalTexture = import("../Materials/Textures/internalTexture").InternalTexture;
declare type Scene = import("../scene").Scene;

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

        // Gets everything ready.
        const engine = internalTexture.getEngine() as Engine;
        const caps = engine.getCaps();
        const isReady = internalTexture.isReady;
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

        if (expandTexture) {
            // Do not use during decode.
            internalTexture.isReady = false;
            internalTexture._isRGBD = false;
            internalTexture.invertY = false;
        }

        const expandRGBDTexture = () => {
            // Expand the texture if possible
            if (expandTexture) {
                // Simply run through the decode PP.
                const rgbdPostProcess = new PostProcess("rgbdDecode", "rgbdDecode", null, null, 1, null, Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, engine, false, undefined, internalTexture.type, undefined, null, false);

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
                    texture.getScene()!.postProcessManager.directRender([rgbdPostProcess!], expandedTexture, true);

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
        };

        if (isReady) {
            expandRGBDTexture();
        } else {
            texture.onLoadObservable.addOnce(expandRGBDTexture);
        }
    }

    /**
     * Encode the texture to RGBD if possible.
     * @param internalTexture the texture to encode
     * @param scene the scene hosting the texture
     * @param outputTextureType type of the texture in which the encoding is performed
     * @return a promise with the internalTexture having its texture replaced by the result of the processing
     */
    public static EncodeTextureToRGBD(internalTexture: InternalTexture, scene: Scene, outputTextureType = Constants.TEXTURETYPE_UNSIGNED_BYTE): Promise<InternalTexture> {
        return TextureTools.ApplyPostProcess("rgbdEncode", internalTexture, scene, outputTextureType, Constants.TEXTURE_NEAREST_SAMPLINGMODE, Constants.TEXTUREFORMAT_RGBA);
    }
}
