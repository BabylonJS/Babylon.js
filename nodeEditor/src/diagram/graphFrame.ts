import { GraphNode } from './graphNode';
import { GraphCanvasComponent } from './graphCanvas';
import { Nullable } from 'babylonjs/types';
import { Observer, Observable } from 'babylonjs/Misc/observable';
import { NodeLink } from './nodeLink';
import { IFrameData } from '../nodeLocationInfo';
import { Color3 } from 'babylonjs/Maths/math.color';
import { NodePort } from './nodePort';
import { SerializationTools } from '../serializationTools';
import { StringTools } from '../stringTools';

export class GraphFrame {
    private readonly CollapsedWidth = 200;
    private static _FrameCounter = 0;
    private _name: string;
    private _color: Color3;
    private _x = 0;
    private _y = 0;
    private _gridAlignedX = 0;
    private _gridAlignedY = 0;    
    private _width: number;
    private _height: number;
    public element: HTMLDivElement;       
    private _borderElement: HTMLDivElement;    
    private _headerElement: HTMLDivElement;    
    private _headerTextElement: HTMLDivElement;        
    private _headerCollapseElement: HTMLDivElement;    
    private _headerCloseElement: HTMLDivElement;
    private _commentsElement: HTMLDivElement;    
    private _portContainer: HTMLDivElement;    
    private _outputPortContainer: HTMLDivElement;    
    private _inputPortContainer: HTMLDivElement;    
    private _nodes: GraphNode[] = [];
    private _ownerCanvas: GraphCanvasComponent;
    private _mouseStartPointX: Nullable<number> = null;
    private _mouseStartPointY: Nullable<number> = null;
    private _onSelectionChangedObserver: Nullable<Observer<Nullable<GraphNode | NodeLink | GraphFrame>>>;   
    private _isCollapsed = false;
    private _ports: NodePort[] = [];
    private _controlledPorts: NodePort[] = [];
    private _id: number;
    private _comments: string;

    public onExpandStateChanged = new Observable<GraphFrame>();

