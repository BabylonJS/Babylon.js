import * as React from 'react';
import { TextureCanvasManager, IPixelData } from './textureCanvasManager';
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
import { ToolSettings } from './toolSettings';
import { Constants } from 'babylonjs/Engines/constants';

require('./textureEditor.scss');

interface ITextureEditorComponentProps {
    texture: BaseTexture;
    url: string;
    window: React.RefObject<PopupComponent>;
    onUpdate: () => void;
}

interface ITextureEditorComponentState {
    tools: ITool[];
    activeToolIndex: number;
    metadata: IMetadata;
    channels: IChannel[];
    pixelData : IPixelData;
    face: number;
    mipLevel: number;
    pickerOpen: boolean;
}

export interface IToolParameters {
    /** The visible scene in the editor. Useful for adding pointer and keyboard events. */
    scene: Scene;
    /** The 2D canvas which you can sample pixel data from. Tools should not paint directly on this canvas. */
    canvas2D: HTMLCanvasElement;
    /** The 3D scene which tools can add post processes to. */
    scene3D: Scene;
    /** The size of the texture. */
    size: ISize;
    /** Pushes the editor texture back to the original scene. This should be called every time a tool makes any modification to a texture. */
    updateTexture: () => void;
    /** The metadata object which is shared between all tools. Feel free to store any information here. Do not set this directly: instead call setMetadata. */
    metadata: IMetadata;
    /** Call this when you want to mutate the metadata. */
    setMetadata: (data : any) => void;
    /** Returns the texture coordinates under the cursor */
    getMouseCoordinates: (pointerInfo : PointerInfo) => Vector2;
    /** Provides access to the BABYLON namespace */
    BABYLON: any;
    /** Provides a canvas that you can use the canvas API to paint on. */
    startPainting: () => Promise<CanvasRenderingContext2D>;
    /** After you have painted on your canvas, call this method to push the updates back to the texture. */
    updatePainting: () => void;
    /** Call this when you are finished painting. */
    stopPainting: () => void;
}

export interface IToolGUIProps {
    instance: IToolType
}

/** An interface representing the definition of a tool */
export interface IToolData {
    /** Name to display on the toolbar */
    name: string;
    /** A class definition for the tool including setup and cleanup methods */
    type: IToolConstructable;
    /**  An SVG icon encoded in Base64 */
    icon: string;
    /** Whether the tool uses postprocesses */
    is3D?: boolean;
    cursor?: string;
    settingsComponent? : React.ComponentType<IToolGUIProps>;
}

export interface IToolType {
    /** Called when the tool is selected. */
    setup: () => void;
    /** Called when the tool is deselected. */
    cleanup: () => void;
    /** Optional. Called when the user resets the texture or uploads a new texture. Tools may want to reset their state when this happens. */
    onReset?: () => void;
}

/** For constructable types, TS requires that you define a seperate interface which constructs your actual interface */
interface IToolConstructable {
    new (getParameters: () => IToolParameters) : IToolType;
}

export interface IMetadata {
    color: string;
    alpha: number;
    select: {
        x1: number,
        y1: number,
        x2: number,
        y2: number
    }
    [key: string] : any;
}

declare global {
    var _TOOL_DATA_ : IToolData;
}

