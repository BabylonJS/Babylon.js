import * as React from "react";

import { Constants } from "core/Engines/constants";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Texture } from "core/Materials/Textures/texture";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import type { PostProcess } from "core/PostProcesses/postProcess";
import { PassPostProcess, PassCubePostProcess } from "core/PostProcesses/passPostProcess";

interface ITextureLineComponentProps {
    texture: BaseTexture;
    width: number;
    height: number;
    globalState?: any;
    hideChannelSelect?: boolean;
}

export interface ITextureLineComponentState {
    displayRed: boolean;
    displayGreen: boolean;
    displayBlue: boolean;
    displayAlpha: boolean;
    face: number;
}

export class TextureLineComponent extends React.Component<ITextureLineComponentProps, ITextureLineComponentState> {
    private _canvasRef: React.RefObject<HTMLCanvasElement>;

    constructor(props: ITextureLineComponentProps) {
        super(props);

        this.state = {
            displayRed: true,
            displayGreen: true,
            displayBlue: true,
            displayAlpha: true,
            face: 0,
        };

        this._canvasRef = React.createRef();
    }

    override shouldComponentUpdate(): boolean {
        return true;
    }

    override componentDidMount() {
        this.updatePreview();
    }

    override componentDidUpdate() {
        this.updatePreview();
    }

    public updatePreview() {
        TextureLineComponent.UpdatePreview(this._canvasRef.current as HTMLCanvasElement, this.props.texture, this.props.width, this.state, undefined, this.props.globalState);
    }

