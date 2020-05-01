import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { GlobalState } from '../globalState';
import { Nullable } from 'babylonjs/types';
import { Observer } from 'babylonjs/Misc/observable';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
import { GraphCanvasComponent, FramePortData } from './graphCanvas';
import { PropertyLedger } from './propertyLedger';
import * as React from 'react';
import { GenericPropertyComponent } from './properties/genericNodePropertyComponent';
import { DisplayLedger } from './displayLedger';
import { IDisplayManager } from './display/displayManager';
import { NodeLink } from './nodeLink';
import { NodePort } from './nodePort';
import { GraphFrame } from './graphFrame';

export class GraphNode {
    private _visual: HTMLDivElement;
    private _header: HTMLDivElement;
    private _connections: HTMLDivElement;
    private _inputsContainer: HTMLDivElement;
    private _outputsContainer: HTMLDivElement;
    private _content: HTMLDivElement;    
    private _comments: HTMLDivElement;
    private _inputPorts: NodePort[] = [];
    private _outputPorts: NodePort[] = [];
    private _links: NodeLink[] = [];    
    private _x = 0;
    private _y = 0;
    private _gridAlignedX = 0;
    private _gridAlignedY = 0;    
    private _mouseStartPointX: Nullable<number> = null;
    private _mouseStartPointY: Nullable<number> = null    
    private _globalState: GlobalState;
    private _onSelectionChangedObserver: Nullable<Observer<Nullable<GraphFrame | GraphNode | NodeLink | NodePort | FramePortData>>>;  
    private _onSelectionBoxMovedObserver: Nullable<Observer<ClientRect | DOMRect>>;  
    private _onFrameCreatedObserver: Nullable<Observer<GraphFrame>>; 
    private _onUpdateRequiredObserver: Nullable<Observer<void>>;  
    private _ownerCanvas: GraphCanvasComponent; 
    private _isSelected: boolean;
    private _displayManager: Nullable<IDisplayManager> = null;
    private _isVisible = true;
    private _enclosingFrameId: number;

    public get isVisible() {
        return this._isVisible;
    }

    public set isVisible(value: boolean) {
        this._isVisible = value;

        if (!value) {
            this._visual.classList.add("hidden");
        } else {
            this._visual.classList.remove("hidden");
            this._upateNodePortNames();
        }

        for (var link of this._links) {
            link.isVisible = value;
        }

        this._refreshLinks();
    }

    private _upateNodePortNames(){
        for (var port of this._inputPorts.concat(this._outputPorts)) {
            if(port.hasLabel()){
                port.portName = port.connectionPoint.displayName || port.connectionPoint.name;
            }
        }
    }

    public get outputPorts() {
        return this._outputPorts;
    }

    public get inputPorts() {
        return this._inputPorts;
    }

    public get links() {
        return this._links;
    }

    public get gridAlignedX() {
        return this._gridAlignedX;
    }

    public get gridAlignedY() {
        return this._gridAlignedY;
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
        this._visual.style.left = `${this._gridAlignedX}px`;

        this._refreshLinks();
        this._refreshFrames();
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
        this._visual.style.top = `${this._gridAlignedY}px`;

        this._refreshLinks();
        this._refreshFrames();
    }

    public get width() {
        return this._visual.clientWidth;
    }

    public get height() {
        return this._visual.clientHeight;
    }

    public get id() {
        return this.block.uniqueId;
    }

    public get name() {
        return this.block.name;
    }

    public get isSelected() {
        return this._isSelected;
    }

    public get enclosingFrameId() {
        return this._enclosingFrameId;
    }

    public set enclosingFrameId(value: number) {
        this._enclosingFrameId = value;
    }

    public set isSelected(value: boolean) {
        if (this._isSelected === value) {
            return;            
        }

        this._isSelected = value;

        if (!value) {
            this._visual.classList.remove("selected");    
            let indexInSelection = this._ownerCanvas.selectedNodes.indexOf(this);

            if (indexInSelection > -1) {
                this._ownerCanvas.selectedNodes.splice(indexInSelection, 1);
            }
        } else {
            this._globalState.onSelectionChangedObservable.notifyObservers(this);  
        }
    }

