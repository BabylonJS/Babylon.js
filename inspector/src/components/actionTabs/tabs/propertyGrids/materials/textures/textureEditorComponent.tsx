import * as React from 'react';
import { GlobalState } from '../../../../../globalState';
import { TextureCanvasManager, IPixelData, IToolGUI } from './textureCanvasManager';
import { ITool, ToolBar } from './toolBar';
import { PropertiesBar } from './propertiesBar';
import { IChannel, ChannelsBar } from './channelsBar';
import { BottomBar } from './bottomBar';
import { TextureCanvasComponent } from './textureCanvasComponent';
import defaultTools from './defaultTools/defaultTools';

import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { Tools } from 'babylonjs/Misc/tools';
import { Scene } from 'babylonjs/scene';
import { ISize } from 'babylonjs/Maths/math.size';
import { Vector2 } from 'babylonjs/Maths/math.vector';
import { PointerInfo } from 'babylonjs/Events/pointerEvents';

import { PopupComponent } from '../../../../../popupComponent';

require('./textureEditor.scss');

interface ITextureEditorComponentProps {
    globalState: GlobalState;
    texture: BaseTexture;
    url: string;
    window: React.RefObject<PopupComponent>;
}

interface ITextureEditorComponentState {
    tools: ITool[];
    activeToolIndex: number;
    metadata: any;
    channels: IChannel[];
    pixelData : IPixelData;
    face: number;
}

export interface IToolParameters {
    scene: Scene;
    canvas2D: HTMLCanvasElement;
    scene3D: Scene;
    size: ISize;
    updateTexture: () => void;
    metadata: any;
    setMetadata: (data : any) => void;
    /** Returns the texture coordinates under the cursor */
    getMouseCoordinates: (pointerInfo : PointerInfo) => Vector2;
    GUI: IToolGUI;
    /** Provides access to the BABYLON namespace */
    BABYLON: any;
}

/** An interface representing the definition of a tool */
export interface IToolData {
    /** Name to display on the toolbar */
    name: string;
    /** A class definition for the tool including setup and cleanup methods */
    type: any;
    /**  An SVG icon encoded in Base64 */
    icon: string;
    /** Whether the tool uses the draggable GUI window */
    usesWindow? : boolean;
    /** Whether the tool uses postprocesses */
    is3D? : boolean;
}

declare global {
    var _TOOL_DATA_ : IToolData;
}

export class TextureEditorComponent extends React.Component<ITextureEditorComponentProps, ITextureEditorComponentState> {
    private _textureCanvasManager: TextureCanvasManager;
    private _UICanvas = React.createRef<HTMLCanvasElement>();
    private _2DCanvas = React.createRef<HTMLCanvasElement>();
    private _3DCanvas = React.createRef<HTMLCanvasElement>();

    constructor(props : ITextureEditorComponentProps) {
        super(props);
        let channels : IChannel[] = [
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
            (data : IPixelData) => {this.setState({pixelData: data})}
        );
        this.addTools(defaultTools);
    }

    componentDidUpdate() {
        let channelsClone : IChannel[] = [];
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
    
    addTools(tools : IToolData[]) {
        let newTools : ITool[] = [];
        tools.forEach(toolData => {
            const tool : ITool = {
                ...toolData,
                instance: new toolData.type(() => this.getToolParameters())};
            newTools = newTools.concat(tool);
        });
        newTools = this.state.tools.concat(newTools);
        this.setState({tools: newTools});
        console.log(newTools);
    }

    getToolParameters() : IToolParameters {
        return {
            scene: this._textureCanvasManager.scene,
            canvas2D: this._textureCanvasManager.canvas2D,
            scene3D: this._textureCanvasManager.scene3D,
            size: this._textureCanvasManager.size,
            updateTexture: () => this._textureCanvasManager.updateTexture(),
            metadata: this.state.metadata,
            setMetadata: (data : any) => this.setMetadata(data),
            getMouseCoordinates: (pointerInfo : PointerInfo) => this._textureCanvasManager.getMouseCoordinates(pointerInfo),
            GUI: this._textureCanvasManager.GUI,
            BABYLON: BABYLON,
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
            {!this.props.texture.isCube && <ToolBar
                tools={this.state.tools}
                activeToolIndex={this.state.activeToolIndex}
                addTool={this.loadToolFromURL}
                changeTool={this.changeTool}
                metadata={this.state.metadata}
                setMetadata={this.setMetadata}
            />}
            <ChannelsBar channels={this.state.channels} setChannels={(channels) => {this.setState({channels})}}/>
            <TextureCanvasComponent canvas2D={this._2DCanvas} canvas3D={this._3DCanvas} canvasUI={this._UICanvas} texture={this.props.texture}/>
            <BottomBar name={this.props.url}/>
        </div>
    }
}