    public static async UpdatePreview(
        previewCanvas: HTMLCanvasElement,
        texture: BaseTexture,
        width: number,
        options: ITextureLineComponentState,
        onReady?: () => void,
        globalState?: any
    ) {
        if (!texture.isReady() && texture._texture) {
            texture._texture.onLoadedObservable.addOnce(() => {
                TextureLineComponent.UpdatePreview(previewCanvas, texture, width, options, onReady, globalState);
            });
        }
        const scene = texture.getScene()!;
        const engine = scene.getEngine();
        const size = texture.getSize();
        const ratio = size.width / size.height;
        const height = (width / ratio) | 1;

        let passPostProcess: PostProcess;

        if (!texture.isCube) {
            passPostProcess = new PassPostProcess("pass", 1, null, Texture.NEAREST_SAMPLINGMODE, engine, false, Constants.TEXTURETYPE_UNSIGNED_INT);
        } else {
            const passCubePostProcess = new PassCubePostProcess("pass", 1, null, Texture.NEAREST_SAMPLINGMODE, engine, false, Constants.TEXTURETYPE_UNSIGNED_INT);
            passCubePostProcess.face = options.face;

            passPostProcess = passCubePostProcess;
        }

        passPostProcess.onEffectCreatedObservable.add((e) => {
            e.executeWhenCompiled(async () => {
                if (globalState) {
                    globalState.blockMutationUpdates = true;
                }

                const rtt = new RenderTargetTexture("temp", { width: width, height: height }, scene, false);

                passPostProcess.externalTextureSamplerBinding = true;
                passPostProcess.onApply = function (effect) {
                    effect.setTexture("textureSampler", texture);
                };

                const internalTexture = rtt.renderTarget;

                if (internalTexture) {
                    scene.postProcessManager.directRender([passPostProcess], internalTexture, true);

                    // Read the contents of the framebuffer
                    const numberOfChannelsByLine = width * 4;
                    const halfHeight = height / 2;

                    //Reading datas from WebGL
                    const bufferView = await engine.readPixels(0, 0, width, height);
                    const data = new Uint8Array(bufferView.buffer, 0, bufferView.byteLength);

                    if (!texture.isCube) {
                        if (!options.displayRed || !options.displayGreen || !options.displayBlue) {
                            for (let i = 0; i < width * height * 4; i += 4) {
                                if (!options.displayRed) {
                                    data[i] = 0;
                                }

                                if (!options.displayGreen) {
                                    data[i + 1] = 0;
                                }

                                if (!options.displayBlue) {
                                    data[i + 2] = 0;
                                }

                                if (options.displayAlpha) {
                                    const alpha = data[i + 2];
                                    data[i] = alpha;
                                    data[i + 1] = alpha;
                                    data[i + 2] = alpha;
                                    data[i + 2] = 0;
                                }
                            }
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

                    previewCanvas.width = width;
                    previewCanvas.height = height;
                    const context = previewCanvas.getContext("2d");

                    if (context) {
                        // Copy the pixels to the preview canvas
                        const imageData = context.createImageData(width, height);
                        const castData = imageData.data;
                        castData.set(data);
                        context.putImageData(imageData, 0, 0);

                        if (onReady) {
                            onReady();
                        }
                    }

                    // Unbind
                    engine.unBindFramebuffer(internalTexture);
                }

                rtt.dispose();
                passPostProcess.dispose();

                previewCanvas.style.height = height + "px";
                if (globalState) {
                    globalState.blockMutationUpdates = false;
                }
            });
        });
    }

    override render() {
        const texture = this.props.texture;

        return (
            <div className="textureLine">
                {!this.props.hideChannelSelect && texture.isCube && (
                    <div className="control3D">
                        <button className={this.state.face === 0 ? "px command selected" : "px command"} onClick={() => this.setState({ face: 0 })}>
                            PX
                        </button>
                        <button className={this.state.face === 1 ? "nx command selected" : "nx command"} onClick={() => this.setState({ face: 1 })}>
                            NX
                        </button>
                        <button className={this.state.face === 2 ? "py command selected" : "py command"} onClick={() => this.setState({ face: 2 })}>
                            PY
                        </button>
                        <button className={this.state.face === 3 ? "ny command selected" : "ny command"} onClick={() => this.setState({ face: 3 })}>
                            NY
                        </button>
                        <button className={this.state.face === 4 ? "pz command selected" : "pz command"} onClick={() => this.setState({ face: 4 })}>
                            PZ
                        </button>
                        <button className={this.state.face === 5 ? "nz command selected" : "nz command"} onClick={() => this.setState({ face: 5 })}>
                            NZ
                        </button>
                    </div>
                )}
                {!this.props.hideChannelSelect && !texture.isCube && (
                    <div className="control">
                        <button
                            className={this.state.displayRed && !this.state.displayGreen ? "red command selected" : "red command"}
                            onClick={() => this.setState({ displayRed: true, displayGreen: false, displayBlue: false, displayAlpha: false })}
                        >
                            R
                        </button>
                        <button
                            className={this.state.displayGreen && !this.state.displayBlue ? "green command selected" : "green command"}
                            onClick={() => this.setState({ displayRed: false, displayGreen: true, displayBlue: false, displayAlpha: false })}
                        >
                            G
                        </button>
                        <button
                            className={this.state.displayBlue && !this.state.displayAlpha ? "blue command selected" : "blue command"}
                            onClick={() => this.setState({ displayRed: false, displayGreen: false, displayBlue: true, displayAlpha: false })}
                        >
                            B
                        </button>
                        <button
                            className={this.state.displayAlpha && !this.state.displayRed ? "alpha command selected" : "alpha command"}
                            onClick={() => this.setState({ displayRed: false, displayGreen: false, displayBlue: false, displayAlpha: true })}
                        >
                            A
                        </button>
                        <button
                            className={this.state.displayRed && this.state.displayGreen ? "all command selected" : "all command"}
                            onClick={() => this.setState({ displayRed: true, displayGreen: true, displayBlue: true, displayAlpha: true })}
                        >
                            ALL
                        </button>
                    </div>
                )}
                <canvas ref={this._canvasRef} className="preview" />
            </div>
        );
    }
}
