import * as React from 'react';
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';

interface TextureCanvasComponentProps {
    canvasUI : React.RefObject<HTMLCanvasElement>;
    canvas2D : React.RefObject<HTMLCanvasElement>;
    canvasDisplay : React.RefObject<HTMLCanvasElement>;
    texture : BaseTexture;
}

export class TextureCanvasComponent extends React.Component<TextureCanvasComponentProps> {
    shouldComponentUpdate(nextProps : TextureCanvasComponentProps) {
        return (nextProps.texture !== this.props.texture);
    }

    render() {
        return <div>
            <canvas id="canvas-ui" ref={this.props.canvasUI} tabIndex={1}></canvas>
            <canvas id="canvas-display" ref={this.props.canvasDisplay} width={this.props.texture.getSize().width} height={this.props.texture.getSize().height} hidden={true}></canvas>
            <canvas id="canvas-2D" ref={this.props.canvas2D} width={this.props.texture.getSize().width} height={this.props.texture.getSize().height} hidden={true}></canvas>
        </div>
    }
}