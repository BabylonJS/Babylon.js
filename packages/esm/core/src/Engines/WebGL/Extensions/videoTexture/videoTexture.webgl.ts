import type { InternalTexture } from "@babylonjs/core/Materials/Textures/internalTexture.js";
import type { Nullable } from "@babylonjs/core/types.js";
import type { IWebGLEnginePublic, WebGLEngineState } from "../../engine.webgl.js";
import { _bindTextureDirectly, _getInternalFormat, _getRGBABufferInternalSizedFormat, _unpackFlipY } from "../../engine.webgl.js";
import type { IVideoTextureEngineExtension } from "../../../Extensions/videoTexture/videoTexture.base.js";
import { Constants } from "../../../engine.constants.js";
import { _CreateCanvas } from "../../../engine.static.js";

export const updateVideoTexture: IVideoTextureEngineExtension["updateVideoTexture"] = function (
    engineState: IWebGLEnginePublic,
    texture: Nullable<InternalTexture>,
    video: HTMLVideoElement,
    invertY: boolean
): void {
    if (!texture || texture._isDisabled) {
        return;
    }
    const fes = engineState as WebGLEngineState;
    const gl = fes._gl;

    const glformat = _getInternalFormat(engineState, texture.format);
    const internalFormat = _getRGBABufferInternalSizedFormat(engineState, Constants.TEXTURETYPE_UNSIGNED_BYTE, texture.format);

    const wasPreviouslyBound = _bindTextureDirectly(engineState, gl.TEXTURE_2D, texture, true);
    _unpackFlipY(fes, !invertY); // Video are upside down by default

    try {
        // Testing video texture support
        if (fes._videoTextureSupported === undefined) {
            // clear old errors just in case.
            gl.getError();

            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, glformat, gl.UNSIGNED_BYTE, video);

            if (gl.getError() !== 0) {
                fes._videoTextureSupported = false;
            } else {
                fes._videoTextureSupported = true;
            }
        }

        // Copy video through the current working canvas if video texture is not supported
        if (!fes._videoTextureSupported) {
            if (!texture._workingCanvas) {
                texture._workingCanvas = _CreateCanvas(texture.width, texture.height);
                if (!texture._workingCanvas) {
                    throw new Error("Unable to create canvas");
                }
                const context = texture._workingCanvas.getContext("2d");

                if (!context) {
                    throw new Error("Unable to get 2d context");
                }

                texture._workingContext = context;
                texture._workingCanvas.width = texture.width;
                texture._workingCanvas.height = texture.height;
            }

            texture._workingContext!.clearRect(0, 0, texture.width, texture.height);
            texture._workingContext!.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, texture.width, texture.height);

            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, glformat, gl.UNSIGNED_BYTE, texture._workingCanvas as TexImageSource);
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, glformat, gl.UNSIGNED_BYTE, video);
        }

        if (texture.generateMipMaps) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        if (!wasPreviouslyBound) {
            _bindTextureDirectly(fes, gl.TEXTURE_2D, null);
        }
        //    this.resetTextureCache();
        texture.isReady = true;
    } catch (ex) {
        // Something unexpected
        // Let's disable the texture
        texture._isDisabled = true;
    }
};

export const videoTextureExtension: IVideoTextureEngineExtension = {
    updateVideoTexture,
};

export default videoTextureExtension;
