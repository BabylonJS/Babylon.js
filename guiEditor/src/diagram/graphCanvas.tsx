import * as React from "react";
import { GlobalState } from '../globalState';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes';
import { GraphNode } from './graphNode';
import * as dagre from 'dagre';
import { Nullable } from 'babylonjs/types';
import { NodeLink } from './nodeLink';
import { NodePort } from './nodePort';
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection, NodeMaterialConnectionPointCompatibilityStates } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
import { Vector2 } from 'babylonjs/Maths/math.vector';
import { FragmentOutputBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/fragmentOutputBlock';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
import { DataStorage } from 'babylonjs/Misc/dataStorage';
import { IEditorData, IFrameData } from '../nodeLocationInfo';
import { FrameNodePort } from './frameNodePort';
import { Button } from 'babylonjs-gui/2D/controls/button';
import { Engine } from 'babylonjs/Engines/engine';
import { Scene } from 'babylonjs/scene';
import { Container, Rectangle } from 'babylonjs-gui';
import { GuiNode } from './guiNode';

require("./graphCanvas.scss");

export interface IGraphCanvasComponentProps {
    globalState: GlobalState
}

export type FramePortData = {
    port: FrameNodePort
}

export const isFramePortData = (variableToCheck: any): variableToCheck is FramePortData => {
    if (variableToCheck) {
        return (variableToCheck as FramePortData).port !== undefined;
    }
    else return false;
}

export class GraphCanvasComponent extends React.Component<IGraphCanvasComponentProps> {
    private readonly MinZoom = 0.1;
    private readonly MaxZoom = 4;

    private _hostCanvas: HTMLDivElement;
    private _graphCanvas: HTMLDivElement;
    private _selectionContainer: HTMLDivElement;
    private _frameContainer: HTMLDivElement;
    private _svgCanvas: HTMLElement;
    private _rootContainer: HTMLDivElement;
    private _nodes: GraphNode[] = [];
    private _guiNodes: GraphNode[] = [];
    private _links: NodeLink[] = [];
    private _mouseStartPointX: Nullable<number> = null;
    private _mouseStartPointY: Nullable<number> = null
    private _dropPointX = 0;
    private _dropPointY = 0;
    private _selectionStartX = 0;
    private _selectionStartY = 0;
    private _candidateLinkedHasMoved = false;
    private _x = 0;
    private _y = 0;
    private _zoom = 1;
    private _selectedNodes: GraphNode[] = [];
    private _selectedGuiNodes: GraphNode[] = [];
    private _selectedLink: Nullable<NodeLink> = null;
    private _selectedPort: Nullable<NodePort> = null;
    private _candidateLink: Nullable<NodeLink> = null;
    private _candidatePort: Nullable<NodePort | FrameNodePort> = null;
    private _gridSize = 20;
    private _selectionBox: Nullable<HTMLDivElement> = null;    
    private _frameCandidate: Nullable<HTMLDivElement> = null;

    private _altKeyIsPressed = false;
    private _ctrlKeyIsPressed = false;
    private _oldY = -1;

    public _frameIsMoving = false;
    public _isLoading = false;

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
        return this._nodes;
    }

    public get links() {
        return this._links;
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

    public get selectedNodes() {
        return this._selectedNodes;
    }

    public get selectedGuiNodes() {
        return this._selectedGuiNodes;
    }

    public get selectedLink() {
        return this._selectedLink;
    }

    public get selectedPort() {
        return this._selectedPort;
    }

    public get canvasContainer() {
        return this._graphCanvas;
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

    constructor(props: IGraphCanvasComponentProps) {
        super(props);

        props.globalState.onSelectionChangedObservable.add(selection => {  
            if (!selection) {
                this.selectedGuiNodes.forEach(element => {
                    element.isSelected = false;
                }); 
                this._selectedNodes = [];
                this._selectedGuiNodes = [];
                this._selectedLink = null;
                this._selectedPort = null;
            } else {
                if (selection instanceof NodeLink) {
                    this._selectedNodes = [];
                    this._selectedGuiNodes = [];
                    this._selectedLink = selection;
                    this._selectedPort = null;
                }  else if (selection instanceof GraphNode){
                    if (this._ctrlKeyIsPressed) {
                        if (this._selectedNodes.indexOf(selection) === -1) {
                            this._selectedNodes.push(selection);
                            this._selectedGuiNodes.push(selection);
                        }
                    } else {                    
                        this._selectedNodes = [selection];
                        this._selectedGuiNodes = [selection];
                    }
                } else if(selection instanceof NodePort){
                    this._selectedNodes = [];
                    this._selectedGuiNodes = [];
                    this._selectedLink = null;
                    this._selectedPort = selection;
                } else {
                    this._selectedNodes = [];
                    this._selectedGuiNodes = [];
                    this._selectedLink = null;
                    //this._selectedPort = selection.port;
                }
            }
        });

        props.globalState.onCandidatePortSelectedObservable.add(port => {
            this._candidatePort = port;
        });

        props.globalState.onGridSizeChanged.add(() => {
            this.gridSize = DataStorage.ReadNumber("GridSize", 20);
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
        this.props.globalState.storeEditorData = (editorData, graphFrame) => {
            editorData.frames = [];
            if (graphFrame) {
                editorData.frames.push(graphFrame!.serialize());
            } else {
                editorData.x = this.x;
                editorData.y = this.y;
                editorData.zoom = this.zoom;
            }
        }
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

    findNodeFromBlock(block: NodeMaterialBlock) {
        return this.nodes.filter(n => n.block === block)[0];
    }

    reset() {
        for (var node of this._nodes) {
            node.dispose();
        }
        

        this._nodes = [];
        this._links = [];
        this._graphCanvas.innerHTML = "";
        this._svgCanvas.innerHTML = "";
    }

    connectPorts(pointA: NodeMaterialConnectionPoint, pointB: NodeMaterialConnectionPoint) {
        var blockA = pointA.ownerBlock;
        var blockB = pointB.ownerBlock;
        var nodeA = this.findNodeFromBlock(blockA);
        var nodeB = this.findNodeFromBlock(blockB);

    }

    removeLink(link: NodeLink) {
        let index = this._links.indexOf(link);

        if (index > -1) {
            this._links.splice(index, 1);
        }

        link.dispose();
    }

    appendBlock(block: NodeMaterialBlock) {
        let newNode = new GraphNode(block, this.props.globalState, null);

        newNode.appendVisual(this._graphCanvas, this);

        this._nodes.push(newNode);

        return newNode;
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
        this._nodes.forEach(node => {


            graph.setNode(node.id.toString(), {
                id: node.id,
                type: "node",
                width: node.width,
                height: node.height
            });
        });

       
        this._nodes.forEach(node => {
            node.block.outputs.forEach(output => {
                if (!output.hasEndpoints) {
                    return;
                }

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
                for (var node of this._nodes) {
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
        this._hostCanvas = this.props.globalState.hostDocument.getElementById("graph-canvas") as HTMLDivElement;
        this._rootContainer = this.props.globalState.hostDocument.getElementById("graph-container") as HTMLDivElement;
        this._graphCanvas = this.props.globalState.hostDocument.getElementById("graph-canvas-container") as HTMLDivElement;
        this._svgCanvas = this.props.globalState.hostDocument.getElementById("graph-svg-container") as HTMLElement;        
        this._selectionContainer = this.props.globalState.hostDocument.getElementById("selection-container") as HTMLDivElement;   
        this._frameContainer = this.props.globalState.hostDocument.getElementById("frame-container") as HTMLDivElement;        
        
        this.gridSize = DataStorage.ReadNumber("GridSize", 20);
        this.updateTransform();
    }    

    onMove(evt: React.PointerEvent) {        
        // Selection box
        /*if (this._selectionBox) {
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

        // Candidate frame box
        if (this._frameCandidate) {
            const rootRect = this.canvasContainer.getBoundingClientRect();      

            const localX = evt.pageX - rootRect.left;
            const localY = evt.pageY - rootRect.top;

            if (localX > this._selectionStartX) {
                this._frameCandidate.style.left = `${this._selectionStartX / this.zoom}px`;
                this._frameCandidate.style.width = `${(localX - this._selectionStartX) / this.zoom}px`;
            } else {
                this._frameCandidate.style.left = `${localX / this.zoom}px`;
                this._frameCandidate.style.width = `${(this._selectionStartX - localX) / this.zoom}px`;
            }

            if (localY > this._selectionStartY) {                
                this._frameCandidate.style.top = `${this._selectionStartY / this.zoom}px`;
                this._frameCandidate.style.height = `${(localY - this._selectionStartY) / this.zoom}px`;
            } else {
                this._frameCandidate.style.top = `${localY / this.zoom}px`;
                this._frameCandidate.style.height = `${(this._selectionStartY - localY) / this.zoom}px`;
            }

            return;
        }        

        // Candidate link
        if (this._candidateLink) {        
            const rootRect = this.canvasContainer.getBoundingClientRect();       
            this._candidatePort = null; 
            this.props.globalState.onCandidateLinkMoved.notifyObservers(new Vector2(evt.pageX, evt.pageY));
            this._dropPointX = (evt.pageX - rootRect.left) / this.zoom;
            this._dropPointY = (evt.pageY - rootRect.top) / this.zoom;

            this._candidateLink.update(this._dropPointX, this._dropPointY, true);
            this._candidateLinkedHasMoved = true;
            
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

        // Move canvas
        this._rootContainer.style.cursor = "move";
        */
        if (this._mouseStartPointX != null && this._mouseStartPointY != null) {

        //this.x += evt.clientX - this._mouseStartPointX;
        //this.y += evt.clientY - this._mouseStartPointY;

        var x = this._mouseStartPointX;
        var y = this._mouseStartPointY;
        this._guiNodes.forEach(element => {
            element._onMove(new BABYLON.Vector2(evt.clientX, evt.clientY), 
            new BABYLON.Vector2( x, y));
        });

        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;

        //doing the dragging for the gui node.

     }
    }

    onDown(evt: React.PointerEvent<HTMLElement>) {
        this._rootContainer.setPointerCapture(evt.pointerId);

        // Selection?
        if (evt.currentTarget === this._hostCanvas && evt.ctrlKey) {
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
        }

        // Frame?
        if (evt.currentTarget === this._hostCanvas && evt.shiftKey) {
            this._frameCandidate = this.props.globalState.hostDocument.createElement("div");
            this._frameCandidate.classList.add("frame-box");
            this._frameContainer.appendChild(this._frameCandidate);

            const rootRect = this.canvasContainer.getBoundingClientRect();      
            this._selectionStartX = (evt.pageX - rootRect.left);
            this._selectionStartY = (evt.pageY - rootRect.top);
            this._frameCandidate.style.left = `${this._selectionStartX / this.zoom}px`;
            this._frameCandidate.style.top = `${this._selectionStartY / this.zoom}px`;
            this._frameCandidate.style.width = "0px";
            this._frameCandidate.style.height = "0px";
            return;
        }

        // Port dragging
        if (evt.nativeEvent.srcElement && (evt.nativeEvent.srcElement as HTMLElement).nodeName === "IMG") {
            if (!this._candidateLink) {
                let portElement = ((evt.nativeEvent.srcElement as HTMLElement).parentElement as any).port as NodePort;
                this._candidateLink = new NodeLink(this, portElement, portElement.node);
                this._candidateLinkedHasMoved = false;
            }  
            return;
        }

        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;        
    }

    onUp(evt: React.PointerEvent) {
        this._mouseStartPointX = null;
        this._mouseStartPointY = null;
        this._rootContainer.releasePointerCapture(evt.pointerId);   
        this._oldY = -1; 

        if (this._candidateLink) {       
            if (this._candidateLinkedHasMoved) {       
                this.props.globalState.onCandidateLinkMoved.notifyObservers(null);
            } else { // is a click event on NodePort
                if(this._candidateLink.portA instanceof FrameNodePort) { //only on Frame Node Ports
                    const port = this._candidateLink.portA;
                
                } else if(this._candidateLink.portA instanceof NodePort){
                    this.props.globalState.onSelectionChangedObservable.notifyObservers(this._candidateLink.portA );
                }
            }
            this._candidateLink.dispose();
            this._candidateLink = null;
            this._candidatePort = null;
        }

        if (this._selectionBox) {
           this._selectionBox.parentElement!.removeChild(this._selectionBox);
           this._selectionBox = null;
        }

        if (this._frameCandidate) {            


            this._frameCandidate.parentElement!.removeChild(this._frameCandidate);
            this._frameCandidate = null;

         }
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
        this._nodes.forEach(node => {

            if (node.x < minX) {
                minX = node.x;
            }
            if (node.y < minY) {
                minY = node.y;
            }
        });



        // Restore to 0

        this._nodes.forEach(node => {
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


    processEditorData(editorData: IEditorData) {


        this.x = editorData.x || 0;
        this.y = editorData.y || 0;
        this.zoom = editorData.zoom || 1;

        // Frames

    }


    createGUICanvas()
    {
        // Get the canvas element from the DOM.
        const canvas = document.getElementById("graph-canvas") as HTMLCanvasElement;

        // Associate a Babylon Engine to it.
        const engine = new BABYLON.Engine(canvas);
        
        // Create our first scene.
        var scene = new BABYLON.Scene(engine);
        // This creates and positions a free camera (non-mesh)
        var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
        
        // This targets the camera to scene origin
        camera.setTarget(BABYLON.Vector3.Zero());
        
        // This attaches the camera to the canvas
        camera.attachControl(true);
        
        // GUI
        this.globalState.guiTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        
        engine.runRenderLoop(() => {this.updateGUIs(); scene.render()});
    }
    

    public addNewButton()
    {
        if(!this.globalState.guiTexture)
        {
            this.createGUICanvas();
        }

        var button1 = BABYLON.GUI.Button.CreateSimpleButton("but1", "Click Me");
        button1.width = "150px"
        button1.height = "40px";
        button1.color = "#FFFFFFFF";
        button1.cornerRadius = 20;
        button1.background = "#138016FF";
        button1.onPointerUpObservable.add(function() {
        });

        var fakeNodeMaterialBlock = new NodeMaterialBlock("Button");
        var newGuiNode = new GraphNode(fakeNodeMaterialBlock, this.globalState, button1);
        newGuiNode.appendVisual(this._graphCanvas, this);
        this._guiNodes.push(newGuiNode);

        this.globalState.guiTexture.addControl(button1);    
    }

    public addNewSlider()
    {
        if(!this.globalState.guiTexture)
        {
            this.createGUICanvas();
        }

        var slider1 = new BABYLON.GUI.Slider("Slider");
        slider1.width = "150px"
        slider1.height = "40px";
        slider1.color = "#FFFFFFFF";
        slider1.background = "#138016FF";
        slider1.onPointerUpObservable.add(function() {
        });
        var fakeNodeMaterialBlock = new NodeMaterialBlock("Slider");
        var newGuiNode = new GraphNode(fakeNodeMaterialBlock, this.globalState, slider1);
        newGuiNode.appendVisual(this._graphCanvas, this);
        this._guiNodes.push(newGuiNode);

        this.globalState.guiTexture.addControl(slider1);    
    }


    //private _advancedTexture: BABYLON.GUI.AdvancedDynamicTexture;
    updateGUIs()
    {
        this._guiNodes.forEach(element => {
            element.updateVisual();
            
        });
    }
 
    render() {

        //var canv = new HTMLCanvasElement;
        var canv = <canvas id="graph-canvas" 
        onWheel={evt => this.onWheel(evt)}
        onPointerMove={evt => this.onMove(evt)}
        onPointerDown={evt =>  this.onDown(evt)}   
        onPointerUp={evt =>  this.onUp(evt)} 
        >   
        <div id="graph-container">
            <div id="graph-canvas-container">
                
            </div>     
            <div id="frame-container">                        
            </div>
            <svg id="graph-svg-container">
            </svg>                    
            <div id="selection-container">                        
            </div>
        </div>
        </canvas>

        return (
            canv
        );
    }
}
