import { GraphNode } from './graphNode';
import { GraphCanvasComponent, FramePortData } from './graphCanvas';
import { Nullable } from 'babylonjs/types';
import { Observer, Observable } from 'babylonjs/Misc/observable';
import { NodeLink } from './nodeLink';
import { IFrameData } from '../nodeLocationInfo';
import { Color3 } from 'babylonjs/Maths/math.color';
import { NodePort } from './nodePort';
import { SerializationTools } from '../serializationTools';
import { StringTools } from '../stringTools';
import { FrameNodePort } from './frameNodePort';

enum ResizingDirection {
        Right,
        Left,
        Top,
        Bottom,
        TopRight,
        TopLeft,
        BottomRight,
        BottomLeft
}

export enum FramePortPosition {
    Top, Middle, Bottom
};

export class GraphFrame {
    private readonly CollapsedWidth = 200;
    private static _FrameCounter = 0;
    private static _FramePortCounter = 0;
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
    private _onSelectionChangedObserver: Nullable<Observer<Nullable<GraphFrame | GraphNode | NodeLink | NodePort | FramePortData>>>;
    private _onGraphNodeRemovalObserver: Nullable<Observer<GraphNode>>; 
    private _onExposePortOnFrameObserver: Nullable<Observer<GraphNode>>;
    private _onNodeLinkDisposedObservers: Nullable<Observer<NodeLink>>[] = [];
    private _isCollapsed = false;
    private _frameInPorts: FrameNodePort[] = [];
    private _frameOutPorts: FrameNodePort[] = [];
    private _controlledPorts: NodePort[] = []; // Ports on Nodes that are shown on outside of frame
    private _id: number;
    private _comments: string;
    private _frameIsResizing: boolean;
    private _resizingDirection: Nullable<ResizingDirection>;
    private _minFrameHeight = 40;
    private _minFrameWidth = 220;
    private mouseXLimit: Nullable<number>;

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
        let localPort = FrameNodePort.CreateFrameNodePortElement(port.connectionPoint, node, this._inputPortContainer, null, this._ownerCanvas.globalState, true, GraphFrame._FramePortCounter++, this.id);
        this._frameInPorts.push(localPort);

