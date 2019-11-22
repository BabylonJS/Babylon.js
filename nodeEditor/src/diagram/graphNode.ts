import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { GlobalState } from '../globalState';
import { Nullable } from 'babylonjs/types';
import { Observer } from 'babylonjs/Misc/observable';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
import { GraphCanvasComponent } from './graphCanvas';
import { PropertyLedger } from './propertyLedger';
import * as React from 'react';
import { GenericPropertyTabComponent } from './properties/genericNodePropertyComponent';
import { DisplayLedger } from './displayLedger';
import { IDisplayManager } from './display/displayManager';
import { NodeLink } from './nodeLink';
import { NodePort } from './nodePort';

export class GraphNode {
    private _visual: HTMLDivElement;
    private _header: HTMLDivElement;
    private _connections: HTMLDivElement;
    private _inputsContainer: HTMLDivElement;
    private _outputsContainer: HTMLDivElement;
    private _content: HTMLDivElement;
    private _inputPorts: NodePort[] = [];
    private _outputPorts: NodePort[] = [];
    private _links: NodeLink[] = [];    
    private _x = 0;
    private _y = 0;
    private _mouseStartPointX: Nullable<number> = null;
    private _mouseStartPointY: Nullable<number> = null    
    private _globalState: GlobalState;
    private _onSelectionChangedObserver: Nullable<Observer<Nullable<GraphNode | NodeLink>>>;   
    private _onUpdateRequiredObserver: Nullable<Observer<void>>;  
    private _ownerCanvas: GraphCanvasComponent; 
    private _isSelected: boolean;
    private _displayManager: Nullable<IDisplayManager> = null;

    public get links() {
        return this._links;
    }

    public get x() {
        return this._x;
    }

    public set x(value: number) {
        if (this._x === value) {
            return;
        }
        
        this._x = value;
        this._visual.style.left = `${value}px`;

        this._refreshLinks();
    }

    public get y() {
        return this._y;
    }

    public set y(value: number) {
        if (this._y === value) {
            return;
        }

        this._y = value;
        this._visual.style.top = `${value}px`;

        this._refreshLinks();
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

    public set isSelected(value: boolean) {
        if (this._isSelected === value) {
            return;            
        }

        this._isSelected = value;

        if (!value) {
            this._visual.classList.remove("selected");
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

    private _refreshLinks() {
        for (var link of this._links) {
            link.update();
        }
    }

    public refresh() {
        if (this._displayManager) {
            this._header.innerHTML = this._displayManager.getHeaderText(this.block);
            this._displayManager.updatePreviewContent(this.block, this._content);
            this._visual.style.background = this._displayManager.getBackgroundColor(this.block);
        } else {
            this._header.innerHTML = this.block.name;
        }

        for (var port of this._inputPorts) {
            port.refresh();
        }

        for (var port of this._outputPorts) {
            port.refresh();
        }
    }

    private _appendConnection(connectionPoint: NodeMaterialConnectionPoint, root: HTMLDivElement, displayManager: Nullable<IDisplayManager>) {
        let portContainer = root.ownerDocument!.createElement("div");
        portContainer.classList.add("portLine");
        root.appendChild(portContainer);

        if (!displayManager || displayManager.shouldDisplayPortLabels(this.block)) {
            let portLabel = root.ownerDocument!.createElement("div");
            portLabel.classList.add("label");
            portLabel.innerHTML = connectionPoint.name;        
            portContainer.appendChild(portLabel);
        }
    
        return new NodePort(portContainer, connectionPoint, this, this._globalState);
    }

    private _onDown(evt: PointerEvent) {
        // Check if this is coming from the port
        if (evt.srcElement && (evt.srcElement as HTMLElement).nodeName === "IMG") {
            return;
        }

        this._globalState.onSelectionChangedObservable.notifyObservers(this);
        evt.stopPropagation();

        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;        
        
        this._visual.setPointerCapture(evt.pointerId);
    }

    private _onUp(evt: PointerEvent) {
        evt.stopPropagation();
        
        this._mouseStartPointX = null;
        this._mouseStartPointY = null;
        this._visual.releasePointerCapture(evt.pointerId);
    }

    private _onMove(evt: PointerEvent) {
        if (this._mouseStartPointX === null || this._mouseStartPointY === null) {
            return;
        }

        for (var selectedNode of this._ownerCanvas.selectedNodes) {
            selectedNode.x += (evt.clientX - this._mouseStartPointX) / this._ownerCanvas.zoom;
            selectedNode.y += (evt.clientY - this._mouseStartPointY) / this._ownerCanvas.zoom;
        }

        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;   
        evt.stopPropagation();
    }

    public renderProperties(): Nullable<JSX.Element> {
        let control = PropertyLedger.RegisteredControls[this.block.getClassName()];

        if (!control) {
            control = GenericPropertyTabComponent;
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

        if (this._displayManager) {
            let additionalClass = this._displayManager.getHeaderClass(this.block);
            if (additionalClass) {
                this._header.classList.add(additionalClass);
            }
        }

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


        root.appendChild(this._visual);

        // Connections
        for (var input of this.block.inputs) {
            this._inputPorts.push(this._appendConnection(input, this._inputsContainer, this._displayManager));
        }

        for (var output of this.block.outputs) {
            this._outputPorts.push(this._appendConnection(output, this._outputsContainer, this._displayManager));
        }

        this.refresh();
    }

    public dispose() {
        if (this._onSelectionChangedObserver) {
            this._globalState.onSelectionChangedObservable.remove(this._onSelectionChangedObserver);
        }

        if (this._onUpdateRequiredObserver) {
            this._globalState.onUpdateRequiredObservable.remove(this._onUpdateRequiredObserver);
        }

        if (this._visual.parentElement) {
            this._visual.parentElement.removeChild(this._visual);
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