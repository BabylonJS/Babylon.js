import * as React from 'react';
import { GlobalState } from '../../../../../globalState';
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { TextureCanvasManager } from './textureCanvasManager';

require('./textureEditor.scss');

interface TextureEditorComponentProps {
    globalState: GlobalState;
    texture: BaseTexture;
}

export class TextureEditorComponent extends React.Component<TextureEditorComponentProps> {
    private _textureCanvasManager: TextureCanvasManager;
    private canvasUI = React.createRef<HTMLCanvasElement>();
    private canvas2D = React.createRef<HTMLCanvasElement>();
    private canvasTexture = React.createRef<HTMLCanvasElement>();

    componentDidMount() {
        this._textureCanvasManager = new TextureCanvasManager(this.canvasUI.current!, this.props.texture, this.canvas2D.current!);
    }

    componentWillUnmount() {
        this._textureCanvasManager.dispose();
    }

    render() {
        return <div id='texture-editor'>
            <canvas id="canvas-ui" ref={this.canvasUI} tabIndex={1}></canvas>
            <canvas id="canvas-texture" ref={this.canvasTexture} width={this.props.texture.getSize().width} height={this.props.texture.getSize().height} hidden={true}></canvas>
            <canvas id="canvas-2D" width={this.props.texture.getSize().width} height={this.props.texture.getSize().height} hidden={true} ref={this.canvas2D}></canvas>
        </div>
    }
}