import { InternalTexture } from "../Materials/Textures/internalTexture";
import { Texture } from "../Materials/Textures/texture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { PassPostProcess } from "../PostProcesses/passPostProcess";
import { Constants } from "../Engines/constants";
import { Scene } from "../scene";
import { Nullable } from "../types";

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
     * Reads the pixels stored in the webgl texture and returns them as a base64 string
     * @param texture defines the texture to read pixels from
     * @param faceIndex defines the face of the texture to read (in case of cube texture)
     * @param level defines the LOD level of the texture to read (in case of Mip Maps)
     * @returns The base64 encoded string or null
     */
    public static GenerateBase64StringFromTexture(texture: Texture, faceIndex = 0, level = 0): Nullable<string> {

        var internalTexture = texture.getInternalTexture();
        if (!internalTexture || internalTexture.isCube) {
            return null;
        }

        var pixels = texture.readPixels(faceIndex, level);
        if (!pixels) {
            return null;
        }

        var size = texture.getSize();
        var width = size.width;
        var height = size.height;

        if (pixels instanceof Float32Array) {
            var len = pixels.byteLength / pixels.BYTES_PER_ELEMENT;
            var npixels = new Uint8Array(len);

            while (--len >= 0) {
                var val = pixels[len];
                if (val < 0) {
                    val = 0;
                } else if (val > 1) {
                    val = 1;
                }
                npixels[len] = val * 255;
            }

            pixels = npixels;
        }

        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        var ctx = canvas.getContext('2d');
        if (!ctx) {
            return null;
        }

        var imageData = ctx.createImageData(width, height);
        imageData.data.set(pixels);
        ctx.putImageData(imageData, 0, 0);

        if (internalTexture.invertY) {
            var canvas2 = document.createElement('canvas');
            canvas2.width = width;
            canvas2.height = height;

            var ctx2 = canvas2.getContext('2d');
            if (!ctx2) {
                return null;
            }

            ctx2.translate(0, height);
            ctx2.scale(1, -1);
            ctx2.drawImage(canvas, 0, 0);

            return canvas2.toDataURL('image/png');
        }

        return canvas.toDataURL('image/png');
    }
}
