import * as React from 'react';
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';

interface ITextureCanvasComponentProps {
    canvasUI: React.RefObject<HTMLCanvasElement>;
    canvas2D: React.RefObject<HTMLCanvasElement>;
    canvas3D: React.RefObject<HTMLCanvasElement>;
    texture: BaseTexture;
}

export class TextureCanvasComponent extends React.Component<ITextureCanvasComponentProps> {

    render() {
        return <div>
            <canvas id="canvas-ui" ref={this.props.canvasUI} tabIndex={1}></canvas>
            <canvas id="canvas-2D" ref={this.props.canvas2D} hidden={true}></canvas>
            <canvas id="canvas-3D" ref={this.props.canvas3D} hidden={true}></canvas>
        </div>
    }
}