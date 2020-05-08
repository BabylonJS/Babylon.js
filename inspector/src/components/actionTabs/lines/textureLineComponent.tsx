import * as React from "react";

import { Constants } from "babylonjs/Engines/constants";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { RenderTargetTexture } from "babylonjs/Materials/Textures/renderTargetTexture";
import { PostProcess } from "babylonjs/PostProcesses/postProcess";
import { PassPostProcess, PassCubePostProcess } from "babylonjs/PostProcesses/passPostProcess";

import { GlobalState } from "../../../components/globalState";
import { ButtonLineComponent } from './buttonLineComponent';

interface ITextureLineComponentProps {
    texture: BaseTexture;
    width: number;
    height: number;
    globalState?: GlobalState;
    hideChannelSelect?: boolean;
}

enum ChannelToDisplay {
    R,
    G,
    B,
    A,
    All
}

export class TextureLineComponent extends React.Component<ITextureLineComponentProps, { channel: ChannelToDisplay, face: number }> {
    private canvasRef: React.RefObject<HTMLCanvasElement>;

    constructor(props: ITextureLineComponentProps) {
        super(props);

        this.state = {
            channel: ChannelToDisplay.All,
            face: 0
        };

        this.canvasRef = React.createRef();
    }

    shouldComponentUpdate(nextProps: ITextureLineComponentProps, nextState: { channel: ChannelToDisplay, face: number }): boolean {
        return (nextProps.texture !== this.props.texture || nextState.channel !== this.state.channel || nextState.face !== this.state.face);
    }

    componentDidMount() {
        this.updatePreview();
    }

    componentDidUpdate() {
        this.updatePreview();
    }

    updatePreview() {
        var texture = this.props.texture;
        if (!texture.isReady() && texture._texture) {
            texture._texture.onLoadedObservable.addOnce(() => {
                this.updatePreview();
            })
        }
        var scene = texture.getScene()!;
        var engine = scene.getEngine();
        var size = texture.getSize();
        var ratio = size.width / size.height;
        var width = this.props.width;
        var height = (width / ratio) | 1;

        let passPostProcess: PostProcess;

        if (!texture.isCube) {
            passPostProcess = new PassPostProcess("pass", 1, null, Texture.NEAREST_SAMPLINGMODE, engine, false, Constants.TEXTURETYPE_UNSIGNED_INT);
        } else {
            var passCubePostProcess = new PassCubePostProcess("pass", 1, null, Texture.NEAREST_SAMPLINGMODE, engine, false, Constants.TEXTURETYPE_UNSIGNED_INT);
            passCubePostProcess.face = this.state.face;

            passPostProcess = passCubePostProcess;
        }

        if (!passPostProcess.getEffect().isReady()) {
            // Try again later
            passPostProcess.dispose();

            setTimeout(() => this.updatePreview(), 250);

            return;
        }

        const previewCanvas = this.canvasRef.current as HTMLCanvasElement;

        if (this.props.globalState) {
            this.props.globalState.blockMutationUpdates = true;
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
                if (this.state.channel != ChannelToDisplay.All) {
                    for (var i = 0; i < width * height * 4; i += 4) {

                        switch (this.state.channel) {
                            case ChannelToDisplay.R:
                                data[i + 1] = data[i];
                                data[i + 2] = data[i];
                                data[i + 3] = 255;
                                break;
                            case ChannelToDisplay.G:
                                data[i] = data[i + 1];
                                data[i + 2] = data[i];
                                data[i + 3] = 255;
                                break;
                            case ChannelToDisplay.B:
                                data[i] = data[i + 2];
                                data[i + 1] = data[i + 2];
                                data[i + 3] = 255;
                                break;
                            case ChannelToDisplay.A:
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

            previewCanvas.width = width;
            previewCanvas.height = height;
            var context = previewCanvas.getContext('2d');

            if (context) {
                // Copy the pixels to the preview canvas
                var imageData = context.createImageData(width, height);
                var castData = imageData.data;
                castData.set(data);
                context.putImageData(imageData, 0, 0);
            }

            // Unbind
            engine.unBindFramebuffer(internalTexture);
        }

        rtt.dispose();
        passPostProcess.dispose();

        previewCanvas.style.height = height + "px";
        if (this.props.globalState) {
            this.props.globalState.blockMutationUpdates = false;
        }

    }

    render() {
        var texture = this.props.texture;

        return (
            <>
                <div className="textureLine">
                    {
                        !this.props.hideChannelSelect && texture.isCube &&
                        <div className="control3D">
                            <button className={this.state.face === 0 ? "px command selected" : "px command"} onClick={() => this.setState({ face: 0 })}>+X</button>
                            <button className={this.state.face === 1 ? "nx command selected" : "nx command"} onClick={() => this.setState({ face: 1 })}>-X</button>
                            <button className={this.state.face === 2 ? "py command selected" : "py command"} onClick={() => this.setState({ face: 2 })}>+Y</button>
                            <button className={this.state.face === 3 ? "ny command selected" : "ny command"} onClick={() => this.setState({ face: 3 })}>-Y</button>
                            <button className={this.state.face === 4 ? "pz command selected" : "pz command"} onClick={() => this.setState({ face: 4 })}>+Z</button>
                            <button className={this.state.face === 5 ? "nz command selected" : "nz command"} onClick={() => this.setState({ face: 5 })}>-Z</button>
                        </div>
                    }
                    {
                        !this.props.hideChannelSelect && !texture.isCube &&
                        <div className="control">
                            <button className={this.state.channel === ChannelToDisplay.R ? "red command selected" : "red command"} onClick={() => this.setState({ channel: ChannelToDisplay.R })}>R</button>
                            <button className={this.state.channel === ChannelToDisplay.G ? "green command selected" : "green command"} onClick={() => this.setState({ channel: ChannelToDisplay.G })}>G</button>
                            <button className={this.state.channel === ChannelToDisplay.B ? "blue command selected" : "blue command"} onClick={() => this.setState({ channel: ChannelToDisplay.B })}>B</button>
                            <button className={this.state.channel === ChannelToDisplay.A ? "alpha command selected" : "alpha command"} onClick={() => this.setState({ channel: ChannelToDisplay.A })}>A</button>
                            <button className={this.state.channel === ChannelToDisplay.All ? "all command selected" : "all command"} onClick={() => this.setState({ channel: ChannelToDisplay.All })}>ALL</button>
                        </div>
                    }
                    <canvas ref={this.canvasRef} className="preview" />
                </div>
                {
                    texture.isRenderTarget &&
                    <ButtonLineComponent label="Refresh" onClick={() => {
                        this.updatePreview();
                    }} />
                }
            </>
        );
    }
}
