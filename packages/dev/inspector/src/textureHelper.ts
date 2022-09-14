/* eslint-disable @typescript-eslint/naming-convention */
import { PostProcess } from "core/PostProcesses/postProcess";
import { Texture } from "core/Materials/Textures/texture";
import type { GlobalState } from "./components/globalState";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Nullable } from "core/types";

import "./lod";
import "./lodCube";

export interface TextureChannelsToDisplay {
    R: boolean;
    G: boolean;
    B: boolean;
    A: boolean;
}

export class TextureHelper {
    private static async _ProcessAsync(
        texture: BaseTexture,
        width: number,
        height: number,
        face: number,
        channels: TextureChannelsToDisplay,
        lod: number,
        globalState: Nullable<GlobalState>,
        resolve: (result: Uint8Array) => void,
        reject: () => void
    ) {
        const scene = texture.getScene()!;
        const engine = scene.getEngine();

        let lodPostProcess: PostProcess;

        if (!texture.isCube) {
            lodPostProcess = new PostProcess("lod", "lod", ["lod", "gamma"], null, 1.0, null, Texture.NEAREST_NEAREST_MIPNEAREST, engine);
        } else {
            const faceDefines = ["#define POSITIVEX", "#define NEGATIVEX", "#define POSITIVEY", "#define NEGATIVEY", "#define POSITIVEZ", "#define NEGATIVEZ"];
            lodPostProcess = new PostProcess("lodCube", "lodCube", ["lod", "gamma"], null, 1.0, null, Texture.NEAREST_NEAREST_MIPNEAREST, engine, false, faceDefines[face]);
        }

        if (!lodPostProcess.getEffect().isReady()) {
            // Try again later
            lodPostProcess.dispose();

            setTimeout(() => {
                this._ProcessAsync(texture, width, height, face, channels, lod, globalState, resolve, reject);
            }, 250);

            return;
        }

        if (globalState) {
            globalState.blockMutationUpdates = true;
        }

        const rtt = new RenderTargetTexture("temp", { width: width, height: height }, scene, false);

        lodPostProcess.onApply = function (effect) {
            effect.setTexture("textureSampler", texture);
            effect.setFloat("lod", lod);
            effect.setBool("gamma", texture.gammaSpace);
        };

        const internalTexture = texture.getInternalTexture();

        if (rtt.renderTarget && internalTexture) {
            const samplingMode = internalTexture.samplingMode;
            if (lod !== 0) {
                texture.updateSamplingMode(Texture.NEAREST_NEAREST_MIPNEAREST);
            } else {
                texture.updateSamplingMode(Texture.NEAREST_NEAREST);
            }

            scene.postProcessManager.directRender([lodPostProcess], rtt.renderTarget, true);
            texture.updateSamplingMode(samplingMode);

            // Read the contents of the framebuffer
            const numberOfChannelsByLine = width * 4;
            const halfHeight = height / 2;

            //Reading datas from WebGL
            const bufferView = await engine.readPixels(0, 0, width, height);
            const data = new Uint8Array(bufferView.buffer, 0, bufferView.byteLength);

            if (!channels.R || !channels.G || !channels.B || !channels.A) {
                for (let i = 0; i < width * height * 4; i += 4) {
                    // If alpha is the only channel, just display alpha across all channels
                    if (channels.A && !channels.R && !channels.G && !channels.B) {
                        data[i] = data[i + 3];
                        data[i + 1] = data[i + 3];
                        data[i + 2] = data[i + 3];
                        data[i + 3] = 255;
                        continue;
                    }
                    let r = data[i],
                        g = data[i + 1],
                        b = data[i + 2],
                        a = data[i + 3];
                    // If alpha is not visible, make everything 100% alpha
                    if (!channels.A) {
                        a = 255;
                    }
                    // If only one color channel is selected, map both colors to it. If two are selected, the unused one gets set to 0
                    if (!channels.R) {
                        if (channels.G && !channels.B) {
                            r = g;
                        } else if (channels.B && !channels.G) {
                            r = b;
                        } else {
                            r = 0;
                        }
                    }
                    if (!channels.G) {
                        if (channels.R && !channels.B) {
                            g = r;
                        } else if (channels.B && !channels.R) {
                            g = b;
                        } else {
                            g = 0;
                        }
                    }
                    if (!channels.B) {
                        if (channels.R && !channels.G) {
                            b = r;
                        } else if (channels.G && !channels.R) {
                            b = g;
                        } else {
                            b = 0;
                        }
                    }
                    data[i] = r;
                    data[i + 1] = g;
                    data[i + 2] = b;
                    data[i + 3] = a;
                }
            }

            //To flip image on Y axis.
            if ((texture as Texture).invertY || texture.isCube) {
                for (let i = 0; i < halfHeight; i++) {
                    for (let j = 0; j < numberOfChannelsByLine; j++) {
                        const currentCell = j + i * numberOfChannelsByLine;
                        const targetLine = height - i - 1;
                        const targetCell = j + targetLine * numberOfChannelsByLine;

                        const temp = data[currentCell];
                        data[currentCell] = data[targetCell];
                        data[targetCell] = temp;
                    }
                }
            }

            resolve(data);

            // Unbind
            engine.unBindFramebuffer(rtt.renderTarget);
        } else {
            reject();
        }

        rtt.dispose();
        lodPostProcess.dispose();

        if (globalState) {
            globalState.blockMutationUpdates = false;
        }
    }

    public static GetTextureDataAsync(
        texture: BaseTexture,
        width: number,
        height: number,
        face: number,
        channels: TextureChannelsToDisplay,
        globalState?: GlobalState,
        lod: number = 0
    ): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            if (!texture.isReady() && texture._texture) {
                texture._texture.onLoadedObservable.addOnce(() => {
                    this._ProcessAsync(texture, width, height, face, channels, lod, globalState || null, resolve, reject);
                });
                return;
            }

            this._ProcessAsync(texture, width, height, face, channels, lod, globalState || null, resolve, reject);
        });
    }
}