export class TextureEditorComponent extends React.Component<ITextureEditorComponentProps, ITextureEditorComponentState> {
    private _textureCanvasManager: TextureCanvasManager;
    private _UICanvas = React.createRef<HTMLCanvasElement>();
    private _2DCanvas = React.createRef<HTMLCanvasElement>();
    private _3DCanvas = React.createRef<HTMLCanvasElement>();
    private _pickerRef = React.createRef<HTMLDivElement>();
    private _timer : number | null;
    private static PREVIEW_UPDATE_DELAY_MS = 160;

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
                alpha: 1,
                select: {
                    x1: -1,
                    y1: -1,
                    x2: -1,
                    y2: -1
                }
            },
            channels,
            pixelData: {},
            face: 0,
            mipLevel: 0,
            pickerOpen: false
        }
        this.loadToolFromURL = this.loadToolFromURL.bind(this);
        this.changeTool = this.changeTool.bind(this);
        this.setMetadata = this.setMetadata.bind(this);
        this.saveTexture = this.saveTexture.bind(this);
        this.resetTexture = this.resetTexture.bind(this);
        this.resizeTexture = this.resizeTexture.bind(this);
        this.uploadTexture = this.uploadTexture.bind(this);
        this.setPickerOpen = this.setPickerOpen.bind(this);
        this.onPointerDown = this.onPointerDown.bind(this);
    }

    componentDidMount() {
        this._textureCanvasManager = new TextureCanvasManager(
            this.props.texture,
            this.props.window.current!.getWindow()!,
            this._UICanvas.current!,
            this._2DCanvas.current!,
            this._3DCanvas.current!,
            (data : IPixelData) => {this.setState({pixelData: data})},
            this.state.metadata,
            () => this.textureDidUpdate(),
            data => this.setMetadata(data),
            mipLevel => this.setState({mipLevel})
        );
        this.addTools(defaultTools);
    }

    componentDidUpdate() {
        let channelsClone : IChannel[] = [];
        this.state.channels.forEach(channel => channelsClone.push({...channel}));
        this._textureCanvasManager.channels = channelsClone;
        this._textureCanvasManager.face = this.state.face;
        this._textureCanvasManager.mipLevel = this.state.mipLevel;
    }

    componentWillUnmount() {
        this._textureCanvasManager.dispose();
    }

    textureDidUpdate() {
        if (this._timer != null) {
            clearTimeout(this._timer);
        }
        this._timer = window.setTimeout(() => {
            this.props.onUpdate();
            this._timer = null;
        }, TextureEditorComponent.PREVIEW_UPDATE_DELAY_MS);
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
                instance: new toolData.type(() => this.getToolParameters())
            };
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
            startPainting: () => this._textureCanvasManager.startPainting(),
            stopPainting: () => this._textureCanvasManager.stopPainting(),
            updatePainting: () => this._textureCanvasManager.updatePainting(),
            metadata: this.state.metadata,
            setMetadata: (data : any) => this.setMetadata(data),
            getMouseCoordinates: (pointerInfo : PointerInfo) => this._textureCanvasManager.getMouseCoordinates(pointerInfo),
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
        this._textureCanvasManager.metadata = data;
    }

    setPickerOpen(open: boolean) {
        this.setState({pickerOpen: open});
    }

    onPointerDown(evt: React.PointerEvent) {
        if (!this._pickerRef.current?.contains(evt.target as Node)) {
            this.setPickerOpen(false);
        }
    }

    saveTexture() {
        this._textureCanvasManager.saveTexture();
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
        const currentTool : ITool | undefined = this.state.tools[this.state.activeToolIndex];
        let cursor = `initial`;
        if (currentTool && currentTool.cursor) {
            cursor = `url(data:image/png;base64,${currentTool.cursor}) 10 10, auto`;
        }

        return <div id="texture-editor" onPointerDown={this.onPointerDown} style={{cursor}}>
            <PropertiesBar
                texture={this.props.texture}
                saveTexture={this.saveTexture}
                pixelData={this.state.pixelData}
                face={this.state.face}
                setFace={face => this.setState({face})}
                resetTexture={this.resetTexture}
                resizeTexture={this.resizeTexture}
                uploadTexture={this.uploadTexture}
                mipLevel={this.state.mipLevel}
                setMipLevel={mipLevel => this.setState({mipLevel})}
                size={this._textureCanvasManager?.size || this.props.texture.getSize()}
            />
            {!this.props.texture.isCube && <ToolBar
                tools={this.state.tools}
                activeToolIndex={this.state.activeToolIndex}
                addTool={this.loadToolFromURL}
                changeTool={this.changeTool}
                metadata={this.state.metadata}
                setMetadata={this.setMetadata}
                pickerOpen={this.state.pickerOpen}
                setPickerOpen={this.setPickerOpen}
                pickerRef={this._pickerRef}
                hasAlpha={this.props.texture.textureFormat === -1 || this.props.texture.textureFormat === Constants.TEXTUREFORMAT_RGBA}
            />}
            <ChannelsBar channels={this.state.channels} setChannels={(channels) => {this.setState({channels})}}/>
            <TextureCanvasComponent canvas2D={this._2DCanvas} canvas3D={this._3DCanvas} canvasUI={this._UICanvas} texture={this.props.texture}/>
            <ToolSettings tool={currentTool} />
            <BottomBar texture={this.props.texture} mipLevel={this.state.mipLevel}/>
        </div>
    }
}