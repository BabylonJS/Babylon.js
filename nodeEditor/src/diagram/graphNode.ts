import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { GlobalState } from '../globalState';
import { Nullable } from 'babylonjs/types';
import { Observer } from 'babylonjs/Misc/observable';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes';
import { BlockTools } from '../blockTools';
import { GraphCanvasComponent } from './graphCanvas';
import { PropertyLedger } from './propertyLedger';
import * as React from 'react';
import { GenericPropertyTabComponent } from './properties/genericNodePropertyComponent';
import { DisplayLedger } from './displayLedger';
import { IDisplayManager } from './previews/displayManager';

export class GraphNode {
    private _visual: HTMLDivElement;
    private _header: HTMLDivElement;
    private _connections: HTMLDivElement;
    private _inputsContainer: HTMLDivElement;
    private _outputsContainer: HTMLDivElement;
    private _content: HTMLDivElement;
    private _inputPorts: HTMLDivElement[] = [];
    private _outputPorts: HTMLDivElement[] = [];
    private _x = 0;
    private _y = 0;
    private _mouseStartPointX: Nullable<number> = null;
    private _mouseStartPointY: Nullable<number> = null    
    private _globalState: GlobalState;
    private _onSelectionChangedObserver: Nullable<Observer<Nullable<GraphNode>>>;   
    private _ownerCanvas: GraphCanvasComponent; 

    public get x() {
        return this._x;
    }

    public set x(value: number) {
        this._x = value;
        this._visual.style.left = `${value}px`;
    }

    public get y() {
        return this._y;
    }