    public constructor(public block: NodeMaterialBlock, globalState: GlobalState) {
        this._globalState = globalState;

        this._onSelectionChangedObserver = this._globalState.onSelectionChangedObservable.add(node => {
            if (node === this) {
                this._visual.classList.add("selected");
            } else {
                setTimeout(() => {
                    if (this._ownerCanvas.selectedNodes.indexOf(this) === -1) {
                        this._visual.classList.remove("selected");
                    }
                })
            }
        });

        this._onUpdateRequiredObserver = this._globalState.onUpdateRequiredObservable.add(() => {
            this.refresh();
        });

        this._onSelectionBoxMovedObserver = this._globalState.onSelectionBoxMoved.add(rect1 => {
            const rect2 = this._visual.getBoundingClientRect();
            var overlap = !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);

            this.isSelected = overlap;
        });

        this._onFrameCreatedObserver = this._globalState.onFrameCreatedObservable.add(frame => {      
            if (this._ownerCanvas.frames.some(f => f.nodes.indexOf(this) !== -1)) {
                return;
            }
            
            if (this.isOverlappingFrame(frame)) {
                frame.nodes.push(this);
            }
        });
    }

    public isOverlappingFrame(frame: GraphFrame) {
        const rect2 = this._visual.getBoundingClientRect();
        const rect1 = frame.element.getBoundingClientRect();

        // Add a tiny margin
        rect1.width -= 5;
        rect1.height -= 5;

        const isOverlappingFrame = !(rect1.right < rect2.left || 
            rect1.left > rect2.right || 
            rect1.bottom < rect2.top || 
            rect1.top > rect2.bottom);

        if (isOverlappingFrame) {
            this.enclosingFrameId = frame.id;
        }
        return isOverlappingFrame;
    }

    public getPortForConnectionPoint(point: NodeMaterialConnectionPoint) {
        for (var port of this._inputPorts) {
            let attachedPoint = port.connectionPoint;

            if (attachedPoint === point) {
                return port;
            }
        }

        for (var port of this._outputPorts) {
            let attachedPoint = port.connectionPoint;

            if (attachedPoint === point) {
                return port;
            }
        }

        return null;
    }

    public getLinksForConnectionPoint(point: NodeMaterialConnectionPoint) {
        return this._links.filter(link => link.portA.connectionPoint === point || link.portB!.connectionPoint === point);
    }
    
    private _refreshFrames() {       
        if (this._ownerCanvas._frameIsMoving || this._ownerCanvas._isLoading) {
            return;
        }
        
        // Frames
        for (var frame of this._ownerCanvas.frames) {
            frame.syncNode(this);
        }
    }

    public _refreshLinks() {
        if (this._ownerCanvas._isLoading) {
            return;
        }
        for (var link of this._links) {
            link.update();
        }
    }

    public refresh() {
        if (this._displayManager) {
            this._header.innerHTML = this._displayManager.getHeaderText(this.block);
            this._displayManager.updatePreviewContent(this.block, this._content);
            this._visual.style.background = this._displayManager.getBackgroundColor(this.block);
            let additionalClass = this._displayManager.getHeaderClass(this.block);
            this._header.classList.value = "header";
            if (additionalClass) {
                this._header.classList.add(additionalClass);
            }
        } else {
            this._header.innerHTML = this.block.name;
        }

        for (var port of this._inputPorts) {
            port.refresh();
        }

        for (var port of this._outputPorts) {
            port.refresh();
        }

        this._comments.innerHTML = this.block.comments || "";
        this._comments.title = this.block.comments || "";

    }

    private _onDown(evt: PointerEvent) {
        // Check if this is coming from the port
        if (evt.srcElement && (evt.srcElement as HTMLElement).nodeName === "IMG") {
            return;
        }

        const indexInSelection = this._ownerCanvas.selectedNodes.indexOf(this) ;
        if (indexInSelection=== -1) {
            this._globalState.onSelectionChangedObservable.notifyObservers(this);
        } else if (evt.ctrlKey) {
            this.isSelected = false;
        }

        evt.stopPropagation();

        for (var selectedNode of this._ownerCanvas.selectedNodes) {
            selectedNode.cleanAccumulation();
        }

        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;        
        
        this._visual.setPointerCapture(evt.pointerId);
    }

    public cleanAccumulation(useCeil = false) {
        this.x = this._ownerCanvas.getGridPosition(this.x, useCeil);
        this.y = this._ownerCanvas.getGridPosition(this.y, useCeil);
    }

    private _onUp(evt: PointerEvent) {
        evt.stopPropagation();

        for (var selectedNode of this._ownerCanvas.selectedNodes) {
            selectedNode.cleanAccumulation();
        }
        
        this._mouseStartPointX = null;
        this._mouseStartPointY = null;
        this._visual.releasePointerCapture(evt.pointerId);
    }

    private _onMove(evt: PointerEvent) {
        if (this._mouseStartPointX === null || this._mouseStartPointY === null || evt.ctrlKey) {
            return;
        }

        let newX = (evt.clientX - this._mouseStartPointX) / this._ownerCanvas.zoom;
        let newY = (evt.clientY - this._mouseStartPointY) / this._ownerCanvas.zoom;

        for (var selectedNode of this._ownerCanvas.selectedNodes) {
            selectedNode.x += newX;
            selectedNode.y += newY;
        }

        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;   

        evt.stopPropagation();
    }

    public renderProperties(): Nullable<JSX.Element> {
        let control = PropertyLedger.RegisteredControls[this.block.getClassName()];

        if (!control) {
            control = GenericPropertyComponent;
        }

        return React.createElement(control, {
            globalState: this._globalState,
            block: this.block
        });
    }

    public appendVisual(root: HTMLDivElement, owner: GraphCanvasComponent) {
        this._ownerCanvas = owner;

        // Display manager
        let displayManagerClass = DisplayLedger.RegisteredControls[this.block.getClassName()];
        

        if (displayManagerClass) {
            this._displayManager = new displayManagerClass();
        }

        // DOM
        this._visual = root.ownerDocument!.createElement("div");
        this._visual.classList.add("visual");

        this._visual.addEventListener("pointerdown", evt => this._onDown(evt));
        this._visual.addEventListener("pointerup", evt => this._onUp(evt));
        this._visual.addEventListener("pointermove", evt => this._onMove(evt));

        this._header = root.ownerDocument!.createElement("div");
        this._header.classList.add("header");

        this._visual.appendChild(this._header);      

        this._connections = root.ownerDocument!.createElement("div");
        this._connections.classList.add("connections");
        this._visual.appendChild(this._connections);        
        
        this._inputsContainer = root.ownerDocument!.createElement("div");
        this._inputsContainer.classList.add("inputsContainer");
        this._connections.appendChild(this._inputsContainer);      

        this._outputsContainer = root.ownerDocument!.createElement("div");
        this._outputsContainer.classList.add("outputsContainer");
        this._connections.appendChild(this._outputsContainer);      

        this._content = root.ownerDocument!.createElement("div");
        this._content.classList.add("content");        
        this._visual.appendChild(this._content);     

        var selectionBorder = root.ownerDocument!.createElement("div");
        selectionBorder.classList.add("selection-border");
        this._visual.appendChild(selectionBorder);     

        root.appendChild(this._visual);

        // Comments
        this._comments = root.ownerDocument!.createElement("div");
        this._comments.classList.add("comments");
            
        this._visual.appendChild(this._comments);    

        // Connections
        for (var input of this.block.inputs) {
            this._inputPorts.push(NodePort.CreatePortElement(input,  this, this._inputsContainer, this._displayManager, this._globalState));
        }

        for (var output of this.block.outputs) {
            this._outputPorts.push(NodePort.CreatePortElement(output,  this, this._outputsContainer, this._displayManager, this._globalState));
        }

        this.refresh();
    }

    public dispose() {
        // notify frame observers that this node is being deleted
        this._globalState.onGraphNodeRemovalObservable.notifyObservers(this);

        if (this._onSelectionChangedObserver) {
            this._globalState.onSelectionChangedObservable.remove(this._onSelectionChangedObserver);
        }

        if (this._onUpdateRequiredObserver) {
            this._globalState.onUpdateRequiredObservable.remove(this._onUpdateRequiredObserver);
        }

        if (this._onSelectionBoxMovedObserver) {
            this._globalState.onSelectionBoxMoved.remove(this._onSelectionBoxMovedObserver);
        }

        if (this._visual.parentElement) {
            this._visual.parentElement.removeChild(this._visual);
        }

        if (this._onFrameCreatedObserver) {
            this._globalState.onFrameCreatedObservable.remove(this._onFrameCreatedObserver);
        }

        for (var port of this._inputPorts) {
            port.dispose();
        }

        for (var port of this._outputPorts) {
            port.dispose();
        }

        let links = this._links.slice(0);
        for (var link of links) {
            link.dispose();           
        }

        this.block.dispose();
    }
}