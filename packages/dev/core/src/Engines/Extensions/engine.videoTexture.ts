import { ThinEngine } from "../../Engines/thinEngine";
import type { InternalTexture } from "../../Materials/Textures/internalTexture";
import type { Nullable } from "../../types";

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Update a video texture
         * @param texture defines the texture to update
         * @param video defines the video element to use
         * @param invertY defines if data must be stored with Y axis inverted
         */
        updateVideoTexture(texture: Nullable<InternalTexture>, video: HTMLVideoElement, invertY: boolean): void;
    }
}

ThinEngine.prototype.updateVideoTexture = function (texture: Nullable<InternalTexture>, video: HTMLVideoElement, invertY: boolean): void {
    if (!texture || texture._isDisabled) {
        return;
    }

    const wasPreviouslyBound = this._bindTextureDirectly(this._gl.TEXTURE_2D, texture, true);
    this._unpackFlipY(!invertY); // Video are upside down by default

    try {
        // Testing video texture support
        if (this._videoTextureSupported === undefined) {
            // clear old errors just in case.
            this._gl.getError();

            this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, video);

            if (this._gl.getError() !== 0) {
                this._videoTextureSupported = false;
            } else {
                this._videoTextureSupported = true;
            }
        }

        // Copy video through the current working canvas if video texture is not supported
        if (!this._videoTextureSupported) {
            if (!texture._workingCanvas) {
                texture._workingCanvas = this.createCanvas(texture.width, texture.height);
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

            this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, texture._workingCanvas as TexImageSource);
        } else {
            this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, video);
        }

        if (texture.generateMipMaps) {
            this._gl.generateMipmap(this._gl.TEXTURE_2D);
        }

        if (!wasPreviouslyBound) {
            this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
        }
        //    this.resetTextureCache();
        texture.isReady = true;
    } catch (ex) {
        // Something unexpected
        // Let's disable the texture
        texture._isDisabled = true;
    }
};
