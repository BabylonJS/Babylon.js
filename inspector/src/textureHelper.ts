import { PostProcess } from 'babylonjs/PostProcesses/postProcess';
import { Texture } from 'babylonjs/Materials/Textures/texture';
import { PassPostProcess, PassCubePostProcess } from 'babylonjs/PostProcesses/passPostProcess';
import { Constants } from 'babylonjs/Engines/constants';
import { GlobalState } from './components/globalState';
import { RenderTargetTexture } from 'babylonjs/Materials/Textures/renderTargetTexture';
import { BaseTexture } from 'babylonjs/Materials/Textures/index';
import { Nullable } from 'babylonjs/types';

export enum TextureChannelToDisplay {
    R,
    G,
    B,
    A,
    All
}

export class TextureHelper {

    private static _ProcessAsync(texture: BaseTexture, width: number, height: number, face: number, channel: TextureChannelToDisplay, globalState: Nullable<GlobalState>, resolve: (result: Uint8Array) => void, reject: () => void) {
        var scene = texture.getScene()!;
        var engine = scene.getEngine();

        let passPostProcess: PostProcess;

        if (!texture.isCube) {
            passPostProcess = new PassPostProcess("pass", 1, null, Texture.NEAREST_SAMPLINGMODE, engine, false, Constants.TEXTURETYPE_UNSIGNED_INT);
        } else {
            var passCubePostProcess = new PassCubePostProcess("pass", 1, null, Texture.NEAREST_SAMPLINGMODE, engine, false, Constants.TEXTURETYPE_UNSIGNED_INT);
            passCubePostProcess.face = face;

            passPostProcess = passCubePostProcess;
        }

        if (!passPostProcess.getEffect().isReady()) {
            // Try again later
            passPostProcess.dispose();

            setTimeout(() => {
                this._ProcessAsync(texture, width, height, face, channel, globalState, resolve, reject);
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

        passPostProcess.onApply = function(effect) {
            effect.setTexture("textureSampler", texture);
        };

        let internalTexture = rtt.getInternalTexture();

        if (internalTexture) {
            scene.postProcessManager.directRender([passPostProcess], internalTexture);

            // Read the contents of the framebuffer
            var numberOfChannelsByLine = width * 4;
            var halfHeight = height / 2;

            //Reading datas from WebGL
            var data = engine.readPixels(0, 0, width, height);

            if (!texture.isCube) {
                if (channel != TextureChannelToDisplay.All) {
                    for (var i = 0; i < width * height * 4; i += 4) {

                        switch (channel) {
                            case TextureChannelToDisplay.R:
                                data[i + 1] = data[i];
                                data[i + 2] = data[i];
                                data[i + 3] = 255;
                                break;
                            case TextureChannelToDisplay.G:
                                data[i] = data[i + 1];
                                data[i + 2] = data[i];
                                data[i + 3] = 255;
                                break;
                            case TextureChannelToDisplay.B:
                                data[i] = data[i + 2];
                                data[i + 1] = data[i + 2];
                                data[i + 3] = 255;
                                break;
                            case TextureChannelToDisplay.A:
                                data[i] = data[i + 3];
                                data[i + 1] = data[i + 3];
                                data[i + 2] = data[i + 3];
                                data[i + 3] = 255;
                                break;
                        }
                    }
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
        passPostProcess.dispose();
        
        if (globalState) {
            globalState.blockMutationUpdates = false;
        }
    }

    public static GetTextureDataAsync(texture: BaseTexture, width: number, height: number, face: number, channel: TextureChannelToDisplay, globalState?: GlobalState): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            if (!texture.isReady() && texture._texture) {
                texture._texture.onLoadedObservable.addOnce(() => {
                    this._ProcessAsync(texture, width, height, face, channel, globalState || null, resolve, reject);
                });
                return;
            }        

            this._ProcessAsync(texture, width, height, face, channel, globalState || null, resolve, reject);
        });
    }
}