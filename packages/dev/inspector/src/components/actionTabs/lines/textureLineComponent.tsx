/* eslint-disable @typescript-eslint/naming-convention */
import * as React from "react";

import type { BaseTexture } from "core/Materials/Textures/baseTexture";

import type { GlobalState } from "../../../components/globalState";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import type { TextureChannelsToDisplay } from "../../../textureHelper";
import { TextureHelper } from "../../../textureHelper";

interface ITextureLineComponentProps {
    texture: BaseTexture;
    width: number;
    height: number;
    globalState?: GlobalState;
    hideChannelSelect?: boolean;
}

export class TextureLineComponent extends React.Component<ITextureLineComponentProps, { channels: TextureChannelsToDisplay; face: number }> {
    private _canvasRef: React.RefObject<HTMLCanvasElement>;

    private static _TextureChannelStates = {
        R: { R: true, G: false, B: false, A: false },
        G: { R: false, G: true, B: false, A: false },
        B: { R: false, G: false, B: true, A: false },
        A: { R: false, G: false, B: false, A: true },
        ALL: { R: true, G: true, B: true, A: true },
    };

    constructor(props: ITextureLineComponentProps) {
        super(props);

        this.state = {
            channels: TextureLineComponent._TextureChannelStates.ALL,
            face: 0,
        };

        this._canvasRef = React.createRef();
    }

    shouldComponentUpdate(nextProps: ITextureLineComponentProps, nextState: { channels: TextureChannelsToDisplay; face: number }): boolean {
        return nextProps.texture !== this.props.texture || nextState.channels !== this.state.channels || nextState.face !== this.state.face;
    }

    componentDidMount() {
        this.updatePreview();
    }

    componentDidUpdate() {
        this.updatePreview();
    }

    async updatePreview() {
        const previewCanvas = this._canvasRef.current!;
        const texture = this.props.texture;
        const size = texture.getSize();
        const ratio = size.width / size.height;
        let width = this.props.width;
        let height = (width / ratio) | 1;
        const engine = this.props.texture.getScene()?.getEngine();

        if (engine && height > engine.getCaps().maxTextureSize) {
            // the texture.width/texture.height ratio is too small, so use the real width/height dimensions of the texture instead of the canvas width/computed height
            width = this.props.texture.getSize().width;
            height = this.props.texture.getSize().height;
        }

        try {
            const data = await TextureHelper.GetTextureDataAsync(texture, width, height, this.state.face, this.state.channels, this.props.globalState);

            previewCanvas.width = width;
            previewCanvas.height = height;
            const context = previewCanvas.getContext("2d");

            if (context) {
                // Copy the pixels to the preview canvas
                const imageData = context.createImageData(width, height);
                const castData = imageData.data;
                castData.set(data);
                context.putImageData(imageData, 0, 0);
            }
            previewCanvas.style.height = height + "px";
        } catch (e) {
            previewCanvas.width = width;
            previewCanvas.height = height;
            previewCanvas.style.height = height + "px";
        }
    }

    render() {
        const texture = this.props.texture;

        return (
            <>
                <div className="textureLine">
                    {!this.props.hideChannelSelect && texture.isCube && (
                        <div className="control3D">
                            <button className={this.state.face === 0 ? "px command selected" : "px command"} onClick={() => this.setState({ face: 0 })}>
                                +X
                            </button>
                            <button className={this.state.face === 1 ? "nx command selected" : "nx command"} onClick={() => this.setState({ face: 1 })}>
                                -X
                            </button>
                            <button className={this.state.face === 2 ? "py command selected" : "py command"} onClick={() => this.setState({ face: 2 })}>
                                +Y
                            </button>
                            <button className={this.state.face === 3 ? "ny command selected" : "ny command"} onClick={() => this.setState({ face: 3 })}>
                                -Y
                            </button>
                            <button className={this.state.face === 4 ? "pz command selected" : "pz command"} onClick={() => this.setState({ face: 4 })}>
                                +Z
                            </button>
                            <button className={this.state.face === 5 ? "nz command selected" : "nz command"} onClick={() => this.setState({ face: 5 })}>
                                -Z
                            </button>
                        </div>
                    )}
                    {!this.props.hideChannelSelect && !texture.isCube && (
                        <div className="control">
                            <button
                                className={this.state.channels === TextureLineComponent._TextureChannelStates.R ? "red command selected" : "red command"}
                                onClick={() => this.setState({ channels: TextureLineComponent._TextureChannelStates.R })}
                            >
                                R
                            </button>
                            <button
                                className={this.state.channels === TextureLineComponent._TextureChannelStates.G ? "green command selected" : "green command"}
                                onClick={() => this.setState({ channels: TextureLineComponent._TextureChannelStates.G })}
                            >
                                G
                            </button>
                            <button
                                className={this.state.channels === TextureLineComponent._TextureChannelStates.B ? "blue command selected" : "blue command"}
                                onClick={() => this.setState({ channels: TextureLineComponent._TextureChannelStates.B })}
                            >
                                B
                            </button>
                            <button
                                className={this.state.channels === TextureLineComponent._TextureChannelStates.A ? "alpha command selected" : "alpha command"}
                                onClick={() => this.setState({ channels: TextureLineComponent._TextureChannelStates.A })}
                            >
                                A
                            </button>
                            <button
                                className={this.state.channels === TextureLineComponent._TextureChannelStates.ALL ? "all command selected" : "all command"}
                                onClick={() => this.setState({ channels: TextureLineComponent._TextureChannelStates.ALL })}
                            >
                                ALL
                            </button>
                        </div>
                    )}
                    <canvas ref={this._canvasRef} className="preview" />
                </div>
                {texture.isRenderTarget && (
                    <ButtonLineComponent
                        label="Refresh"
                        onClick={() => {
                            this.updatePreview();
                        }}
                    />
                )}
            </>
        );
    }
}
