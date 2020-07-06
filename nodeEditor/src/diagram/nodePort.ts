import { BlockTools } from '../blockTools';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
import { GlobalState } from '../globalState';
import { Nullable } from 'babylonjs/types';
import { Observer } from 'babylonjs/Misc/observable';
import { Vector2 } from 'babylonjs/Maths/math.vector';
import { IDisplayManager } from './display/displayManager';
import { GraphNode } from './graphNode';
import { NodeLink } from './nodeLink';
import { GraphFrame } from './graphFrame';
import { FrameNodePort } from './frameNodePort';
import { FramePortData } from './graphCanvas';

export class NodePort {
    protected _element: HTMLDivElement;
    protected _img: HTMLImageElement;
    protected _globalState: GlobalState;
    protected _portLabelElement: Element;
    protected _onCandidateLinkMovedObserver: Nullable<Observer<Nullable<Vector2>>>;
    protected _onSelectionChangedObserver: Nullable<Observer<Nullable<GraphFrame | GraphNode | NodeLink | NodePort | FramePortData>>>;
    protected _exposedOnFrame: boolean;
    
    public delegatedPort: Nullable<FrameNodePort> = null;

    public get element(): HTMLDivElement {
        if (this.delegatedPort) {
            return this.delegatedPort.element;
        }

        return this._element;
    }

    public get portName(){
        let portName = this.connectionPoint.displayName || this.connectionPoint.name;
        if (this.connectionPoint.ownerBlock.isInput) {
            portName = this.node.name;
        }
        return portName
    }

    public set portName(newName: string){
        if(this._portLabelElement) {
            this.connectionPoint.displayName = newName;
            this._portLabelElement.innerHTML = newName;
        }
    }

    public get disabled() {
        if (!this.connectionPoint.isConnected) {
            return false;
        } else if (this._isConnectedToNodeOutsideOfFrame()) { //connected to outside node
            return true;
        } else {
            const link = this.node.getLinksForConnectionPoint(this.connectionPoint)
            if (link.length){
                if (link[0].nodeB === this.node) { // check if this node is the receiving
                    return true;
                }
            }
        }
        return false;
    }

    public hasLabel(){
        return !!this._portLabelElement;
    }

    public get exposedOnFrame() {
        if(!!this.connectionPoint.isExposedOnFrame || this._isConnectedToNodeOutsideOfFrame()) {
            return true
        } return false;
    }

    public set exposedOnFrame(value: boolean) {
        if(this.disabled){
            return;
        }
        this.connectionPoint.isExposedOnFrame = value;
    }
    
    
    private _isConnectedToNodeOutsideOfFrame() {
        const link = this.node.getLinksForConnectionPoint(this.connectionPoint)
        if (link.length){
            for(let i = 0; i < link.length; i++){
                if (link[i].nodeA.enclosingFrameId !== link[i].nodeB!.enclosingFrameId) {
                    return true;
                }
            }
        }
        return false;
    }

