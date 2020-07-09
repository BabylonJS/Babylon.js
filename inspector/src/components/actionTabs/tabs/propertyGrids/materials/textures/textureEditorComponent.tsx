import * as React from 'react';
import { GlobalState } from '../../../../../globalState';
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { TextureCanvasManager } from './textureCanvasManager';
import { TextureChannelToDisplay } from '../../../../../../textureHelper';
import { Tool } from './tools';

require('./textureEditor.scss');

interface TextureEditorComponentProps {
    globalState: GlobalState;
    texture: BaseTexture;
}

interface TextureEditorComponentState {
    channel: TextureChannelToDisplay;
    tools: Tool[];
    toolURL: string;
}

export class TextureEditorComponent extends React.Component<TextureEditorComponentProps, TextureEditorComponentState> {
    private _textureCanvasManager: TextureCanvasManager;
    private canvasUI = React.createRef<HTMLCanvasElement>();
    private canvas2D = React.createRef<HTMLCanvasElement>();
    private canvasDisplay = React.createRef<HTMLCanvasElement>();

    private channels = [
        {name: "RGBA", channel: TextureChannelToDisplay.All, className: "all"},
        {name: "R", channel: TextureChannelToDisplay.R, className: "red"},
        {name: "G", channel: TextureChannelToDisplay.G, className: "green"},
        {name: "B", channel: TextureChannelToDisplay.B, className: "blue"},
        {name: "A", channel: TextureChannelToDisplay.A, className: "alpha"},
    ]

    constructor(props : TextureEditorComponentProps) {
        super(props);
        this.state = {
            channel: TextureChannelToDisplay.All,
            tools: [],
            toolURL: ""
        }
    }

    componentDidMount() {
        this._textureCanvasManager = new TextureCanvasManager(
            this.props.texture,
            this.canvasUI.current!,
            this.canvas2D.current!,
            this.canvasDisplay.current!
        );
    }

    componentDidUpdate() {
        this._textureCanvasManager.displayChannel = this.state.channel;
    }

    componentWillUnmount() {
        this._textureCanvasManager.dispose();
    }

    render() {
        return <div id="texture-editor">
            <div id="toolbar">
                <div id="tools">
                    <select id="tool-select">
                        <option value={-1}>NO TOOL SELECTED</option>
                        {this.state.tools.map(
                            (item, index) => {
                                return <option value={index}>{item.name}</option>
                            }
                        )}
                    </select>
                    <form
                        id="tool-loading"
                        onSubmit={(event) => {
                            this._textureCanvasManager.loadTool(this.state.toolURL).then( () => {
                                    this._textureCanvasManager.activeTool = 0;
                                }
                            );
                            this.setState({toolURL: ""});
                            event.preventDefault();
                        }}>
                        <label>
                            Tool URL:
                            <input
                                onChange={(event) => this.setState({toolURL: event.target.value})}
                                type="text"
                                value={this.state.toolURL}
                                placeholder="http://..."
                            />
                        </label>
                        <button>Add Tool</button>
                    </form>
                </div>
                <div id="channels">
                    {this.channels.map(
                        item => {
                            const classNames = (item.channel === this.state.channel) ? "selected command " + item.className : "command " + item.className;
                            return <button className={classNames} key={item.name} onClick={() => this.setState({channel: item.channel})}>{item.name}</button>
                        }
                    )}
                </div>
            </div>
            <div id="editing-area">
                <canvas id="canvas-ui" ref={this.canvasUI} tabIndex={1}></canvas>
            </div>
            <canvas id="canvas-display" ref={this.canvasDisplay} width={this.props.texture.getSize().width} height={this.props.texture.getSize().height} hidden={true}></canvas>
            <canvas id="canvas-2D" ref={this.canvas2D} width={this.props.texture.getSize().width} height={this.props.texture.getSize().height} hidden={true}></canvas>
        </div>
    }
}