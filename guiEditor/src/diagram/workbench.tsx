import * as React from "react";
import { GlobalState } from '../globalState';
import { GUINode } from './guiNode';
import * as dagre from 'dagre';
import { Nullable } from 'babylonjs/types';

import { DataStorage } from 'babylonjs/Misc/dataStorage';

import {Control} from 'babylonjs-gui/2D/controls/control';
import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
import { Vector2, Vector3 } from "babylonjs/Maths/math.vector";
import { Engine } from "babylonjs/Engines/engine";
import { Scene } from "babylonjs/scene";
import { Color4 } from "babylonjs/Maths/math.color";
import { FreeCamera } from "babylonjs/Cameras/freeCamera";

require("./workbenchCanvas.scss");

export interface IWorkbenchComponentProps {
    globalState: GlobalState
}

export type FramePortData = {
}

export const isFramePortData = (variableToCheck: any): variableToCheck is FramePortData => {
    if (variableToCheck) {
        return (variableToCheck as FramePortData) !== undefined;
    }
    else return false;
}

export class WorkbenchComponent extends React.Component<IWorkbenchComponentProps> {
    private readonly MinZoom = 0.1;
    private readonly MaxZoom = 4;

    private _hostCanvas: HTMLDivElement;
    private _gridCanvas: HTMLDivElement;
    private _selectionContainer: HTMLDivElement;
    private _frameContainer: HTMLDivElement;
    private _svgCanvas: HTMLElement;
    private _rootContainer: HTMLDivElement;
    private _guiNodes: GUINode[] = [];
    private _mouseStartPointX: Nullable<number> = null;
    private _mouseStartPointY: Nullable<number> = null
    private _selectionStartX = 0;
    private _selectionStartY = 0;
    private _x = 0;
    private _y = 0;
    private _zoom = 1;
    private _selectedGuiNodes: GUINode[] = [];
    private _gridSize = 20;
    private _selectionBox: Nullable<HTMLDivElement> = null;    
    private _frameCandidate: Nullable<HTMLDivElement> = null;

    private _altKeyIsPressed = false;
    private _ctrlKeyIsPressed = false;
    private _oldY = -1;

    public _frameIsMoving = false;
    public _isLoading = false;
    public isOverGUINode = false;

    public get gridSize() {
        return this._gridSize;
    }

    public set gridSize(value: number) {
        this._gridSize = value;
        
        this.updateTransform();
    }

    public get globalState(){
        return this.props.globalState;
    }

    public get nodes() {
        return this._guiNodes;
    }

    public get zoom() {
        return this._zoom;
    }

    public set zoom(value: number) {
        if (this._zoom === value) {
            return;
        }

        this._zoom = value;
        
        this.updateTransform();
    }    

    public get x() {
        return this._x;
    }

    public set x(value: number) {
        this._x = value;
        
        this.updateTransform();
    }

    public get y() {
        return this._y;
    }

    public set y(value: number) {
        this._y = value;
        
        this.updateTransform();
    }

    public get selectedGuiNodes() {
        return this._selectedGuiNodes;
    }

    public get canvasContainer() {
        return this._gridCanvas;
    }

    public get hostCanvas() {
        return this._hostCanvas;
    }

    public get svgCanvas() {
        return this._svgCanvas;
    }

    public get selectionContainer() {
        return this._selectionContainer;
    }

    public get frameContainer() {
        return this._frameContainer;
    }

    constructor(props: IWorkbenchComponentProps) {
        super(props);
        props.globalState.onSelectionChangedObservable.add(selection => {  
            console.log(selection);
            this.selectedGuiNodes.forEach(element => {
                element.isSelected = false;
            }); 
            if (!selection) {
                this._selectedGuiNodes = [];
            } 
            else {
                if (selection instanceof GUINode ) {
                    if (this._ctrlKeyIsPressed) {
                        if (this._selectedGuiNodes.indexOf(selection) === -1) {
                            this._selectedGuiNodes.push(selection);
                        }
                    } 
                    else {              
                        this._selectedGuiNodes = [selection];
                    }
                    
                
                } 
            }
        });


        this.props.globalState.hostDocument!.addEventListener("keyup", () => this.onKeyUp(), false);
        this.props.globalState.hostDocument!.addEventListener("keydown", evt => {
            this._altKeyIsPressed = evt.altKey;            
            this._ctrlKeyIsPressed = evt.ctrlKey;
        }, false);
        this.props.globalState.hostDocument!.defaultView!.addEventListener("blur", () => {
            this._altKeyIsPressed = false;
            this._ctrlKeyIsPressed = false;
        }, false);     

        // Store additional data to serialization object
        this.props.globalState.storeEditorData = (editorData) => {
            editorData.x = this.x;
            editorData.y = this.y;
            editorData.zoom = this.zoom;
        }
        this.props.globalState.workbench = this;
    }

