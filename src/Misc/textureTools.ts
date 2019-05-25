import { InternalTexture } from "../Materials/Textures/internalTexture";
import { Texture } from "../Materials/Textures/texture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { PassPostProcess } from "../PostProcesses/passPostProcess";
import { Constants } from "../Engines/constants";
import { Scene } from "../scene";

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
}