        port.delegatedPort = localPort;
        this._controlledPorts.push(port);
    }

    // Mark ports with FramePortPosition for re-arrangement support
    private _markFramePortPositions() {
        // mark FrameInPorts 
         if(this._frameInPorts.length == 2){
            this._frameInPorts[0].framePortPosition = FramePortPosition.Top;
            this._frameInPorts[1].framePortPosition = FramePortPosition.Bottom;
        } else {
            for(let i = 0; i < this._frameInPorts.length; i++) {
                const port = this._frameInPorts[i];
                if(i === 0){
                    port.framePortPosition = FramePortPosition.Top;
                } else if(i === this._frameInPorts.length -1){
                    port.framePortPosition = FramePortPosition.Bottom;
                } else {
                    port.framePortPosition = FramePortPosition.Middle;
                }
            }
        }

        // mark FrameOutPorts
        if(this._frameOutPorts.length == 2){
            this._frameOutPorts[0].framePortPosition = FramePortPosition.Top;
            this._frameOutPorts[1].framePortPosition = FramePortPosition.Bottom;
        } else {
            for(let i = 0; i < this._frameOutPorts.length; i++) {
                const port = this._frameOutPorts[i];
                if(i === 0){
                    port.framePortPosition = FramePortPosition.Top
                } else if(i === this._frameInPorts.length -1){
                    port.framePortPosition = FramePortPosition.Bottom
                } else {
                    port.framePortPosition = FramePortPosition.Middle
                }
            }
        }
    }

    private _createFramePorts() {
        for (var node of this._nodes) {
            node.isVisible = false;
            for (var port of node.outputPorts) { // Output
                if (port.connectionPoint.hasEndpoints) {
                    let portAdded = false;

                    for (var link of node.links) {
                        if (link.portA === port && this.nodes.indexOf(link.nodeB!) === -1 || (link.portA === port && port.exposedOnFrame)) {
                            let localPort: FrameNodePort;

                            if (!portAdded) {
                                portAdded = true;
                                localPort = FrameNodePort.CreateFrameNodePortElement(port.connectionPoint, link.nodeA!, this._outputPortContainer, null, this._ownerCanvas.globalState, false, GraphFrame._FramePortCounter++, this.id);
                                this._frameOutPorts.push(localPort);

                                link.isVisible = true;

                                const onLinkDisposedObserver = link.onDisposedObservable.add((nodeLink: NodeLink) => {
                                    this._redrawFramePorts();
                                });

                                this._onNodeLinkDisposedObservers.push(onLinkDisposedObserver); 

                            } else if (this.nodes.indexOf(link.nodeB!) === -1) {
                                link.isVisible = true;
                                localPort = this.ports.filter(p => p.connectionPoint === port.connectionPoint)[0];
                            } else {
                                localPort = this.ports.filter(p => p.connectionPoint === port.connectionPoint)[0];
                            }

                            port.delegatedPort = localPort;
                            this._controlledPorts.push(port);
                        }
                    }
                } else if(port.exposedOnFrame) {
                    let localPort = FrameNodePort.CreateFrameNodePortElement(port.connectionPoint, node, this._outputPortContainer, null, this._ownerCanvas.globalState, false, GraphFrame._FramePortCounter++, this.id);
                    this._frameOutPorts.push(localPort);
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
                            
                            const onLinkDisposedObserver = link.onDisposedObservable.add((nodeLink: NodeLink) => {
                                this._redrawFramePorts();
                            });

                            this._onNodeLinkDisposedObservers.push(onLinkDisposedObserver);
                        }
                    }
                } else if(port.exposedOnFrame) {
                    this._createInputPort(port, node);
                }
            }
        }
    }
    
    private _redrawFramePorts() {
        if(!this.isCollapsed) {
            return;
        }

        this._outputPortContainer.innerHTML = "";
        this._inputPortContainer.innerHTML = "";
        this.ports.forEach((framePort:FrameNodePort) => {
            framePort.dispose();
        });

        this._controlledPorts.forEach(port => {
            port.delegatedPort = null;
            port.refresh();
        })

        this._frameInPorts = [];
        this._frameOutPorts = [];
        this._controlledPorts = [];

        this._createFramePorts();
        this.ports.forEach((framePort: FrameNodePort) => framePort.node._refreshLinks());
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

            this._createFramePorts()

            this._markFramePortPositions()

        } else {
            this.element.classList.remove("collapsed");
            this._outputPortContainer.innerHTML = "";
            this._inputPortContainer.innerHTML = "";

            this._frameInPorts.forEach(p => {
                p.dispose();
            });

            this._frameOutPorts.forEach(p => {
                p.dispose();
            });

            this._controlledPorts.forEach(port => {
                port.delegatedPort = null;
                port.refresh();
            })

            this._frameInPorts = [];
            this._frameOutPorts = [];
            this._controlledPorts = [];
            this._onNodeLinkDisposedObservers = [];

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

    public get ports(){
        return this._frameInPorts.concat(this._frameOutPorts);
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
        let viableWidth = value > this._minFrameWidth ? value : this._minFrameWidth;
        this._width = viableWidth;
        
        var gridAlignedRight = this._ownerCanvas.getGridPositionCeil(viableWidth + this._gridAlignedX);

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
        if (comments && !this._comments && comments.length > 0) {
            this.element.style.gridTemplateRows = "40px min-content 1fr";
            this._borderElement.style.gridRow = "1 / span 3";
            this._portContainer.style.gridRow = "3";
            this._commentsElement.classList.add("has-comments");
        } else if (!comments) {
            this.element.style.gridTemplateRows = "40px calc(100% - 40px)";
            this._borderElement.style.gridRow = "1 / span 2";
            this._portContainer.style.gridRow = "2";
            this._commentsElement.classList.remove('has-comments');
        }

        if (comments === "" || (comments && comments.length >= 0)) {
            (this._commentsElement.children[0] as HTMLSpanElement).innerText = comments;
        }
        this.height = this._borderElement.offsetHeight;
        this._comments = comments;
        this.updateMinHeightWithComments();
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

        // add resizing side handles

        const rightHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        rightHandle.className = "handle right-handle";
        this.element.appendChild(rightHandle);
        rightHandle.addEventListener("pointerdown", this._onRightHandlePointerDown);

        const leftHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        leftHandle.className = "handle left-handle";
        this.element.appendChild(leftHandle);
        leftHandle.addEventListener("pointerdown", this._onLeftHandlePointerDown);

        const bottomHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        bottomHandle.className = "handle bottom-handle";
        this.element.appendChild(bottomHandle);
        bottomHandle.addEventListener("pointerdown", this._onBottomHandlePointerDown);

        const topHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        topHandle.className = "handle top-handle";
        this.element.appendChild(topHandle);
        topHandle.addEventListener("pointerdown", this._onTopHandlePointerDown);

        const topRightCornerHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        topRightCornerHandle.className = "handle right-handle top-right-corner-handle";
        this.element.appendChild(topRightCornerHandle);
        topRightCornerHandle.addEventListener("pointerdown", this._onTopRightHandlePointerDown);

        const bottomRightCornerHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        bottomRightCornerHandle.className = "handle right-handle bottom-right-corner-handle";
        this.element.appendChild(bottomRightCornerHandle);
        bottomRightCornerHandle.addEventListener("pointerdown", this._onBottomRightHandlePointerDown);

        const topLeftCornerHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        topLeftCornerHandle.className = "handle left-handle top-left-corner-handle";
        this.element.appendChild(topLeftCornerHandle);
        topLeftCornerHandle.addEventListener("pointerdown", this._onTopLeftHandlePointerDown);

        const bottomLeftCornerHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        bottomLeftCornerHandle.className = "handle left-handle bottom-left-corner-handle";
        this.element.appendChild(bottomLeftCornerHandle);
        bottomLeftCornerHandle.addEventListener("pointerdown", this._onBottomLeftHandlePointerDown);

        // add header elements

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

        this._onGraphNodeRemovalObserver = canvas.globalState.onGraphNodeRemovalObservable.add((node: GraphNode) => {
            // remove node from this._nodes
            const index = this._nodes.indexOf(node);
            if (index === -1) {
                return;
            } else {
                node.enclosingFrameId = -1;
                this._nodes.splice(index, 1);
            }
        });

        this._onExposePortOnFrameObserver = canvas.globalState.onExposePortOnFrameObservable.add((node: GraphNode) => {
            if (this.nodes.indexOf(node) === -1) {
                return;
            }
            this._redrawFramePorts();
        });

        this._commentsElement = document.createElement('div');
        this._commentsElement.className = 'frame-comments';
        this._commentsElement.style.color = 'white';
        this._commentsElement.style.fontSize = '16px';
        let commentSpan = document.createElement('span');
        commentSpan.className = "frame-comment-span"
        this._commentsElement.appendChild(commentSpan)

        this.element.appendChild(this._commentsElement);

        // Get nodes
        if (!doNotCaptureNodes) {
            this.refresh();
        }
    }

    public refresh() {
        this._nodes = [];
        this._ownerCanvas.globalState.onFrameCreatedObservable.notifyObservers(this);
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
            node.enclosingFrameId = -1;
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
        if (this._mouseStartPointX === null || this._mouseStartPointY === null || evt.ctrlKey || this._frameIsResizing) {
            return;
        }

        let newX = (evt.clientX - this._mouseStartPointX) / this._ownerCanvas.zoom;
        let newY = (evt.clientY - this._mouseStartPointY) / this._ownerCanvas.zoom;

        this._moveFrame(newX, newY);

        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;

        evt.stopPropagation();
    }

    public moveFramePortUp(nodePort: FrameNodePort){
        let elementsArray: ChildNode[];
        if(nodePort.isInput) {
            if(this._inputPortContainer.children.length < 2) {
                return;
            }
            elementsArray = Array.from(this._inputPortContainer.childNodes);
            this._movePortUp(elementsArray, nodePort, this._frameInPorts);
        } else {
            if(this._outputPortContainer.children.length < 2) {
                return;
            }
            elementsArray = Array.from(this._outputPortContainer.childNodes);
            this._movePortUp(elementsArray, nodePort, this._frameOutPorts);
        }
        this.ports.forEach((framePort: FrameNodePort) => framePort.node._refreshLinks());
    }

    private _movePortUp(elementsArray: ChildNode[], nodePort: FrameNodePort, framePortList: FrameNodePort[]) {
        // update UI
        const indexInElementArray = (elementsArray as HTMLElement[]).findIndex(elem => elem.dataset.framePortId === `${nodePort.framePortId}`)
        if(indexInElementArray === 0){
            return;
        }
        const secondPortElement = elementsArray[indexInElementArray];
        const firstPortElement =  elementsArray[indexInElementArray -1];
        firstPortElement.parentElement?.insertBefore(secondPortElement, firstPortElement);

        // update Frame Port Container
        const indexInContainer = framePortList.findIndex(framePort => framePort === nodePort);
        [framePortList[indexInContainer -1], framePortList[indexInContainer]] = [framePortList[indexInContainer], framePortList[indexInContainer -1]]; // swap idicies
        
        //special case framePortList.length == 2
        if(framePortList.length == 2) {
            framePortList[1].framePortPosition = FramePortPosition.Bottom;
            framePortList[0].framePortPosition = FramePortPosition.Top;
        } else {
            // notify nodePort if it is now at Top (indexInElementArray === 1)
            if (indexInElementArray === 1) {
                framePortList[1].framePortPosition = FramePortPosition.Middle;
                framePortList[0].framePortPosition = FramePortPosition.Top;
            } else if(indexInContainer === elementsArray.length-1) {
                framePortList[framePortList.length -1].framePortPosition = FramePortPosition.Bottom;
                framePortList[framePortList.length -2].framePortPosition = FramePortPosition.Middle;
            } else {
                nodePort.framePortPosition = FramePortPosition.Middle;
            }
        }
    }
    
    public moveFramePortDown(nodePort: FrameNodePort){
        let elementsArray: ChildNode[];
        if(nodePort.isInput) {
            if(this._inputPortContainer.children.length < 2) {
                return;
            }
            elementsArray = Array.from(this._inputPortContainer.childNodes);
            this._movePortDown(elementsArray, nodePort, this._frameInPorts);
        } else {
            if(this._outputPortContainer.children.length < 2) {
                return;
            }
            elementsArray = Array.from(this._outputPortContainer.childNodes);
            this._movePortDown(elementsArray, nodePort, this._frameOutPorts);
        }

        this.ports.forEach((framePort: FrameNodePort) => framePort.node._refreshLinks());
    }

    private _movePortDown(elementsArray: ChildNode[], nodePort: FrameNodePort, framePortList: FrameNodePort[]) {
        // update UI
        const indexInElementArray = (elementsArray as HTMLElement[]).findIndex(elem => elem.dataset.framePortId === `${nodePort.framePortId}`)
        if(indexInElementArray === elementsArray.length -1){
            return;
        }
        const firstPort = elementsArray[indexInElementArray];
        const secondPort =  elementsArray[indexInElementArray + 1];
        firstPort.parentElement?.insertBefore(secondPort, firstPort);

        // update Frame Port Container
        const indexInContainer = framePortList.findIndex(framePort => framePort === nodePort);
        [framePortList[indexInContainer], framePortList[indexInContainer + 1]] = [framePortList[indexInContainer + 1], framePortList[indexInContainer]]; // swap idicies

        // notify nodePort if it is now at bottom (indexInContainer === elementsArray.length-2)
        if(framePortList.length == 2) {
            framePortList[0].framePortPosition = FramePortPosition.Top;
            framePortList[1].framePortPosition = FramePortPosition.Bottom;
        } else {
            if(indexInContainer === elementsArray.length-2) {
                framePortList[elementsArray.length-2].framePortPosition = FramePortPosition.Middle;
                framePortList[elementsArray.length-1].framePortPosition = FramePortPosition.Bottom;
            } else if(indexInContainer === 0){
                framePortList[0].framePortPosition = FramePortPosition.Top;
                framePortList[1].framePortPosition = FramePortPosition.Middle;
            } else {
                nodePort.framePortPosition = FramePortPosition.Middle;
            }
         }
    }

    private initResizing = (evt: PointerEvent) => {
        evt.stopPropagation();
        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;
        this._frameIsResizing = true;
    }

    private cleanUpResizing = (evt: PointerEvent) => {
        evt.stopPropagation();
        this._frameIsResizing = false;
        this._resizingDirection = null;
        this._mouseStartPointX = null;
        this._mouseStartPointY = null;
        this.mouseXLimit = null;
        this.refresh();
    }

    private updateMinHeightWithComments = () => {
        if (this.comments && this.comments.length > 0) {
            const minFrameHeightWithComments = this._commentsElement.offsetHeight + 40;
            this._minFrameHeight = minFrameHeightWithComments;
        }
    }

    private _isResizingTop(){
        return this._resizingDirection === ResizingDirection.Top || this._resizingDirection === ResizingDirection.TopRight || this._resizingDirection === ResizingDirection.TopLeft;
    }

    private _isResizingRight(){
        return this._resizingDirection === ResizingDirection.Right || this._resizingDirection === ResizingDirection.TopRight || this._resizingDirection === ResizingDirection.BottomRight;
    }

    private _isResizingBottom(){
        return this._resizingDirection === ResizingDirection.Bottom || this._resizingDirection === ResizingDirection.BottomLeft || this._resizingDirection === ResizingDirection.BottomRight;
    }

    private _isResizingLeft() {
        return this._resizingDirection === ResizingDirection.Left || this._resizingDirection === ResizingDirection.TopLeft || this._resizingDirection === ResizingDirection.BottomLeft;
    }

    private _onRightHandlePointerDown = (evt: PointerEvent) => {
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (_this.isCollapsed) {
            return;
        }
        this.initResizing(evt);
        _this._resizingDirection = ResizingDirection.Right;
        _this.mouseXLimit = evt.clientX - (_this.width - _this._minFrameWidth);
        _this._ownerCanvas.hostCanvas.addEventListener("pointerup", _this._onRightHandlePointerUp);
        _this._ownerCanvas.hostCanvas.addEventListener("pointermove", _this._onRightHandlePointerMove);
    }

    private _onRightHandlePointerMove = (evt: PointerEvent) => {
        const slack = (this.element.offsetWidth - this._minFrameWidth) * this._ownerCanvas.zoom;
        const xLimit = (this._mouseStartPointX as number) - slack;
        this._moveRightHandle(evt, xLimit);
    }

    private _moveRightHandle = (evt: PointerEvent, xLimit: number) => {
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (_this.mouseXLimit) {
            if (!_this._isResizingRight() || _this._mouseStartPointX === null || _this._mouseStartPointY === null || evt.clientX < xLimit) {
                return;
            }
            if (_this._isResizingRight()) {
                evt.stopPropagation();
                const distanceMouseMoved = (evt.clientX - _this._mouseStartPointX) / _this._ownerCanvas.zoom;
                _this._expandRight(distanceMouseMoved, evt.clientX);
                _this._mouseStartPointX =  evt.clientX;
            }
        }
    }

    private _onRightHandlePointerUp = (evt: PointerEvent) => {
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (_this._isResizingRight()) {
            _this.width = parseFloat(_this.element.style.width.replace("px", ""));
            _this._ownerCanvas.hostCanvas.removeEventListener("pointerup", _this._onRightHandlePointerUp);
            _this._ownerCanvas.hostCanvas.removeEventListener("pointermove", _this._onRightHandlePointerMove);
            _this.cleanUpResizing(evt);
        }
    }

    private _onBottomHandlePointerDown = (evt: PointerEvent) => {
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
            if (_this.isCollapsed) {
                return;
            }
        _this.initResizing(evt);
        _this._resizingDirection = ResizingDirection.Bottom;
        _this._ownerCanvas.hostCanvas.addEventListener("pointermove", _this._onBottomHandlePointerMove);
        _this._ownerCanvas.hostCanvas.addEventListener("pointerup", _this._onBottomHandlePointerUp);
    }

    private _onBottomHandlePointerMove = (evt: PointerEvent) => {
        const slack = (this.element.offsetHeight - this._minFrameHeight) * this._ownerCanvas.zoom;
        const yLimit = (this._mouseStartPointY as number) - slack;
        this._moveBottomHandle(evt, yLimit);
    }

    private _moveBottomHandle = (evt: PointerEvent, yLimit: number) => {
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (_this._resizingDirection !== ResizingDirection.Bottom || _this._mouseStartPointX === null || _this._mouseStartPointY === null || evt.clientY < yLimit) {
            return;
        }
        if (_this._resizingDirection === ResizingDirection.Bottom) {
            evt.stopPropagation();
            const distanceMouseMoved = (evt.clientY - _this._mouseStartPointY) / _this._ownerCanvas.zoom;
            _this._expandBottom(distanceMouseMoved);
            _this._mouseStartPointY =  evt.clientY;
        }
    }

    private _onBottomHandlePointerUp = (evt: PointerEvent) => {
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (_this._resizingDirection === ResizingDirection.Bottom) {
            _this.height = parseFloat(_this.element.style.height.replace("px", ""));
            _this._ownerCanvas.hostCanvas.removeEventListener("pointermove", _this._onBottomHandlePointerMove);
            _this._ownerCanvas.hostCanvas.removeEventListener("pointerup", _this._onBottomHandlePointerUp);
            _this.cleanUpResizing(evt);
        }
    }

    private _onLeftHandlePointerDown = (evt: PointerEvent) => {
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (_this.isCollapsed) {
                return;
            }
        _this.initResizing(evt);
        _this._resizingDirection = ResizingDirection.Left;
        _this.mouseXLimit = evt.clientX + _this.width - _this._minFrameWidth;
        _this._ownerCanvas.hostCanvas.addEventListener("pointerup", _this._onLeftHandlePointerUp);
        _this._ownerCanvas.hostCanvas.addEventListener("pointermove", _this._onLeftHandlePointerMove);
    }

    private _onLeftHandlePointerMove = (evt: PointerEvent) => {
        const slack = (this.element.offsetWidth - this._minFrameWidth) * this._ownerCanvas.zoom;
        const xLimit = (this._mouseStartPointX as number) + slack;
        this._moveLeftHandle(evt, xLimit);
    }

    private _moveLeftHandle = (evt: PointerEvent, xLimit: number) => {
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (_this.mouseXLimit) {
            if (_this._resizingDirection !== ResizingDirection.Left  || _this._mouseStartPointX === null || _this._mouseStartPointY === null || evt.clientX > xLimit) {
                return;
            }
            if (_this._resizingDirection === ResizingDirection.Left) {
                evt.stopPropagation();
                const distanceMouseMoved = (evt.clientX - _this._mouseStartPointX) / _this._ownerCanvas.zoom;
                _this._expandLeft(distanceMouseMoved);
                _this._mouseStartPointX =  evt.clientX;
            }
        }
    }

    private _onLeftHandlePointerUp = (evt: PointerEvent) => {
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (_this._resizingDirection === ResizingDirection.Left) {
            _this.x = parseFloat(_this.element.style.left!.replace("px", ""));
            _this.width = parseFloat(_this.element.style.width.replace("px", ""));
            _this._ownerCanvas.hostCanvas.removeEventListener("pointerup", _this._onLeftHandlePointerUp);
            _this._ownerCanvas.hostCanvas.removeEventListener("pointermove", _this._onLeftHandlePointerMove);
            _this.cleanUpResizing(evt);
        }
    }

    private _onTopHandlePointerDown = (evt: PointerEvent) => {
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (_this.isCollapsed) {
                return;
            }
        _this.initResizing(evt);
        _this._resizingDirection = ResizingDirection.Top;
        _this._ownerCanvas.hostCanvas.addEventListener("pointerup", _this._onTopHandlePointerUp);
        _this._ownerCanvas.hostCanvas.addEventListener("pointermove", _this._onTopHandlePointerMove);
    }

    private _onTopHandlePointerMove = (evt: PointerEvent) => {
        const slack = (this.element.offsetHeight - this._minFrameHeight) * this._ownerCanvas.zoom;
        const yLimit = (this._mouseStartPointY as number) + slack;
        this._moveTopHandle(evt, yLimit);
    }

    private _moveTopHandle = (evt: PointerEvent, yLimit: number) => {
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (!_this._isResizingTop() || _this._mouseStartPointX === null || _this._mouseStartPointY === null || evt.clientY > yLimit) {
            return;
        }
        if (_this._isResizingTop()) {
            evt.stopPropagation();
            const distanceMouseMoved = (evt.clientY - _this._mouseStartPointY) / _this._ownerCanvas.zoom;
            _this._expandTop(distanceMouseMoved);
            _this._mouseStartPointY =  evt.clientY;
        }
    }

    private _onTopHandlePointerUp = (evt: PointerEvent) => {
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (_this._isResizingTop()) {
            _this.y = parseFloat(_this.element.style.top!.replace("px", ""));
            _this.height = parseFloat(_this.element.style.height.replace("px", ""));
            _this._ownerCanvas.hostCanvas.removeEventListener("pointerup", _this._onTopHandlePointerUp);
            _this._ownerCanvas.hostCanvas.removeEventListener("pointermove", _this._onTopHandlePointerMove);
            _this.cleanUpResizing(evt);
        }
    }

    private _onTopRightHandlePointerDown = (evt: PointerEvent) => {
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (_this.isCollapsed) {
                return;
            }
        _this.initResizing(evt);
        _this._resizingDirection = ResizingDirection.TopRight;
        _this._ownerCanvas.hostCanvas.addEventListener("pointerup", _this._onTopRightHandlePointerUp);
        _this._ownerCanvas.hostCanvas.addEventListener("pointermove", _this._onTopRightHandlePointerMove);
    }

    private _onTopRightHandlePointerMove = (evt: PointerEvent) => {
        const topSlack = (this.element.offsetHeight - this._minFrameHeight) * this._ownerCanvas.zoom;
        const yLimit = (this._mouseStartPointY as number) + topSlack;
        const rightSlack = (this.element.offsetWidth - this._minFrameWidth) * this._ownerCanvas.zoom;
        const xLimit = (this._mouseStartPointX as number) - rightSlack;
        this._moveTopRightHandle(evt, xLimit, yLimit);
    }

    private _moveTopRightHandle = (evt: PointerEvent, xLimit: number, yLimit: number) => {
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (!(_this._isResizingTop() && _this._isResizingRight()) || _this._mouseStartPointX === null || _this._mouseStartPointY === null) {
            return;
        }
        if (_this._isResizingRight() && _this._isResizingTop()) {
            evt.stopPropagation();
            if (evt.clientY < yLimit && evt.clientX > xLimit) { // able to move in X and Y
                const distanceMouseMovedX = (evt.clientX - _this._mouseStartPointX) / _this._ownerCanvas.zoom;
                _this._expandRight(distanceMouseMovedX, evt.clientX);
                _this._mouseStartPointX =  evt.clientX;
                const distanceMouseMovedY = (evt.clientY - _this._mouseStartPointY) / _this._ownerCanvas.zoom;
                _this._expandTop(distanceMouseMovedY);
                _this._mouseStartPointY =  evt.clientY;
            } else if (evt.clientY > yLimit && evt.clientX > xLimit) { // able to move in X but not Y
                const distanceMouseMovedX = (evt.clientX - _this._mouseStartPointX) / _this._ownerCanvas.zoom;
                _this._expandRight(distanceMouseMovedX, evt.clientX);
                _this._mouseStartPointX =  evt.clientX;
            } else if (evt.clientY < yLimit && evt.clientX < xLimit) { // able to move in Y but not X
                const distanceMouseMovedY = (evt.clientY - _this._mouseStartPointY) / _this._ownerCanvas.zoom;
                _this._expandTop(distanceMouseMovedY);
                _this._mouseStartPointY =  evt.clientY;
            }
        }
    }

    private _onTopRightHandlePointerUp = (evt: PointerEvent) => {
        evt.stopPropagation();
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (_this._resizingDirection === ResizingDirection.TopRight) {
            _this.y = parseFloat(_this.element.style.top!.replace("px", ""));
            _this.height = parseFloat(_this.element.style.height.replace("px", ""));
            _this.width = parseFloat(_this.element.style.width.replace("px", ""));
            _this._ownerCanvas.hostCanvas.removeEventListener("pointerup", _this._onTopRightHandlePointerUp);
            _this._ownerCanvas.hostCanvas.removeEventListener("pointermove", _this._onTopRightHandlePointerMove);
            _this.cleanUpResizing(evt);
        }
    }

    private _onBottomRightHandlePointerDown = (evt: PointerEvent) => {
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (_this.isCollapsed) {
                return;
            }
        _this.initResizing(evt);
        _this._resizingDirection = ResizingDirection.BottomRight;
        _this._ownerCanvas.hostCanvas.addEventListener("pointerup", _this._onBottomRightHandlePointerUp);
        _this._ownerCanvas.hostCanvas.addEventListener("pointermove", _this._onBottomRightHandlePointerMove);
    }

    private _onBottomRightHandlePointerMove = (evt: PointerEvent) => {
        const bottomSlack = (this.element.offsetHeight - this._minFrameHeight) * this._ownerCanvas.zoom;
        const yLimit = (this._mouseStartPointY as number) - bottomSlack;
        const rightSlack = (this.element.offsetWidth - this._minFrameWidth) * this._ownerCanvas.zoom;
        const xLimit = (this._mouseStartPointX as number) - rightSlack;
        this._moveBottomRightHandle(evt, xLimit, yLimit);
    }

    private _moveBottomRightHandle = (evt: PointerEvent, xLimit: number, yLimit: number) => {
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (!(_this._isResizingBottom() && _this._isResizingRight()) || _this._mouseStartPointX === null || _this._mouseStartPointY === null) {
            return;
        }
        if (_this._isResizingRight() && _this._isResizingBottom()) {
            evt.stopPropagation();
            if (evt.clientY > yLimit && evt.clientX > xLimit) { // able to move in X and Y
                const distanceMouseMovedX = (evt.clientX - _this._mouseStartPointX) / _this._ownerCanvas.zoom;
                _this._expandRight(distanceMouseMovedX, evt.clientX);
                _this._mouseStartPointX =  evt.clientX;
                const distanceMouseMovedY = (evt.clientY - _this._mouseStartPointY) / _this._ownerCanvas.zoom;
                _this._expandBottom(distanceMouseMovedY);
                _this._mouseStartPointY =  evt.clientY;
            } else if (evt.clientY < yLimit && evt.clientX > xLimit) { // able to move in X but not Y
                const distanceMouseMovedX = (evt.clientX - _this._mouseStartPointX) / _this._ownerCanvas.zoom;
                _this._expandRight(distanceMouseMovedX, evt.clientX);
                _this._mouseStartPointX =  evt.clientX;
            } else if (evt.clientY > yLimit && evt.clientX < xLimit) { // able to move in Y but not X
                const distanceMouseMovedY = (evt.clientY - _this._mouseStartPointY) / _this._ownerCanvas.zoom;
                _this._expandBottom(distanceMouseMovedY);
                _this._mouseStartPointY =  evt.clientY;
            }
        }
    }

    private _onBottomRightHandlePointerUp = (evt: PointerEvent) => {
        evt.stopPropagation();
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (_this._resizingDirection === ResizingDirection.BottomRight) {
            _this.height = parseFloat(_this.element.style.height.replace("px", ""));
            _this.width = parseFloat(_this.element.style.width.replace("px", ""));
            _this._ownerCanvas.hostCanvas.removeEventListener("pointerup", _this._onBottomRightHandlePointerUp);
            _this._ownerCanvas.hostCanvas.removeEventListener("pointermove", _this._onBottomRightHandlePointerMove);
            _this.cleanUpResizing(evt);
        }
    }

    private _onBottomLeftHandlePointerDown = (evt: PointerEvent) => {
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (_this.isCollapsed) {
                return;
            }
        _this.initResizing(evt);
        _this._resizingDirection = ResizingDirection.BottomLeft;
        _this.mouseXLimit = evt.clientX + _this.width - _this._minFrameWidth;
        _this._ownerCanvas.hostCanvas.addEventListener("pointerup", _this._onBottomLeftHandlePointerUp);
        _this._ownerCanvas.hostCanvas.addEventListener("pointermove", _this._onBottomLeftHandlePointerMove);
    }

    private _onBottomLeftHandlePointerMove = (evt: PointerEvent) => {
        const bottomSlack = (this.element.offsetHeight - this._minFrameHeight) * this._ownerCanvas.zoom;
        const yLimit = (this._mouseStartPointY as number) - bottomSlack;
        const leftSlack = (this.element.offsetWidth - this._minFrameWidth) * this._ownerCanvas.zoom;
        const xLimit = (this._mouseStartPointX as number) + leftSlack;
        this._moveBottomLeftHandle(evt, xLimit, yLimit);
    }

    private _moveBottomLeftHandle = (evt: PointerEvent, xLimit: number, yLimit: number) => {
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (!(_this._isResizingBottom() && _this._isResizingLeft()) || _this._mouseStartPointX === null || _this._mouseStartPointY === null) {
            return;
        }
        if (_this._isResizingLeft() && _this._isResizingBottom()) {
            evt.stopPropagation();
            if (evt.clientY > yLimit && evt.clientX < xLimit) { // able to move in X and Y
                const distanceMouseMovedX = (evt.clientX - _this._mouseStartPointX) / _this._ownerCanvas.zoom;
                _this._expandLeft(distanceMouseMovedX);
                _this._mouseStartPointX =  evt.clientX;
                const distanceMouseMovedY = (evt.clientY - _this._mouseStartPointY) / _this._ownerCanvas.zoom;
                _this._expandBottom(distanceMouseMovedY);
                _this._mouseStartPointY =  evt.clientY;
            } else if (evt.clientY < yLimit && evt.clientX < xLimit) { // able to move in X but not Y
                const distanceMouseMovedX = (evt.clientX - _this._mouseStartPointX) / _this._ownerCanvas.zoom;
                _this._expandLeft(distanceMouseMovedX);
                _this._mouseStartPointX =  evt.clientX;
            } else if (evt.clientY > yLimit && evt.clientX > xLimit) { // able to move in Y but not X
                const distanceMouseMovedY = (evt.clientY - _this._mouseStartPointY) / _this._ownerCanvas.zoom;
                _this._expandBottom(distanceMouseMovedY);
                _this._mouseStartPointY =  evt.clientY;
            }
        }
    }

    private _onBottomLeftHandlePointerUp = (evt: PointerEvent) => {
        evt.stopPropagation();
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (_this._resizingDirection === ResizingDirection.BottomLeft) {
            _this.height = parseFloat(_this.element.style.height.replace("px", ""));
            _this.x = parseFloat(_this.element.style.left!.replace("px", ""));
            _this.width = parseFloat(_this.element.style.width.replace("px", ""));
            _this._ownerCanvas.hostCanvas.removeEventListener("pointerup", _this._onBottomLeftHandlePointerUp);
            _this._ownerCanvas.hostCanvas.removeEventListener("pointermove", _this._onBottomLeftHandlePointerMove);
            _this.cleanUpResizing(evt);
        }
    }

    private _onTopLeftHandlePointerDown = (evt: PointerEvent) => {
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (_this.isCollapsed) {
                return;
            }
        _this.initResizing(evt);
        _this._resizingDirection = ResizingDirection.TopLeft;
        _this.mouseXLimit = evt.clientX + _this.width - _this._minFrameWidth;
        _this._ownerCanvas.hostCanvas.addEventListener("pointerup", _this._onTopLeftHandlePointerUp);
        _this._ownerCanvas.hostCanvas.addEventListener("pointermove", _this._onTopLeftHandlePointerMove);
    }

    private _onTopLeftHandlePointerMove = (evt: PointerEvent) => {
        const topSlack = (this.element.offsetHeight - this._minFrameHeight) * this._ownerCanvas.zoom;
        const yLimit = (this._mouseStartPointY as number) + topSlack;
        const leftSlack = (this.element.offsetWidth - this._minFrameWidth) * this._ownerCanvas.zoom;
        const xLimit = (this._mouseStartPointX as number) + leftSlack;
        this._moveTopLeftHandle(evt, xLimit, yLimit);
    }

    private _moveTopLeftHandle = (evt: PointerEvent, xLimit: number, yLimit: number) => {
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (!(_this._isResizingTop() && _this._isResizingLeft()) || _this._mouseStartPointX === null || _this._mouseStartPointY === null) {
            return;
        }
        if (_this._isResizingLeft() && _this._isResizingTop()) {
            evt.stopPropagation();
            if (evt.clientY < yLimit  && evt.clientX < xLimit) { // able to move in X and Y
                const distanceMouseMovedX = (evt.clientX - _this._mouseStartPointX) / _this._ownerCanvas.zoom;
                _this._expandLeft(distanceMouseMovedX);
                _this._mouseStartPointX =  evt.clientX;
                const distanceMouseMovedY = (evt.clientY - _this._mouseStartPointY) / _this._ownerCanvas.zoom;
                _this._expandTop(distanceMouseMovedY);
                _this._mouseStartPointY =  evt.clientY;
            } else if (evt.clientY > yLimit  && evt.clientX < xLimit) { // able to move in X but not Y
                const distanceMouseMovedX = (evt.clientX - _this._mouseStartPointX) / _this._ownerCanvas.zoom;
                _this._expandLeft(distanceMouseMovedX);
                _this._mouseStartPointX =  evt.clientX;
            } else if (evt.clientY < yLimit  && evt.clientX > xLimit) { // able to move in Y but not X
                const distanceMouseMovedY = (evt.clientY - _this._mouseStartPointY) / _this._ownerCanvas.zoom;
                _this._expandTop(distanceMouseMovedY);
                _this._mouseStartPointY =  evt.clientY;
            }
        }
    }

    private _onTopLeftHandlePointerUp = (evt: PointerEvent) => {
        evt.stopPropagation();
        // tslint:disable-next-line: no-this-assignment
        const _this = this;
        if (_this._resizingDirection === ResizingDirection.TopLeft) {
            _this.y = parseFloat(_this.element.style.top!.replace("px", ""));
            _this.height = parseFloat(_this.element.style.height.replace("px", ""));
            _this.x = parseFloat(_this.element.style.left!.replace("px", ""));
            _this.width = parseFloat(_this.element.style.width.replace("px", ""));
            _this._ownerCanvas.hostCanvas.removeEventListener("pointerup", _this._onTopLeftHandlePointerUp);
            _this._ownerCanvas.hostCanvas.removeEventListener("pointermove", _this._onTopLeftHandlePointerMove);
            _this.cleanUpResizing(evt);
        }
    }

    private _expandLeft(widthModification: number) {
        const frameElementWidth = parseFloat(this.element.style.width.replace("px", ""));
        const frameElementLeft = parseFloat(this.element.style.left.replace("px", ""));
        this.element.style.width = `${frameElementWidth - widthModification}px`;
        this.element.style.left = `${frameElementLeft + widthModification}px`;
        this.updateMinHeightWithComments();
}

    private _expandTop(heightModification: number) {
        const frameElementHeight = parseFloat(this.element.style.height.replace("px", ""));
        const frameElementTop = parseFloat(this.element.style.top.replace("px", ""));
        this.element.style.height = `${frameElementHeight - heightModification}px`;
        this.element.style.top = `${frameElementTop + heightModification}px`;
    }

    private _expandRight(widthModification: number, x: number) {
        const frameElementWidth = parseFloat(this.element.style.width.replace("px", ""));
        if ((frameElementWidth + widthModification) > 20) {
            this._mouseStartPointX =  x;
            this.element.style.width = `${frameElementWidth + widthModification}px`;
        }
        this.updateMinHeightWithComments();
    }

    private _expandBottom(heightModification: number) {
        const frameElementHeight = parseFloat(this.element.style.height.replace("px", ""));
        this.element.style.height = `${frameElementHeight + heightModification}px`;
    }

    public dispose() {
        this.isCollapsed = false;
        
        this._nodes.forEach(node => {
            node.enclosingFrameId = -1;
        });

        if (this._onSelectionChangedObserver) {
            this._ownerCanvas.globalState.onSelectionChangedObservable.remove(this._onSelectionChangedObserver);
        };

        if(this._onGraphNodeRemovalObserver) {
            this._ownerCanvas.globalState.onGraphNodeRemovalObservable.remove(this._onGraphNodeRemovalObserver);
        };

        if(this._onExposePortOnFrameObserver) {
            this._ownerCanvas.globalState.onExposePortOnFrameObservable.remove(this._onExposePortOnFrameObserver);
        };

        this.element.parentElement?.removeChild(this.element);

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
            isCollapsed: false, //keeping closed to make reimporting cleaner
            blocks: this.nodes.map(n => n.block.uniqueId),
            comments: this._comments
        }
    }

    public export() {
        const state = this._ownerCanvas.globalState;
        const json = SerializationTools.Serialize(state.nodeMaterial, state, this);
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
                    node[0].enclosingFrameId = newFrame.id;
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