import * as React from "react";

import { Constants } from "babylonjs/Engines/constants";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { RenderTargetTexture } from "babylonjs/Materials/Textures/renderTargetTexture";
import { PostProcess } from "babylonjs/PostProcesses/postProcess";
import { PassPostProcess, PassCubePostProcess } from "babylonjs/PostProcesses/passPostProcess";

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
    private canvasRef: React.RefObject<HTMLCanvasElement>;

    constructor(props: ITextureLineComponentProps) {
        super(props);

        this.state = {
            displayRed: true,
            displayGreen: true,
            displayBlue: true,
            displayAlpha: true,
            face: 0
        };

        this.canvasRef = React.createRef();
    }

    shouldComponentUpdate(nextProps: ITextureLineComponentProps, nextState: { displayRed: boolean, displayGreen: boolean, displayBlue: boolean, displayAlpha: boolean, face: number }): boolean {
        return true;
    }

    componentDidMount() {
        this.updatePreview();
    }

    componentDidUpdate() {
        this.updatePreview();
    }

    public updatePreview() {
        TextureLineComponent.UpdatePreview(this.canvasRef.current as HTMLCanvasElement, this.props.texture, this.props.width, this.state, undefined, this.props.globalState);
    }

    public static UpdatePreview(previewCanvas: HTMLCanvasElement, texture: BaseTexture, width: number, options: ITextureLineComponentState, onReady?: ()=> void, globalState?: any) {
        if (!texture.isReady() && texture._texture) {
            texture._texture.onLoadedObservable.addOnce(() => {
                TextureLineComponent.UpdatePreview(previewCanvas, texture, width, options, onReady, globalState);
            })
        }
        var scene = texture.getScene()!;
        var engine = scene.getEngine();
        var size = texture.getSize();
        var ratio = size.width / size.height;
        var height = (width / ratio) | 1;

        let passPostProcess: PostProcess;

        if (!texture.isCube) {
            passPostProcess = new PassPostProcess("pass", 1, null, Texture.NEAREST_SAMPLINGMODE, engine, false, Constants.TEXTURETYPE_UNSIGNED_INT);
        } else {
            var passCubePostProcess = new PassCubePostProcess("pass", 1, null, Texture.NEAREST_SAMPLINGMODE, engine, false, Constants.TEXTURETYPE_UNSIGNED_INT);
            passCubePostProcess.face = options.face;

            passPostProcess = passCubePostProcess;
        }

        if (!passPostProcess.getEffect().isReady()) {
            // Try again later
            passPostProcess.dispose();

            setTimeout(() => TextureLineComponent.UpdatePreview(previewCanvas, texture, width, options, onReady, globalState), 250);

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
                if (!options.displayRed || !options.displayGreen || !options.displayBlue) {
                    for (var i = 0; i < width * height * 4; i += 4) {

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
                            var alpha = data[i + 2];
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

            previewCanvas.width = width;
            previewCanvas.height = height;
            var context = previewCanvas.getContext('2d');

            if (context) {
                // Copy the pixels to the preview canvas
                var imageData = context.createImageData(width, height);
                var castData = imageData.data;
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
    }

    render() {
        var texture = this.props.texture;

        return (
            <div className="textureLine">
                {
                    !this.props.hideChannelSelect && texture.isCube &&
                    <div className="control3D">
                        <button className={this.state.face === 0 ? "px command selected" : "px command"} onClick={() => this.setState({ face: 0 })}>PX</button>
                        <button className={this.state.face === 1 ? "nx command selected" : "nx command"} onClick={() => this.setState({ face: 1 })}>NX</button>
                        <button className={this.state.face === 2 ? "py command selected" : "py command"} onClick={() => this.setState({ face: 2 })}>PY</button>
                        <button className={this.state.face === 3 ? "ny command selected" : "ny command"} onClick={() => this.setState({ face: 3 })}>NY</button>
                        <button className={this.state.face === 4 ? "pz command selected" : "pz command"} onClick={() => this.setState({ face: 4 })}>PZ</button>
                        <button className={this.state.face === 5 ? "nz command selected" : "nz command"} onClick={() => this.setState({ face: 5 })}>NZ</button>
                    </div>
                }
                {
                    !this.props.hideChannelSelect && !texture.isCube &&
                    <div className="control">
                        <button className={this.state.displayRed && !this.state.displayGreen ? "red command selected" : "red command"} onClick={() => this.setState({ displayRed: true, displayGreen: false, displayBlue: false, displayAlpha: false })}>R</button>
                        <button className={this.state.displayGreen && !this.state.displayBlue ? "green command selected" : "green command"} onClick={() => this.setState({ displayRed: false, displayGreen: true, displayBlue: false, displayAlpha: false })}>G</button>
                        <button className={this.state.displayBlue && !this.state.displayAlpha ? "blue command selected" : "blue command"} onClick={() => this.setState({ displayRed: false, displayGreen: false, displayBlue: true, displayAlpha: false })}>B</button>
                        <button className={this.state.displayAlpha && !this.state.displayRed ? "alpha command selected" : "alpha command"} onClick={() => this.setState({ displayRed: false, displayGreen: false, displayBlue: false, displayAlpha: true })}>A</button>
                        <button className={this.state.displayRed && this.state.displayGreen ? "all command selected" : "all command"} onClick={() => this.setState({ displayRed: true, displayGreen: true, displayBlue: true, displayAlpha: true })}>ALL</button>
                    </div>
                }
                <canvas ref={this.canvasRef} className="preview" />
            </div>
        );
    }
}
