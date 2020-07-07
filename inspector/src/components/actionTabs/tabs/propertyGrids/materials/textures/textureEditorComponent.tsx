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
    private reactCanvas = React.createRef<HTMLCanvasElement>();

    componentDidMount() {
        this._textureCanvasManager = new TextureCanvasManager(this.reactCanvas.current!, this.props.texture);
    }

    componentWillUnmount() {
        this._textureCanvasManager.dispose();
    }

    render() {
        return <div id='texture-editor'>
            <canvas id="texture-canvas" ref={this.reactCanvas} tabIndex={1}></canvas>
        </div>
    }
}