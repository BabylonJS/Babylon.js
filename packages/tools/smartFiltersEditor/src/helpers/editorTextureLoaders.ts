import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import type { InternalTexture } from "@babylonjs/core/Materials/Textures/internalTexture";
import { ThinTexture } from "@babylonjs/core/Materials/Textures/thinTexture.js";
import type { Observable } from "@babylonjs/core/Misc/observable";
import type { Nullable } from "@babylonjs/core/types";
import { createImageTexture, type ConnectionPointType, type InputBlock } from "@babylonjs/smart-filters";

export type LoadResult = {
    texture: ThinTexture;
    dispose: () => void;
};

/**
 * Loads the texture for a texture InputBlock for use in the editor app.
 * Note: this must not be used in a production application using Smart Filters.
 * @param inputBlock - The InputBlock to load the texture for
 * @param engine - The ThinEngine to create the texture with
 * @param beforeRenderObservable - Observable which is notified before rendering each frame
 * @returns The texture and dispose function for it, or null if the texture could not be loaded
 */
export async function loadTextureInputBlockAsset(
    inputBlock: InputBlock<ConnectionPointType.Texture>,
    engine: ThinEngine,
    beforeRenderObservable: Observable<void>
): Promise<Nullable<LoadResult>> {
    const editorData = inputBlock.editorData;

    // Look at the editor data to determine if we can load a texture
    if (editorData && editorData.url) {
        switch (editorData.urlTypeHint) {
            case "video":
                {
                    const { videoTexture, update, disposeVideoElementAndTextures } = await createVideoTextureAsync(
                        engine,
                        editorData.url
                    );
                    const observer = beforeRenderObservable.add(() => {
                        update();
                    });

                    if (videoTexture && editorData.anisotropicFilteringLevel !== null) {
                        videoTexture.anisotropicFilteringLevel = editorData.anisotropicFilteringLevel;
                    }

                    inputBlock.output.runtimeData.value = videoTexture;

                    return {
                        texture: videoTexture,
                        dispose: () => {
                            beforeRenderObservable.remove(observer);
                            disposeVideoElementAndTextures();
                        },
                    };
                }
                break;
            case "image":
            default:
                {
                    const texture = createImageTexture(engine, editorData.url, editorData.flipY);
                    if (texture && editorData.anisotropicFilteringLevel !== null) {
                        texture.anisotropicFilteringLevel = editorData.anisotropicFilteringLevel;
                    }

                    inputBlock.output.runtimeData.value = texture;

                    return {
                        texture,
                        dispose: texture.dispose,
                    };
                }
                break;
        }
    }

    return null;
}

export type EditorLoadedVideoTexture = {
    videoTexture: ThinTexture;
    update: () => void;
    disposeVideoElementAndTextures: () => void;
};

/**
 * A helper for the editor which creates a texture from a video file using an HTMLVideoElement.
 * Note: this must not be used in a production application using Smart Filters.
 *
 * @param engine - The ThinEngine to create the texture with
 * @param url - The URL of the video file to create a texture from
 */
export function createVideoTextureAsync(engine: ThinEngine, url: string): Promise<EditorLoadedVideoTexture> {
    return new Promise((resolve, reject) => {
        let hiddenVideo: Nullable<HTMLVideoElement> = document.createElement("video");
        document.body.appendChild(hiddenVideo);
        hiddenVideo.crossOrigin = "anonymous";
        hiddenVideo.style.display = "none";
        hiddenVideo.setAttribute("playsinline", "");
        hiddenVideo.muted = true;
        hiddenVideo.autoplay = true;
        hiddenVideo.loop = true;

        hiddenVideo.onloadeddata = () => {
            if (!hiddenVideo) {
                return;
            }

            let internalVideoTexture: Nullable<InternalTexture> = engine.createDynamicTexture(
                hiddenVideo.videoWidth,
                hiddenVideo.videoHeight,
                false,
                2
            );

            const update = () => {
                if (!hiddenVideo || hiddenVideo.readyState < hiddenVideo.HAVE_CURRENT_DATA) {
                    return;
                }

                engine.updateVideoTexture(internalVideoTexture, hiddenVideo, false);
            };

            update();

            let videoTexture: Nullable<ThinTexture> = new ThinTexture(internalVideoTexture);
            resolve({
                videoTexture,
                update,
                disposeVideoElementAndTextures: () => {
                    if (hiddenVideo) {
                        hiddenVideo.onloadeddata = null;
                        hiddenVideo.pause();
                        hiddenVideo.srcObject = null;
                        document.body.removeChild(hiddenVideo);
                        hiddenVideo = null;
                    }

                    if (videoTexture) {
                        videoTexture.dispose();
                        videoTexture = null;
                    }
                    if (internalVideoTexture) {
                        internalVideoTexture.dispose();
                        internalVideoTexture = null;
                    }
                },
            });
        };

        hiddenVideo.src = url;
        hiddenVideo.onerror = (error) => {
            reject(error);
        };
        hiddenVideo.play();
    });
}