    private readonly CloseSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><g id="Layer_2" data-name="Layer 2"><path d="M16,15l5.85,5.84-1,1L15,15.93,9.15,21.78l-1-1L14,15,8.19,9.12l1-1L15,14l5.84-5.84,1,1Z"/></g></svg>`;
    private readonly ExpandSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><g id="Layer_2" data-name="Layer 2"><path d="M22.31,7.69V22.31H7.69V7.69ZM21.19,8.81H8.81V21.19H21.19Zm-6.75,6.75H11.06V14.44h3.38V11.06h1.12v3.38h3.38v1.12H15.56v3.38H14.44Z"/></g></svg>`;
    private readonly CollapseSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><g id="Layer_2" data-name="Layer 2"><path d="M22.31,7.69V22.31H7.69V7.69ZM21.19,8.81H8.81V21.19H21.19Zm-2.25,6.75H11.06V14.44h7.88Z"/></g></svg>`;

    public get id() {
        return this._id;
    }

    public get isCollapsed() {
        return this._isCollapsed;
    }

    private _createInputPort(port: NodePort, node: GraphNode) {
        let localPort = NodePort.CreatePortElement(port.connectionPoint, node, this._inputPortContainer, null, this._ownerCanvas.globalState)
        this._ports.push(localPort);

        port.delegatedPort = localPort;
        this._controlledPorts.push(port);
    }
   
    public set isCollapsed(value: boolean) {
        if (this._isCollapsed === value) {
            return;
        }

        this._isCollapsed = value;
        this._ownerCanvas._frameIsMoving = true;

        // Need to delegate the outside ports to the frame
        if (value) {
            this.element.classList.add("collapsed");
                        
            this._moveFrame((this.width - this.CollapsedWidth) / 2, 0);

            for (var node of this._nodes) {
                node.isVisible = false;
                for (var port of node.outputPorts) { // Output
                    if (port.connectionPoint.hasEndpoints) {
                        let portAdded = false;

                        for (var link of node.links) {
                            if (link.portA === port && this.nodes.indexOf(link.nodeB!) === -1) {
                                let localPort: NodePort;

                                if (!portAdded) {
                                    portAdded = true;
                                    localPort = NodePort.CreatePortElement(port.connectionPoint, link.nodeB!, this._outputPortContainer, null, this._ownerCanvas.globalState);
                                    this._ports.push(localPort);
                                } else {
                                    localPort = this._ports.filter(p => p.connectionPoint === port.connectionPoint)[0];
                                }

                                port.delegatedPort = localPort;
                                this._controlledPorts.push(port);
                                link.isVisible = true;
                            }
                        }
                    } else {
                        let localPort = NodePort.CreatePortElement(port.connectionPoint, node, this._outputPortContainer, null, this._ownerCanvas.globalState)
                        this._ports.push(localPort);
                        port.delegatedPort = localPort;
                        this._controlledPorts.push(port);
                    }
                }

                for (var port of node.inputPorts) { // Input
                    if (port.connectionPoint.isConnected) {
                        for (var link of node.links) {
                            if (link.portB === port && this.nodes.indexOf(link.nodeA) === -1) {
                                this._createInputPort(port, node);
                                link.isVisible = true;
                            }
                        }
                    } else {
                        this._createInputPort(port, node);
                    }
                }               
            }
        } else {
            this.element.classList.remove("collapsed");
            this._outputPortContainer.innerHTML = "";
            this._inputPortContainer.innerHTML = "";

            this._ports.forEach(p => {
                p.dispose();
            });

            this._controlledPorts.forEach(port => {
                port.delegatedPort = null;
                port.refresh();
            })

            this._ports = [];
            this._controlledPorts = [];

            for (var node of this._nodes) {
                node.isVisible = true;
            }
                        
            this._moveFrame(-(this.width - this.CollapsedWidth) / 2, 0);
        }

        this.cleanAccumulation();
        this._ownerCanvas._frameIsMoving = false;

        // UI        
        if (this._isCollapsed) {                
            this._headerCollapseElement.innerHTML = this.ExpandSVG;
            this._headerCollapseElement.title = "Expand";   
        } else {
            this._headerCollapseElement.innerHTML = this.CollapseSVG;
            this._headerCollapseElement.title = "Collapse";   
        }

        this.onExpandStateChanged.notifyObservers(this);
    }

    public get nodes() {
        return this._nodes;
    }

    public get name() {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
        this._headerTextElement.innerHTML = value;
    }

    public get color() {
        return this._color;
    }

    public set color(value: Color3) {
        this._color = value;
        this._headerElement.style.background = `rgba(${value.r * 255}, ${value.g * 255}, ${value.b * 255}, 1)`;
        this._headerElement.style.borderColor = `rgba(${value.r * 255}, ${value.g * 255}, ${value.b * 255}, 1)`;
        this.element.style.background = `rgba(${value.r * 255}, ${value.g * 255}, ${value.b * 255}, 0.7)`;
    }    

    public get x() {
        return this._x;
    }

    public set x(value: number) {
        if (this._x === value) {
            return;
        }
        this._x = value;
        
        this._gridAlignedX = this._ownerCanvas.getGridPosition(value);
        this.element.style.left = `${this._gridAlignedX}px`;
    }

    public get y() {
        return this._y;
    }

    public set y(value: number) {
        if (this._y === value) {
            return;
        }

        this._y = value;

        this._gridAlignedY = this._ownerCanvas.getGridPosition(value);
        this.element.style.top = `${this._gridAlignedY}px`;
    }   
    
    public get width() {
        return this._width;
    }

    public set width(value: number) {
        if (this._width === value) {
            return;
        }
        this._width = value;
        
        var gridAlignedRight = this._ownerCanvas.getGridPositionCeil(value + this._gridAlignedX);

        this.element.style.width = `${gridAlignedRight - this._gridAlignedX}px`;
    }

    public get height() {
        return this._height;
    }

    public set height(value: number) {
        if (this._height === value) {
            return;
        }
        this._height = value;
        
        var gridAlignedBottom = this._ownerCanvas.getGridPositionCeil(value + this._gridAlignedY);

        this.element.style.height = `${gridAlignedBottom - this._gridAlignedY}px`;
    }

    public get comments(): string {
        return this._comments;
    }

    public set comments(comments: string) {
        if (comments && comments.length > 0) {
            this.element.style.gridTemplateRows = "40px 40px calc(100% - 80px)";
            this._borderElement.style.gridRow = "1 / span 3";
            this._portContainer.style.gridRow = "3";
            this._commentsElement.style.display = "grid";
            this._commentsElement.style.gridRow = "2";
            this._commentsElement.style.gridColumn = "1";
            this._commentsElement.style.paddingLeft = "10px";
            this._commentsElement.innerText = comments;
        }
        this._comments = comments;
    }

    public constructor(candidate: Nullable<HTMLDivElement>, canvas: GraphCanvasComponent, doNotCaptureNodes = false) {
        this._id = GraphFrame._FrameCounter++;

        this._ownerCanvas = canvas;
        const root = canvas.frameContainer;
        this.element = root.ownerDocument!.createElement("div");        
        this.element.classList.add("frame-box");
        root.appendChild(this.element);

        this._headerElement = root.ownerDocument!.createElement("div");  
        this._headerElement.classList.add("frame-box-header");
        this._headerElement.addEventListener("dblclick", () => {
            this.isCollapsed = !this.isCollapsed;
        });
        this.element.appendChild(this._headerElement);

        this._borderElement = root.ownerDocument!.createElement("div");  
        this._borderElement.classList.add("frame-box-border");
        this.element.appendChild(this._borderElement);

        this._headerTextElement = root.ownerDocument!.createElement("div"); 
        this._headerTextElement.classList.add("frame-box-header-title");
        this._headerElement.appendChild(this._headerTextElement);

        this._headerCollapseElement = root.ownerDocument!.createElement("div"); 
        this._headerCollapseElement.classList.add("frame-box-header-collapse");   
        this._headerCollapseElement.classList.add("frame-box-header-button");  
        this._headerCollapseElement.title = "Collapse";   
        this._headerCollapseElement.ondragstart= () => false;
        this._headerCollapseElement.addEventListener("pointerdown", (evt) => {
            this._headerCollapseElement.classList.add("down");
            evt.stopPropagation();
        });
        this._headerCollapseElement.addEventListener("pointerup", (evt) => {            
            evt.stopPropagation();
            this._headerCollapseElement.classList.remove("down");
            this.isCollapsed = !this.isCollapsed;
        });
        this._headerCollapseElement.innerHTML = this.CollapseSVG;
        this._headerElement.appendChild(this._headerCollapseElement);

        this._headerCloseElement = root.ownerDocument!.createElement("div"); 
        this._headerCloseElement.classList.add("frame-box-header-close");
        this._headerCloseElement.classList.add("frame-box-header-button");
        this._headerCloseElement.title = "Close";
        this._headerCloseElement.ondragstart= () => false;
        this._headerCloseElement.addEventListener("pointerdown", (evt) => {
            evt.stopPropagation();
        });
        this._headerCloseElement.addEventListener("pointerup", (evt) => {
            evt.stopPropagation();
            this.dispose();
        });
        this._headerCloseElement.innerHTML = this.CloseSVG;
        this._headerElement.appendChild(this._headerCloseElement);

        this._portContainer = root.ownerDocument!.createElement("div");  
        this._portContainer.classList.add("port-container");
        this.element.appendChild(this._portContainer);

        this._outputPortContainer = root.ownerDocument!.createElement("div");  
        this._outputPortContainer.classList.add("outputsContainer");
        this._portContainer.appendChild(this._outputPortContainer);

        this._inputPortContainer = root.ownerDocument!.createElement("div");  
        this._inputPortContainer.classList.add("inputsContainer");
        this._portContainer.appendChild(this._inputPortContainer);

        this.name = "Frame";
        this.color = Color3.FromInts(72, 72, 72);

        if (candidate) {
            this.x = parseFloat(candidate.style.left!.replace("px", ""));
            this.y = parseFloat(candidate.style.top!.replace("px", ""));
            this.width = parseFloat(candidate.style.width!.replace("px", ""));
            this.height = parseFloat(candidate.style.height!.replace("px", ""));

            this.cleanAccumulation();        
        }
        
        this._headerTextElement.addEventListener("pointerdown", evt => this._onDown(evt));
        this._headerTextElement.addEventListener("pointerup", evt => this._onUp(evt));
        this._headerTextElement.addEventListener("pointermove", evt => this._onMove(evt));

        this._onSelectionChangedObserver = canvas.globalState.onSelectionChangedObservable.add(node => {
            if (node === this) {
                this.element.classList.add("selected");
            } else {
                this.element.classList.remove("selected");
            }
        }); 

        this._commentsElement = document.createElement('div');
        this._commentsElement.className = 'frame-comments';
        this._commentsElement.style.color = 'white';
        this._commentsElement.style.fontSize = '16px';
        
        this.element.appendChild(this._commentsElement);

        // Get nodes
        if (!doNotCaptureNodes) {
            this.refresh();
        }
    }

    public refresh() {
        this._nodes = [];
        this._ownerCanvas.globalState.onFrameCreated.notifyObservers(this);
    }

    public addNode(node: GraphNode) {
        let index = this.nodes.indexOf(node);

        if (index === -1) {
            this.nodes.push(node);
        }
    }

    public removeNode(node: GraphNode) {
        let index = this.nodes.indexOf(node);

        if (index > -1) {
            this.nodes.splice(index, 1);
        }
    }

    public syncNode(node: GraphNode) {
        if (this.isCollapsed) {
            return;
        }

        if (node.isOverlappingFrame(this)) {
            this.addNode(node);
        } else {
            this.removeNode(node);
        }
    }

    public cleanAccumulation() {    
        for (var selectedNode of this._nodes) {
            selectedNode.cleanAccumulation();
        }   

        this.x = this._ownerCanvas.getGridPosition(this.x);
        this.y = this._ownerCanvas.getGridPosition(this.y);   
    }

    private _onDown(evt: PointerEvent) {
        evt.stopPropagation();

        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;        
        
        this._headerTextElement.setPointerCapture(evt.pointerId);
        this._ownerCanvas.globalState.onSelectionChangedObservable.notifyObservers(this);

        this._ownerCanvas._frameIsMoving = true;

        this.move(this._ownerCanvas.getGridPosition(this.x), this._ownerCanvas.getGridPosition(this.y))
    }    

    public move(newX: number, newY: number, align = true) {
        let oldX = this.x;
        let oldY = this.y;

        this.x = newX;
        this.y = newY; 

        for (var selectedNode of this._nodes) {
            selectedNode.x += this.x - oldX;
            selectedNode.y += this.y - oldY;
            if (align) {
                selectedNode.cleanAccumulation(true);
            }
        }
    }

    private _onUp(evt: PointerEvent) {
        evt.stopPropagation();

        this.cleanAccumulation();
        this._mouseStartPointX = null;
        this._mouseStartPointY = null;
        this._headerTextElement.releasePointerCapture(evt.pointerId);

        this._ownerCanvas._frameIsMoving = false;
    }

    private _moveFrame(offsetX: number, offsetY: number) {
        this.x += offsetX;
        this.y += offsetY;

        for (var selectedNode of this._nodes) {
            selectedNode.x += offsetX;
            selectedNode.y += offsetY;
        }
    }

    private _onMove(evt: PointerEvent) {
        if (this._mouseStartPointX === null || this._mouseStartPointY === null || evt.ctrlKey) {
            return;
        }

        let newX = (evt.clientX - this._mouseStartPointX) / this._ownerCanvas.zoom;
        let newY = (evt.clientY - this._mouseStartPointY) / this._ownerCanvas.zoom;

        this._moveFrame(newX, newY);

        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY; 

        evt.stopPropagation();
    }

    public dispose() {
        this.isCollapsed = false;

        if (this._onSelectionChangedObserver) {
            this._ownerCanvas.globalState.onSelectionChangedObservable.remove(this._onSelectionChangedObserver);
        }

        this.element.parentElement!.removeChild(this.element);
        
        this._ownerCanvas.frames.splice(this._ownerCanvas.frames.indexOf(this), 1);

        this.onExpandStateChanged.clear();
    }

    public serialize(): IFrameData {
        return {
            x: this._x,
            y: this._y,
            width: this._width,
            height: this._height,
            color: this._color.asArray(),
            name: this.name,
            isCollapsed: this.isCollapsed,
            blocks: this.nodes.map(n => n.block.uniqueId),
            comments: this._comments
        }
    }

    public export() {
        const state = this._ownerCanvas.globalState;
        const json = SerializationTools.Serialize(state.nodeMaterial, state, this.nodes.map(n => n.block));
        StringTools.DownloadAsFile(state.hostDocument, json, this._name + ".json");
    }

    public static Parse(serializationData: IFrameData, canvas: GraphCanvasComponent, map?: {[key: number]: number}) {
        let newFrame = new GraphFrame(null, canvas, true);
        const isCollapsed = !!serializationData.isCollapsed;

        newFrame.x = serializationData.x;
        newFrame.y = serializationData.y;
        newFrame.width = serializationData.width;
        newFrame.height = serializationData.height;
        newFrame.name = serializationData.name;
        newFrame.color = Color3.FromArray(serializationData.color);
        newFrame.comments = serializationData.comments;

        if (serializationData.blocks && map) {
            for (var blockId of serializationData.blocks) {
                let actualId = map[blockId];
                let node = canvas.nodes.filter(n => n.block.uniqueId === actualId);

                if (node.length) {
                    newFrame.nodes.push(node[0]);
                }
            }
        } else {
            newFrame.refresh();
        }

        newFrame.isCollapsed = isCollapsed;

        if (isCollapsed) {
            canvas._frameIsMoving = true;
            newFrame._moveFrame(-(newFrame.width - newFrame.CollapsedWidth) / 2, 0);
            let diff = serializationData.x - newFrame.x;
            newFrame._moveFrame(diff, 0);
            newFrame.cleanAccumulation();
            
            for (var selectedNode of newFrame.nodes) {
                selectedNode.refresh();
            }
            canvas._frameIsMoving = false;
        }

        return newFrame;
    }
}