    public getGridPosition(position: number, useCeil = false) {
        let gridSize = this.gridSize;
		if (gridSize === 0) {
			return position;
        }
        if (useCeil) {
            return gridSize * Math.ceil(position / gridSize);    
        }
		return gridSize * Math.floor(position / gridSize);
    }

    public getGridPositionCeil(position: number) {
        let gridSize = this.gridSize;
		if (gridSize === 0) {
			return position;
		}
		return gridSize * Math.ceil(position / gridSize);
    }
    
    clearGuiTexture()
    {
        while(this._guiNodes.length > 0) {
            this._guiNodes[this._guiNodes.length-1].dispose();
            this._guiNodes.pop();
        }
    }

    loadFromJson(serializationObject: any) {
        this.globalState.onSelectionChangedObservable.notifyObservers(null);
        this.clearGuiTexture();
        this.globalState.guiTexture.parseContent(serializationObject);
        this.props.globalState.workbench.loadFromGuiTexture();
    }    
    async loadFromSnippet(snippedID: string){
        this.globalState.onSelectionChangedObservable.notifyObservers(null);
        this.clearGuiTexture();
        await this.globalState.guiTexture.parseFromSnippetAsync(snippedID);
        this.props.globalState.workbench.loadFromGuiTexture();
    }
    
    loadFromGuiTexture()
    {
        var children = this.globalState.guiTexture.getChildren();
        children[0].children.forEach(guiElement => {
            var newGuiNode = new GUINode(this.props.globalState, guiElement);
            this._guiNodes.push(newGuiNode);
        });
    }

    updateTransform() {
        this._rootContainer.style.transform = `translate(${this._x}px, ${this._y}px) scale(${this._zoom})`;

        if (DataStorage.ReadBoolean("ShowGrid", true)) {
            this._hostCanvas.style.backgroundSize = `${this._gridSize * this._zoom}px ${this._gridSize * this._zoom}px`;
            this._hostCanvas.style.backgroundPosition = `${this._x}px ${this._y}px`;
        } else {
            this._hostCanvas.style.backgroundSize = `0`;
        }
    }

    onKeyUp() {        
        this._altKeyIsPressed = false;
        this._ctrlKeyIsPressed = false;
        this._oldY = -1;
    }

    findNodeFromGuiElement(guiControl: Control) {
       return this._guiNodes.filter(n => n.guiControl === guiControl)[0];
    }

    reset() {
        for (var node of this._guiNodes) {
            node.dispose();
        }
        this._guiNodes = [];
        this._gridCanvas.innerHTML = "";
        this._svgCanvas.innerHTML = "";
    }

    appendBlock(guiElement: Control) {
        var newGuiNode = new GUINode(this.props.globalState, guiElement);
        this._guiNodes.push(newGuiNode);
        this.globalState.guiTexture.addControl(guiElement);  
        return newGuiNode;
    }

    distributeGraph() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;

        let graph = new dagre.graphlib.Graph();
        graph.setGraph({});
        graph.setDefaultEdgeLabel(() => ({}));
        graph.graph().rankdir = "LR";

        // Build dagre graph
        this._guiNodes.forEach(node => {


            graph.setNode(node.id.toString(), {
                id: node.id,
                type: "node",
                width: node.width,
                height: node.height
            });
        });

        // Distribute
        dagre.layout(graph);

