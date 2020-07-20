import * as React from 'react';
import { GlobalState } from '../../../../../globalState';
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { TextureCanvasManager, PixelData } from './textureCanvasManager';
import { Tool, ToolBar } from './toolBar';
import { PropertiesBar } from './propertiesBar';
import { Channel, ChannelsBar } from './channelsBar';
import { BottomBar } from './bottomBar';
import { Tools } from "babylonjs/Misc/tools";
import { TextureCanvasComponent } from './textureCanvasComponent';

require('./textureEditor.scss');

interface TextureEditorComponentProps {
    globalState: GlobalState;
    texture: BaseTexture;
    url: string;
}

interface TextureEditorComponentState {
    tools: Tool[];
    activeToolIndex: number;
    metadata: any;
    channels: Channel[];
    pixelData : PixelData;
    face: number;
}

interface ToolData {
    name: string;
    type: any;
    icon: string;
}

declare global {
    var _TOOL_DATA_ : ToolData;
}

export class TextureEditorComponent extends React.Component<TextureEditorComponentProps, TextureEditorComponentState> {
    private _textureCanvasManager: TextureCanvasManager;
    private canvasUI = React.createRef<HTMLCanvasElement>();
    private canvas2D = React.createRef<HTMLCanvasElement>();
    private canvasDisplay = React.createRef<HTMLCanvasElement>();

    constructor(props : TextureEditorComponentProps) {
        super(props);
        let channels : Channel[] = [
            {name: 'Red', visible: true, editable: true, id: 'R', icon: require('./assets/channelR.svg')},
            {name: 'Green', visible: true, editable: true, id: 'G', icon: require('./assets/channelG.svg')},
            {name: 'Blue', visible: true, editable: true, id: 'B', icon: require('./assets/channelB.svg')},
        ];
        if (this.props.texture.isCube) {
            channels.push({name: 'Display', visible: true, editable: true, id: 'A', icon: require('./assets/channelD.svg')});
        } else {
            channels.push({name: 'Alpha', visible: true, editable: true, id: 'A', icon: require('./assets/channelA.svg')});
        }
        this.state = {
            tools: [],
            activeToolIndex: -1,
            metadata: {
                color: '#ffffff',
                opacity: 1
            },
            channels,
            pixelData: {},
            face: 0
        }
        this.loadTool = this.loadTool.bind(this);
        this.changeTool = this.changeTool.bind(this);
        this.setMetadata = this.setMetadata.bind(this);
        this.saveTexture = this.saveTexture.bind(this);
        this.setFace = this.setFace.bind(this);
        this.resetTexture = this.resetTexture.bind(this);
    }

    componentDidMount() {
        this._textureCanvasManager = new TextureCanvasManager(
            this.props.texture,
            this.canvasUI.current!,
            this.canvas2D.current!,
            this.canvasDisplay.current!,
            (data : PixelData) => {this.setState({pixelData: data})}
        );
        // this.loadTool('https://darraghburkems.github.io/BJSTools/Paintbrush.js');
        // this.loadTool('https://darraghburkems.github.io/BJSTools/Floodfill.js');
        // this.loadTool('https://darraghburkems.github.io/BJSTools/Eyedropper.js');
    }

    componentDidUpdate() {
        let channelsClone : Channel[] = [];
        this.state.channels.forEach(channel => channelsClone.push({...channel}));
        this._textureCanvasManager.channels = channelsClone;
        this._textureCanvasManager.metadata = {...this.state.metadata};
        this._textureCanvasManager.face = this.state.face;
    }

    componentWillUnmount() {
        this._textureCanvasManager.dispose();
    }

    // There is currently no UI for adding a tool, so this function does not get called
    loadTool(url : string) {
        Tools.LoadScript(url, () => {
            const tool : Tool = {
                ..._TOOL_DATA_,
                instance: new _TOOL_DATA_.type({
                    scene: this._textureCanvasManager.scene,
                    canvas2D: this._textureCanvasManager.canvas2D,
                    size: this._textureCanvasManager.size,
                    updateTexture: () => this._textureCanvasManager.updateTexture(),
                    getMetadata: () => this.state.metadata,
                    setMetadata: (data : any) => this.setMetadata(data)
                })
            };
            const newTools = this.state.tools.concat(tool);
            this.setState({tools: newTools});
                console.log(tool);
        });
    }

    changeTool(index : number) {
        if (index != -1) {
            this._textureCanvasManager.tool = this.state.tools[index];
        } else {
            this._textureCanvasManager.tool = null;
        }
        this.setState({activeToolIndex: index});
    }

    setMetadata(newMetadata : any) {
        const data = {
            ...this.state.metadata,
            ...newMetadata
        }
        this.setState({metadata: data});
    }

    setFace(face: number) {
        this.setState({face});
    }

    saveTexture() {
        Tools.ToBlob(this.canvas2D.current!, (blob) => {
            Tools.Download(blob!, this.props.url);
        });
    }

    resetTexture() {
        this._textureCanvasManager.resetTexture();
    }

    render() {
        return <div id="texture-editor">
            <PropertiesBar
                texture={this.props.texture}
                saveTexture={this.saveTexture}
                pixelData={this.state.pixelData}
                face={this.state.face}
                setFace={this.setFace}
                resetTexture={this.resetTexture}
            />
            <ToolBar
                tools={this.state.tools}
                activeToolIndex={this.state.activeToolIndex}
                addTool={this.loadTool}
                changeTool={this.changeTool}
                metadata={this.state.metadata}
                setMetadata={this.setMetadata}
            />
            <ChannelsBar channels={this.state.channels} setChannels={(channels) => {this.setState({channels})}}/>
            <TextureCanvasComponent canvas2D={this.canvas2D} canvasDisplay={this.canvasDisplay} canvasUI={this.canvasUI} texture={this.props.texture}/>
            <BottomBar name={this.props.url}/>
        </div>
    }
}