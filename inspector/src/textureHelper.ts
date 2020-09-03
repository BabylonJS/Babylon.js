import { PostProcess } from 'babylonjs/PostProcesses/postProcess';
import { Texture } from 'babylonjs/Materials/Textures/texture';
import { GlobalState } from './components/globalState';
import { RenderTargetTexture } from 'babylonjs/Materials/Textures/renderTargetTexture';
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { Nullable } from 'babylonjs/types';

import "./lod";
import "./lodCube";


export interface TextureChannelsToDisplay {
    R: boolean;
    G: boolean;
    B: boolean;
    A: boolean;
}

export class TextureHelper {

    private static _ProcessAsync(texture: BaseTexture, width: number, height: number, face: number, channels: TextureChannelsToDisplay, lod: number, globalState: Nullable<GlobalState>, resolve: (result: Uint8Array) => void, reject: () => void) {
        var scene = texture.getScene()!;
        var engine = scene.getEngine();

        let lodPostProcess: PostProcess;

        if (!texture.isCube) {
            lodPostProcess = new PostProcess("lod", "lod", ["lod"], null, 1.0, null, Texture.NEAREST_SAMPLINGMODE, engine);
        } else {
            const faceDefines = [
                "#define POSITIVEX",
                "#define NEGATIVEX",
                "#define POSITIVEY",
                "#define NEGATIVEY",
                "#define POSITIVEZ",
                "#define NEGATIVEZ",
            ];
            lodPostProcess = new PostProcess("lodCube", "lodCube", ["lod"], null, 1.0, null, Texture.NEAREST_SAMPLINGMODE, engine, false, faceDefines[face]);
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

        let rtt = new RenderTargetTexture(
            "temp",
            { width: width, height: height },
            scene, false);

        lodPostProcess.onApply = function(effect) {
            effect.setTexture("textureSampler", texture);
            effect.setFloat("lod", lod);
        };

        let internalTexture = rtt.getInternalTexture();

        if (internalTexture) {
            const samplingMode = (texture as Texture).samplingMode;
            texture.updateSamplingMode(BABYLON.Texture.NEAREST_NEAREST_MIPNEAREST);
            scene.postProcessManager.directRender([lodPostProcess], internalTexture);
            texture.updateSamplingMode(samplingMode);

            // Read the contents of the framebuffer
            var numberOfChannelsByLine = width * 4;
            var halfHeight = height / 2;

            //Reading datas from WebGL
            var data = engine.readPixels(0, 0, width, height);

            if (!channels.R || !channels.G || !channels.B || !channels.A) {
                for (var i = 0; i < width * height * 4; i += 4) {
                    // If alpha is the only channel, just display alpha across all channels
                    if (channels.A && !channels.R && !channels.G && !channels.B) {
                        data[i] = data[i+3];
                        data[i+1] = data[i+3];
                        data[i+2] = data[i+3];
                        data[i+3] = 255;
                        continue;
                    }
                    let r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
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
                for (var i = 0; i < halfHeight; i++) {
                    for (var j = 0; j < numberOfChannelsByLine; j++) {
                        var currentCell = j + i * numberOfChannelsByLine;
                        var targetLine = height - i - 1;
                        var targetCell = j + targetLine * numberOfChannelsByLine;

                        var temp = data[currentCell];
                        data[currentCell] = data[targetCell];
                        data[targetCell] = temp;
                    }
                }
            }
            
            resolve(data);

            // Unbind
            engine.unBindFramebuffer(internalTexture);
        } else {
            reject();
        }

        rtt.dispose();
        lodPostProcess.dispose();
        
        if (globalState) {
            globalState.blockMutationUpdates = false;
        }
    }

    public static GetTextureDataAsync(texture: BaseTexture, width: number, height: number, face: number, channels: TextureChannelsToDisplay, globalState?: GlobalState, lod: number = 0): Promise<Uint8Array> {
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