        // Update graph
        let dagreNodes = graph.nodes().map(node => graph.node(node));
        dagreNodes.forEach((dagreNode: any) => {
            if (!dagreNode) {
                return;
            }
            if (dagreNode.type === "node") {
                for (var node of this._guiNodes) {
                    if (node.id === dagreNode.id) {
                        node.x = dagreNode.x - dagreNode.width / 2;
                        node.y = dagreNode.y - dagreNode.height / 2;
                        node.cleanAccumulation();
                        return;
                    }
                }
                return;
            }
        });        
    }

    componentDidMount() {
        this._hostCanvas = this.props.globalState.hostDocument.getElementById("workbench-canvas") as HTMLDivElement;
        this._rootContainer = this.props.globalState.hostDocument.getElementById("workbench-container") as HTMLDivElement;
        this._gridCanvas = this.props.globalState.hostDocument.getElementById("workbench-canvas-container") as HTMLDivElement;
        this._svgCanvas = this.props.globalState.hostDocument.getElementById("workbench-svg-container") as HTMLElement;        
        this._selectionContainer = this.props.globalState.hostDocument.getElementById("selection-container") as HTMLDivElement;   
        this._frameContainer = this.props.globalState.hostDocument.getElementById("frame-container") as HTMLDivElement;        
        
        this.gridSize = DataStorage.ReadNumber("GridSize", 20);
        this.updateTransform();
    }    

    onMove(evt: React.PointerEvent) {        
        // Selection box
        if (this._selectionBox) {
            const rootRect = this.canvasContainer.getBoundingClientRect();      

            const localX = evt.pageX - rootRect.left;
            const localY = evt.pageY - rootRect.top;

            if (localX > this._selectionStartX) {
                this._selectionBox.style.left = `${this._selectionStartX / this.zoom}px`;
                this._selectionBox.style.width = `${(localX - this._selectionStartX) / this.zoom}px`;
            } else {
                this._selectionBox.style.left = `${localX / this.zoom}px`;
                this._selectionBox.style.width = `${(this._selectionStartX - localX) / this.zoom}px`;
            }

            if (localY > this._selectionStartY) {                
                this._selectionBox.style.top = `${this._selectionStartY / this.zoom}px`;
                this._selectionBox.style.height = `${(localY - this._selectionStartY) / this.zoom}px`;
            } else {
                this._selectionBox.style.top = `${localY / this.zoom}px`;
                this._selectionBox.style.height = `${(this._selectionStartY - localY) / this.zoom}px`;
            }
            
            this.props.globalState.onSelectionBoxMoved.notifyObservers(this._selectionBox.getBoundingClientRect());

            return;
        }

        
        // Zoom with mouse + alt
        if (this._altKeyIsPressed && evt.buttons === 1) {
            if (this._oldY < 0) {
                this._oldY = evt.pageY;
            }

            let zoomDelta = (evt.pageY - this._oldY) / 10;
            if (Math.abs(zoomDelta) > 5) {
                const oldZoom = this.zoom;
                this.zoom = Math.max(Math.min(this.MaxZoom, this.zoom + zoomDelta / 100), this.MinZoom);

                const boundingRect = evt.currentTarget.getBoundingClientRect();
                const clientWidth = boundingRect.width;
                const widthDiff = clientWidth * this.zoom - clientWidth * oldZoom;
                const clientX = evt.clientX - boundingRect.left;
        
                const xFactor = (clientX - this.x) / oldZoom / clientWidth;
        
                this.x = this.x - widthDiff * xFactor;

                this._oldY = evt.pageY;      
            }
            return;
        }   

        // Move canvas and/or guiNodes
        if (this._mouseStartPointX != null && this._mouseStartPointY != null) {

            var x = this._mouseStartPointX;
            var y = this._mouseStartPointY;
            let selected = false;
            this.selectedGuiNodes.forEach(element => {
                selected = element._onMove(new Vector2(evt.clientX, evt.clientY), 
                new Vector2( x, y)) || selected;
            });

            if(!selected) {
                this._rootContainer.style.cursor = "move";
                this.x += evt.clientX - this._mouseStartPointX;
                this.y += evt.clientY - this._mouseStartPointY;
            }
            this._mouseStartPointX = evt.clientX;
            this._mouseStartPointY = evt.clientY;
        }
    }

    onDown(evt: React.PointerEvent<HTMLElement>) {
        this._rootContainer.setPointerCapture(evt.pointerId);

        /*if (evt.currentTarget === this._hostCanvas && evt.ctrlKey) {
            this._selectionBox = this.props.globalState.hostDocument.createElement("div");
            this._selectionBox.classList.add("selection-box");
            this._selectionContainer.appendChild(this._selectionBox);

            const rootRect = this.canvasContainer.getBoundingClientRect();      
            this._selectionStartX = (evt.pageX - rootRect.left);
            this._selectionStartY = (evt.pageY - rootRect.top);
            this._selectionBox.style.left = `${this._selectionStartX / this.zoom}px`;
            this._selectionBox.style.top = `${this._selectionStartY / this.zoom}px`;
            this._selectionBox.style.width = "0px";
            this._selectionBox.style.height = "0px";
            return;
        }*/
        console.log('workbench click');
        if(!this.isOverGUINode) {
            console.log('unclicked');
            this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
        }
        
        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;   
             
    }

    public isUp : boolean = true;
    onUp(evt: React.PointerEvent) {
        this._mouseStartPointX = null;
        this._mouseStartPointY = null;
        this._rootContainer.releasePointerCapture(evt.pointerId);   
        this._oldY = -1; 

        if (this._selectionBox) {
           this._selectionBox.parentElement!.removeChild(this._selectionBox);
           this._selectionBox = null;
        }

        if (this._frameCandidate) {            


            this._frameCandidate.parentElement!.removeChild(this._frameCandidate);
            this._frameCandidate = null;

        }
        this.isUp = true;
        
    }

    onWheel(evt: React.WheelEvent) {
        let delta = evt.deltaY < 0 ? 0.1 : -0.1;

        let oldZoom = this.zoom;
        this.zoom = Math.min(Math.max(this.MinZoom, this.zoom + delta * this.zoom), this.MaxZoom);

        const boundingRect = evt.currentTarget.getBoundingClientRect();
        const clientWidth = boundingRect.width;
        const clientHeight = boundingRect.height;
        const widthDiff = clientWidth * this.zoom - clientWidth * oldZoom;
        const heightDiff = clientHeight * this.zoom - clientHeight * oldZoom;
        const clientX = evt.clientX - boundingRect.left;
        const clientY = evt.clientY - boundingRect.top;

        const xFactor = (clientX - this.x) / oldZoom / clientWidth;
        const yFactor = (clientY - this.y) / oldZoom / clientHeight;

        this.x = this.x - widthDiff * xFactor;
        this.y = this.y - heightDiff * yFactor;

        evt.stopPropagation();
    }

    zoomToFit() {
        // Get negative offset
        let minX = 0;
        let minY = 0;
        this._guiNodes.forEach(node => {

            if (node.x < minX) {
                minX = node.x;
            }
            if (node.y < minY) {
                minY = node.y;
            }
        });
        // Restore to 0

        this._guiNodes.forEach(node => {
            node.x += -minX;
            node.y += -minY;            
            node.cleanAccumulation();
        });

        // Get correct zoom
        const xFactor = this._rootContainer.clientWidth / this._rootContainer.scrollWidth;
        const yFactor = this._rootContainer.clientHeight / this._rootContainer.scrollHeight;
        const zoomFactor = xFactor < yFactor ? xFactor : yFactor;
        

        this.zoom = zoomFactor;
        this.x = 0;
        this.y = 0;
    }


    public createGUICanvas()
    {
        // Get the canvas element from the DOM.
        const canvas = document.getElementById("workbench-canvas") as HTMLCanvasElement;

        // Associate a Babylon Engine to it.
        const engine = new Engine(canvas);
        
        // Create our first scene.
        var scene = new Scene(engine);
        scene.clearColor = new Color4(0.2, 0.2, 0.3, 1.0);

        // This creates and positions a free camera (non-mesh)
        var camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);

        // This targets the camera to scene origin
        camera.setTarget(Vector3.Zero());
        
        // This attaches the camera to the canvas
        //camera.attachControl(true);
        
        // GUI
        this.globalState.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        scene.getEngine().onCanvasPointerOutObservable.clear();
        // Watch for browser/canvas resize events
        window.addEventListener("resize", function () {
        engine.resize();
        });
        this.props.globalState.onErrorMessageDialogRequiredObservable.notifyObservers(`Please note: This editor is still a work in progress. You may submit feedback to msDestiny14 on GitHub.`);
        engine.runRenderLoop(() => {this.updateGUIs(); scene.render()});
    }
    
    updateGUIs()
    {
        this._guiNodes.forEach(element => {
            element.updateVisual();
            
        });
    }
 
    render() {
 
        return <canvas id="workbench-canvas" 
        onWheel={evt => this.onWheel(evt)}
        onPointerMove={evt => this.onMove(evt)}
        onPointerDown={evt =>  this.onDown(evt)}   
        onPointerUp={evt =>  this.onUp(evt)} 
        >   
        <div id="workbench-container">
            <div id="workbench-canvas-container">  
            </div>     
            <div id="frame-container">                        
            </div>
            <svg id="workbench-svg-container">
            </svg>                    
            <div id="selection-container">                        
            </div>
        </div>
        </canvas>
    }
}