    public refresh() {
        this._element.style.background = BlockTools.GetColorFromConnectionNodeType(this.connectionPoint.type);
        switch (this.connectionPoint.type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
            case NodeMaterialBlockConnectionPointTypes.Int:
                this._img.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IxPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48Y2lyY2xlIGNsYXNzPSJjbHMtMSIgY3g9IjEwLjUiIGN5PSIxMC41IiByPSI3LjUiLz48L2c+PC9zdmc+";
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                this._img.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IyPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0zLDEwLjVhNy41Miw3LjUyLDAsMCwwLDYuNSw3LjQzVjMuMDdBNy41Miw3LjUyLDAsMCwwLDMsMTAuNVoiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMS41LDMuMDdWMTcuOTNhNy41LDcuNSwwLDAsMCwwLTE0Ljg2WiIvPjwvZz48L3N2Zz4=";
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector3:
            case NodeMaterialBlockConnectionPointTypes.Color3:
                this._img.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IzPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0zLjU3LDEzLjMxLDkuNSw5Ljg5VjNBNy41MSw3LjUxLDAsMCwwLDMsMTAuNDYsNy4zMiw3LjMyLDAsMCwwLDMuNTcsMTMuMzFaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTYuNDMsMTUsMTAuNSwxMS42Miw0LjU3LDE1YTcuNDgsNy40OCwwLDAsMCwxMS44NiwwWiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTE4LDEwLjQ2QTcuNTEsNy41MSwwLDAsMCwxMS41LDNWOS44OWw1LjkzLDMuNDJBNy4zMiw3LjMyLDAsMCwwLDE4LDEwLjQ2WiIvPjwvZz48L3N2Zz4=";
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector4:
            case NodeMaterialBlockConnectionPointTypes.Color4:
                this._img.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3I0PC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMS41LDExLjV2Ni40M2E3LjUxLDcuNTEsMCwwLDAsNi40My02LjQzWiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsMy4wN1Y5LjVoNi40M0E3LjUxLDcuNTEsMCwwLDAsMTEuNSwzLjA3WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTkuNSwxNy45M1YxMS41SDMuMDdBNy41MSw3LjUxLDAsMCwwLDkuNSwxNy45M1oiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik05LjUsMy4wN0E3LjUxLDcuNTEsMCwwLDAsMy4wNyw5LjVIOS41WiIvPjwvZz48L3N2Zz4=";
                break;
            case NodeMaterialBlockConnectionPointTypes.Matrix:
                this._img.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5NYXRyaXg8L3RpdGxlPjxnIGlkPSJMYXllcl81IiBkYXRhLW5hbWU9IkxheWVyIDUiPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsNi4xMVY5LjVoMy4zOUE0LjUxLDQuNTEsMCwwLDAsMTEuNSw2LjExWiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsMTQuODlhNC41MSw0LjUxLDAsMCwwLDMuMzktMy4zOUgxMS41WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsMy4wN3YyQTUuNTQsNS41NCwwLDAsMSwxNS45Miw5LjVoMkE3LjUxLDcuNTEsMCwwLDAsMTEuNSwzLjA3WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTE1LjkyLDExLjVhNS41NCw1LjU0LDAsMCwxLTQuNDIsNC40MnYyYTcuNTEsNy41MSwwLDAsMCw2LjQzLTYuNDNaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNS4wOCwxMS41aC0yQTcuNTEsNy41MSwwLDAsMCw5LjUsMTcuOTN2LTJBNS41NCw1LjU0LDAsMCwxLDUuMDgsMTEuNVoiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik05LjUsMy4wN0E3LjUxLDcuNTEsMCwwLDAsMy4wNyw5LjVoMkE1LjU0LDUuNTQsMCwwLDEsOS41LDUuMDhaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNOS41LDExLjVINi4xMUE0LjUxLDQuNTEsMCwwLDAsOS41LDE0Ljg5WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTkuNSw2LjExQTQuNTEsNC41MSwwLDAsMCw2LjExLDkuNUg5LjVaIi8+PC9nPjwvc3ZnPg==";
                break;
            case NodeMaterialBlockConnectionPointTypes.Object:
                this._img.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IxPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48Y2lyY2xlIGNsYXNzPSJjbHMtMSIgY3g9IjEwLjUiIGN5PSIxMC41IiByPSI3LjUiLz48L2c+PC9zdmc+";
                break;
        }
    }

    public constructor(portContainer: HTMLElement, public connectionPoint: NodeMaterialConnectionPoint, public node: GraphNode, globalState: GlobalState) {
        this._element = portContainer.ownerDocument!.createElement("div");
        this._element.classList.add("port");
        portContainer.appendChild(this._element);
        this._globalState = globalState;

        this._img = portContainer.ownerDocument!.createElement("img");
        this._element.appendChild(this._img );

        // determine if node name is editable
        if (portContainer.children[0].className === 'port-label') {
            this._portLabelElement = portContainer.children[0];
        }

        (this._element as any).port = this;

        // Drag support
        this._element.ondragstart= () => false;

        this._onCandidateLinkMovedObserver = globalState.onCandidateLinkMoved.add(coords => {
            const rect = this._element.getBoundingClientRect();

            if (!coords || rect.left > coords.x || rect.right < coords.x || rect.top > coords.y || rect.bottom < coords.y) {
                this._element.classList.remove("selected"); 
                return;
            }

            this._element.classList.add("selected"); 
            this._globalState.onCandidatePortSelectedObservable.notifyObservers(this);
        });

        this._onSelectionChangedObserver = this._globalState.onSelectionChangedObservable.add((selection) => {
            if (selection === this) {
                this._img.classList.add("selected");
            } else {
                this._img.classList.remove("selected");
            }
        });

        this.refresh();
    }

    public dispose() {
        this._globalState.onCandidateLinkMoved.remove(this._onCandidateLinkMovedObserver);

        if (this._onSelectionChangedObserver) {
            this._globalState.onSelectionChangedObservable.remove(this._onSelectionChangedObserver);
        }
    }

    public static CreatePortElement(connectionPoint: NodeMaterialConnectionPoint, node: GraphNode, root: HTMLElement, 
            displayManager: Nullable<IDisplayManager>, globalState: GlobalState) {
        let portContainer = root.ownerDocument!.createElement("div");
        let block = connectionPoint.ownerBlock;

        portContainer.classList.add("portLine");

        root.appendChild(portContainer);

        if (!displayManager || displayManager.shouldDisplayPortLabels(block)) {
            let portLabel = root.ownerDocument!.createElement("div");
            portLabel.classList.add("port-label");
            portLabel.innerHTML = connectionPoint.displayName || connectionPoint.name;        
            portContainer.appendChild(portLabel);
        }
    
        return new NodePort(portContainer, connectionPoint, node, globalState);
    }
}