    public set y(value: number) {
        this._y = value;
        this._visual.style.top = `${value}px`;
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

    public constructor(public block: NodeMaterialBlock, globalState: GlobalState) {
        this._globalState = globalState;

        this._onSelectionChangedObserver = this._globalState.onSelectionChangedObservable.add(node => {
            if (node === this) {
                this._visual.classList.add("selected");
            } else {
                this._visual.classList.remove("selected");
            }
        })
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

        let port = root.ownerDocument!.createElement("div");
        port.classList.add("port");     
        port.style.background = BlockTools.GetColorFromConnectionNodeType(connectionPoint.type);
        portContainer.appendChild(port);

        let portImg = root.ownerDocument!.createElement("img");
        switch (connectionPoint.type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
            case NodeMaterialBlockConnectionPointTypes.Int:
                portImg.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IxPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48Y2lyY2xlIGNsYXNzPSJjbHMtMSIgY3g9IjEwLjUiIGN5PSIxMC41IiByPSI3LjUiLz48L2c+PC9zdmc+";
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                portImg.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IyPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0zLDEwLjVhNy41Miw3LjUyLDAsMCwwLDYuNSw3LjQzVjMuMDdBNy41Miw3LjUyLDAsMCwwLDMsMTAuNVoiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMS41LDMuMDdWMTcuOTNhNy41LDcuNSwwLDAsMCwwLTE0Ljg2WiIvPjwvZz48L3N2Zz4=";
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector3:
            case NodeMaterialBlockConnectionPointTypes.Color3:
                portImg.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IzPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0zLjU3LDEzLjMxLDkuNSw5Ljg5VjNBNy41MSw3LjUxLDAsMCwwLDMsMTAuNDYsNy4zMiw3LjMyLDAsMCwwLDMuNTcsMTMuMzFaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTYuNDMsMTUsMTAuNSwxMS42Miw0LjU3LDE1YTcuNDgsNy40OCwwLDAsMCwxMS44NiwwWiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTE4LDEwLjQ2QTcuNTEsNy41MSwwLDAsMCwxMS41LDNWOS44OWw1LjkzLDMuNDJBNy4zMiw3LjMyLDAsMCwwLDE4LDEwLjQ2WiIvPjwvZz48L3N2Zz4=";
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector4:
            case NodeMaterialBlockConnectionPointTypes.Color4:
                portImg.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3I0PC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMS41LDExLjV2Ni40M2E3LjUxLDcuNTEsMCwwLDAsNi40My02LjQzWiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsMy4wN1Y5LjVoNi40M0E3LjUxLDcuNTEsMCwwLDAsMTEuNSwzLjA3WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTkuNSwxNy45M1YxMS41SDMuMDdBNy41MSw3LjUxLDAsMCwwLDkuNSwxNy45M1oiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik05LjUsMy4wN0E3LjUxLDcuNTEsMCwwLDAsMy4wNyw5LjVIOS41WiIvPjwvZz48L3N2Zz4=";
                break;
            case NodeMaterialBlockConnectionPointTypes.Matrix:
                portImg.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5NYXRyaXg8L3RpdGxlPjxnIGlkPSJMYXllcl81IiBkYXRhLW5hbWU9IkxheWVyIDUiPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsNi4xMVY5LjVoMy4zOUE0LjUxLDQuNTEsMCwwLDAsMTEuNSw2LjExWiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsMTQuODlhNC41MSw0LjUxLDAsMCwwLDMuMzktMy4zOUgxMS41WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsMy4wN3YyQTUuNTQsNS41NCwwLDAsMSwxNS45Miw5LjVoMkE3LjUxLDcuNTEsMCwwLDAsMTEuNSwzLjA3WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTE1LjkyLDExLjVhNS41NCw1LjU0LDAsMCwxLTQuNDIsNC40MnYyYTcuNTEsNy41MSwwLDAsMCw2LjQzLTYuNDNaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNS4wOCwxMS41aC0yQTcuNTEsNy41MSwwLDAsMCw5LjUsMTcuOTN2LTJBNS41NCw1LjU0LDAsMCwxLDUuMDgsMTEuNVoiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik05LjUsMy4wN0E3LjUxLDcuNTEsMCwwLDAsMy4wNyw5LjVoMkE1LjU0LDUuNTQsMCwwLDEsOS41LDUuMDhaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNOS41LDExLjVINi4xMUE0LjUxLDQuNTEsMCwwLDAsOS41LDE0Ljg5WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTkuNSw2LjExQTQuNTEsNC41MSwwLDAsMCw2LjExLDkuNUg5LjVaIi8+PC9nPjwvc3ZnPg==";
                break;
        }
        port.appendChild(portImg);

        return portContainer;
    }

    private _onDown(evt: PointerEvent) {
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

        this.x += (evt.clientX - this._mouseStartPointX) / this._ownerCanvas.zoom;
        this.y += (evt.clientY - this._mouseStartPointY) / this._ownerCanvas.zoom;

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
        let displayManager: Nullable<IDisplayManager> = null;

        if (displayManagerClass) {
            displayManager = new displayManagerClass();
        }

        // DOM
        this._visual = root.ownerDocument!.createElement("div");
        this._visual.classList.add("visual");

        this._visual.addEventListener("pointerdown", evt => this._onDown(evt));
        this._visual.addEventListener("pointerup", evt => this._onUp(evt));
        this._visual.addEventListener("pointermove", evt => this._onMove(evt));

        if (displayManager) {
            this._visual.style.background = displayManager.getBackgroundColor(this.block);
        }

        this._header = root.ownerDocument!.createElement("div");
        this._header.classList.add("header");
        if (displayManager) {
            this._header.innerHTML = displayManager.getHeaderText(this.block);
        } else {
            this._header.innerHTML = this.block.name;
        }
        this._visual.appendChild(this._header);      

        if (displayManager) {
            let additionalClass = displayManager.getHeaderClass(this.block);
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
        
        if (displayManager) {
            displayManager.setPreviewContent(this.block, this._content);
        }

        root.appendChild(this._visual);

        // Connections
        for (var input of this.block.inputs) {
            this._inputPorts.push(this._appendConnection(input, this._inputsContainer, displayManager));
        }

        for (var output of this.block.outputs) {
            this._outputPorts.push(this._appendConnection(output, this._outputsContainer, displayManager));
        }
    }

    public dispose() {
        if (this._onSelectionChangedObserver) {
            this._globalState.onSelectionChangedObservable.remove(this._onSelectionChangedObserver);
        }
    }
}