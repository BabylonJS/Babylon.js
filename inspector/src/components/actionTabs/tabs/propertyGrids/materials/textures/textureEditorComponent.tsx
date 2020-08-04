import * as React from 'react';
import { GlobalState } from '../../../../../globalState';
import { TextureCanvasManager, PixelData, ToolGUI } from './textureCanvasManager';
import { Tool, ToolBar } from './toolBar';
import { PropertiesBar } from './propertiesBar';
import { Channel, ChannelsBar } from './channelsBar';
import { BottomBar } from './bottomBar';
import { TextureCanvasComponent } from './textureCanvasComponent';
import defaultTools from './defaultTools/defaultTools';

import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { Tools } from 'babylonjs/Misc/tools';
import { Scene } from 'babylonjs/scene';
import { ISize } from 'babylonjs/Maths/math.size';
import { PointerInfo, Vector2 } from 'babylonjs';
import { PopupComponent } from '../../../../../popupComponent';

require('./textureEditor.scss');

interface TextureEditorComponentProps {
    globalState: GlobalState;
    texture: BaseTexture;
    url: string;
    window: React.RefObject<PopupComponent>;
}

interface TextureEditorComponentState {
    tools: Tool[];
    activeToolIndex: number;
    metadata: any;
    channels: Channel[];
    pixelData : PixelData;
    face: number;
}

export interface ToolParameters {
    scene: Scene;
    canvas2D: HTMLCanvasElement;
    scene3D: Scene;
    size: ISize;
    updateTexture: () => void;
    metadata: any;
    setMetadata: (data : any) => void;
    getMouseCoordinates: (pointerInfo : PointerInfo) => Vector2;
    GUI : ToolGUI;
    BABYLON : any;
    texture : BaseTexture;
}

export interface ToolData {
    name: string;
    type: any;
    icon: string;
    usesWindow? : boolean;
    is3D? : boolean;
}

declare global {
    var _TOOL_DATA_ : ToolData;
}

export class TextureEditorComponent extends React.Component<TextureEditorComponentProps, TextureEditorComponentState> {
    private _textureCanvasManager: TextureCanvasManager;
    private _UICanvas = React.createRef<HTMLCanvasElement>();
    private _2DCanvas = React.createRef<HTMLCanvasElement>();
    private _3DCanvas = React.createRef<HTMLCanvasElement>();

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
        this.loadToolFromURL = this.loadToolFromURL.bind(this);
        this.changeTool = this.changeTool.bind(this);
        this.setMetadata = this.setMetadata.bind(this);
        this.saveTexture = this.saveTexture.bind(this);
        this.setFace = this.setFace.bind(this);
        this.resetTexture = this.resetTexture.bind(this);
        this.resizeTexture = this.resizeTexture.bind(this);
        this.uploadTexture = this.uploadTexture.bind(this);

    }

    componentDidMount() {
        this._textureCanvasManager = new TextureCanvasManager(
            this.props.texture,
            this.props.window.current!.getWindow()!,
            this._UICanvas.current!,
            this._2DCanvas.current!,
            this._3DCanvas.current!,
            (data : PixelData) => {this.setState({pixelData: data})}
        );
        this.addTools(defaultTools);
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

    loadToolFromURL(url : string) {
        Tools.LoadScript(url, () => {
            this.addTools([_TOOL_DATA_]);
        });
    }
    
    addTools(tools : ToolData[]) {
        let newTools : Tool[] = [];
        tools.forEach(toolData => {
            const tool : Tool = {
                ...toolData,
                instance: new toolData.type(() => this.getToolParameters())};
            newTools = newTools.concat(tool);
        });
        newTools = this.state.tools.concat(newTools);
        this.setState({tools: newTools});
        console.log(newTools);
    }

    getToolParameters() : ToolParameters {
        return {
            scene: this._textureCanvasManager.scene,
            canvas2D: this._textureCanvasManager.canvas2D,
            scene3D: this._textureCanvasManager._3DScene,
            size: this._textureCanvasManager.size,
            updateTexture: () => this._textureCanvasManager.updateTexture(),
            metadata: this.state.metadata,
            setMetadata: (data : any) => this.setMetadata(data),
            getMouseCoordinates: (pointerInfo : PointerInfo) => this._textureCanvasManager.getMouseCoordinates(pointerInfo),
            GUI: this._textureCanvasManager._GUI,
            BABYLON: BABYLON,
            texture: this.props.texture
        };
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
        Tools.ToBlob(this._2DCanvas.current!, (blob) => {
            Tools.Download(blob!, this.props.url);
        });
    }

    resetTexture() {
        this._textureCanvasManager.reset();
    }

    resizeTexture(width: number, height: number) {
        this._textureCanvasManager.resize({width, height});
    }

    uploadTexture(file : File) {
        this._textureCanvasManager.upload(file);
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
                resizeTexture={this.resizeTexture}
                uploadTexture={this.uploadTexture}
            />
            <ToolBar
                tools={this.state.tools}
                activeToolIndex={this.state.activeToolIndex}
                addTool={this.loadToolFromURL}
                changeTool={this.changeTool}
                metadata={this.state.metadata}
                setMetadata={this.setMetadata}
            />
            <ChannelsBar channels={this.state.channels} setChannels={(channels) => {this.setState({channels})}}/>
            <TextureCanvasComponent canvas2D={this._2DCanvas} canvas3D={this._3DCanvas} canvasUI={this._UICanvas} texture={this.props.texture}/>
            <BottomBar name={this.props.url}/>
        </div>
    }
}