import * as React from "react";

import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";

import { GlobalState } from "../../../components/globalState";
import { ButtonLineComponent } from './buttonLineComponent';
import { TextureHelper, TextureChannelsToDisplay } from '../../../textureHelper';

interface ITextureLineComponentProps {
    texture: BaseTexture;
    width: number;
    height: number;
    globalState?: GlobalState;
    hideChannelSelect?: boolean;
}


export class TextureLineComponent extends React.Component<ITextureLineComponentProps, { channels: TextureChannelsToDisplay, face: number }> {
    private canvasRef: React.RefObject<HTMLCanvasElement>;

    private static TextureChannelStates = {
        R: {R:true, G: false, B:false, A:false},
        G: {R:false, G: true, B:false, A:false},
        B: {R:false, G: false, B:true, A:false},
        A: {R:false, G: false, B:false, A:true},
        ALL: {R:true, G:true, B:true, A:true}
    }

    constructor(props: ITextureLineComponentProps) {
        super(props);

        this.state = {
            channels: TextureLineComponent.TextureChannelStates.ALL,
            face: 0
        };

        this.canvasRef = React.createRef();
    }

    shouldComponentUpdate(nextProps: ITextureLineComponentProps, nextState: { channels: TextureChannelsToDisplay, face: number }): boolean {
        return (nextProps.texture !== this.props.texture || nextState.channels !== this.state.channels || nextState.face !== this.state.face);
    }

    componentDidMount() {
        this.updatePreview();
    }

    componentDidUpdate() {
        this.updatePreview();
    }

    updatePreview() {
        var texture = this.props.texture;
        var size = texture.getSize();
        var ratio = size.width / size.height;
        var width = this.props.width;
        var height = (width / ratio) | 1;            

        TextureHelper.GetTextureDataAsync(texture, width, height, this.state.face, this.state.channels, this.props.globalState).then(data => {
            const previewCanvas = this.canvasRef.current as HTMLCanvasElement;
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
            previewCanvas.style.height = height + "px";
        });
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
                            <button className={this.state.channels === TextureLineComponent.TextureChannelStates.R ? "red command selected" : "red command"} onClick={() => this.setState({ channels: TextureLineComponent.TextureChannelStates.R })}>R</button>
                            <button className={this.state.channels === TextureLineComponent.TextureChannelStates.G ? "green command selected" : "green command"} onClick={() => this.setState({ channels: TextureLineComponent.TextureChannelStates.G })}>G</button>
                            <button className={this.state.channels === TextureLineComponent.TextureChannelStates.B ? "blue command selected" : "blue command"} onClick={() => this.setState({ channels: TextureLineComponent.TextureChannelStates.B })}>B</button>
                            <button className={this.state.channels === TextureLineComponent.TextureChannelStates.A ? "alpha command selected" : "alpha command"} onClick={() => this.setState({ channels: TextureLineComponent.TextureChannelStates.A })}>A</button>
                            <button className={this.state.channels === TextureLineComponent.TextureChannelStates.ALL ? "all command selected" : "all command"} onClick={() => this.setState({ channels: TextureLineComponent.TextureChannelStates.ALL })}>ALL</button>
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
