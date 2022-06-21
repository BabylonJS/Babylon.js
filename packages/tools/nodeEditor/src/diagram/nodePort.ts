import { BlockTools } from "../blockTools";
import { NodeMaterialBlockConnectionPointTypes } from "core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialConnectionPoint } from "core/Materials/Node/nodeMaterialBlockConnectionPoint";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import type { Vector2 } from "core/Maths/math.vector";
import type { IDisplayManager } from "../../../../dev/sharedUiComponents/src/nodeGraphSystem/interfaces/displayManager";
import type { GraphNode } from "./graphNode";
import type { FrameNodePort } from "../../../../dev/sharedUiComponents/src/nodeGraphSystem/frameNodePort";
import { StateManager } from "node-editor/sharedComponents/nodeGraphSystem/stateManager";
import { ISelectionChangedOptions } from "node-editor/sharedComponents/nodeGraphSystem/interfaces/selectionChangedOptions";

export class NodePort {
    protected _element: HTMLDivElement;
    protected _img: HTMLImageElement;
    protected _stateManager: StateManager;
    protected _portLabelElement: Element;
    protected _onCandidateLinkMovedObserver: Nullable<Observer<Nullable<Vector2>>>;
    protected _onSelectionChangedObserver: Nullable<Observer<Nullable<ISelectionChangedOptions>>>;
    protected _exposedOnFrame: boolean;
    public delegatedPort: Nullable<FrameNodePort> = null;

    public get element(): HTMLDivElement {
        if (this.delegatedPort) {
            return this.delegatedPort.element;
        }

        return this._element;
    }

    public get portName() {
        let portName = this.connectionPoint.displayName || this.connectionPoint.name;
        if (this.connectionPoint.ownerBlock.isInput) {
            portName = this.node.name;
        }
        return portName;
    }

    public set portName(newName: string) {
        if (this._portLabelElement) {
            this.connectionPoint.displayName = newName;
            this._portLabelElement.innerHTML = newName;
        }
    }

    public get disabled() {
        if (!this.connectionPoint.isConnected) {
            return false;
        } else if (this._isConnectedToNodeOutsideOfFrame()) {
            //connected to outside node
            return true;
        } else {
            const link = this.node.getLinksForConnectionPoint(this.connectionPoint);
            if (link.length) {
                if (link[0].nodeB === this.node) {
                    // check if this node is the receiving
                    return true;
                }
            }
        }
        return false;
    }

    public hasLabel() {
        return !!this._portLabelElement;
    }

    public get exposedOnFrame() {
        if (!!this.connectionPoint.isExposedOnFrame || this._isConnectedToNodeOutsideOfFrame()) {
            return true;
        }
        return false;
    }

    public set exposedOnFrame(value: boolean) {
        if (this.disabled) {
            return;
        }
        this.connectionPoint.isExposedOnFrame = value;
    }

    public get exposedPortPosition() {
        return this.connectionPoint.exposedPortPosition;
    }

    public set exposedPortPosition(value: number) {
        this.connectionPoint.exposedPortPosition = value;
    }

    private _isConnectedToNodeOutsideOfFrame() {
        const link = this.node.getLinksForConnectionPoint(this.connectionPoint);
        if (link.length) {
            for (let i = 0; i < link.length; i++) {
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
                this._img.src =
                    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IxPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48Y2lyY2xlIGNsYXNzPSJjbHMtMSIgY3g9IjEwLjUiIGN5PSIxMC41IiByPSI3LjUiLz48L2c+PC9zdmc+";
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                this._img.src =
                    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IyPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0zLDEwLjVhNy41Miw3LjUyLDAsMCwwLDYuNSw3LjQzVjMuMDdBNy41Miw3LjUyLDAsMCwwLDMsMTAuNVoiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMS41LDMuMDdWMTcuOTNhNy41LDcuNSwwLDAsMCwwLTE0Ljg2WiIvPjwvZz48L3N2Zz4=";
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector3:
            case NodeMaterialBlockConnectionPointTypes.Color3:
                this._img.src =
                    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IzPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0zLjU3LDEzLjMxLDkuNSw5Ljg5VjNBNy41MSw3LjUxLDAsMCwwLDMsMTAuNDYsNy4zMiw3LjMyLDAsMCwwLDMuNTcsMTMuMzFaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTYuNDMsMTUsMTAuNSwxMS42Miw0LjU3LDE1YTcuNDgsNy40OCwwLDAsMCwxMS44NiwwWiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTE4LDEwLjQ2QTcuNTEsNy41MSwwLDAsMCwxMS41LDNWOS44OWw1LjkzLDMuNDJBNy4zMiw3LjMyLDAsMCwwLDE4LDEwLjQ2WiIvPjwvZz48L3N2Zz4=";
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector4:
            case NodeMaterialBlockConnectionPointTypes.Color4:
                this._img.src =
                    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3I0PC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMS41LDExLjV2Ni40M2E3LjUxLDcuNTEsMCwwLDAsNi40My02LjQzWiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsMy4wN1Y5LjVoNi40M0E3LjUxLDcuNTEsMCwwLDAsMTEuNSwzLjA3WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTkuNSwxNy45M1YxMS41SDMuMDdBNy41MSw3LjUxLDAsMCwwLDkuNSwxNy45M1oiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik05LjUsMy4wN0E3LjUxLDcuNTEsMCwwLDAsMy4wNyw5LjVIOS41WiIvPjwvZz48L3N2Zz4=";
                break;
            case NodeMaterialBlockConnectionPointTypes.Matrix:
                this._img.src =
                    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5NYXRyaXg8L3RpdGxlPjxnIGlkPSJMYXllcl81IiBkYXRhLW5hbWU9IkxheWVyIDUiPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsNi4xMVY5LjVoMy4zOUE0LjUxLDQuNTEsMCwwLDAsMTEuNSw2LjExWiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsMTQuODlhNC41MSw0LjUxLDAsMCwwLDMuMzktMy4zOUgxMS41WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsMy4wN3YyQTUuNTQsNS41NCwwLDAsMSwxNS45Miw5LjVoMkE3LjUxLDcuNTEsMCwwLDAsMTEuNSwzLjA3WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTE1LjkyLDExLjVhNS41NCw1LjU0LDAsMCwxLTQuNDIsNC40MnYyYTcuNTEsNy41MSwwLDAsMCw2LjQzLTYuNDNaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNS4wOCwxMS41aC0yQTcuNTEsNy41MSwwLDAsMCw5LjUsMTcuOTN2LTJBNS41NCw1LjU0LDAsMCwxLDUuMDgsMTEuNVoiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik05LjUsMy4wN0E3LjUxLDcuNTEsMCwwLDAsMy4wNyw5LjVoMkE1LjU0LDUuNTQsMCwwLDEsOS41LDUuMDhaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNOS41LDExLjVINi4xMUE0LjUxLDQuNTEsMCwwLDAsOS41LDE0Ljg5WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTkuNSw2LjExQTQuNTEsNC41MSwwLDAsMCw2LjExLDkuNUg5LjVaIi8+PC9nPjwvc3ZnPg==";
                break;
            case NodeMaterialBlockConnectionPointTypes.Object:
                this._img.src =
                    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMSIgaGVpZ2h0PSIyMSIgdmlld0JveD0iMCAwIDIxIDIxIj48Y2lyY2xlIGN4PSI3LjEiIGN5PSIxMy4wOCIgcj0iMy4yNSIgc3R5bGU9ImZpbGw6I2ZmZiIvPjxwYXRoIGQ9Ik0xMC40OSwzQTcuNTIsNy41MiwwLDAsMCwzLDEwYTUuMTMsNS4xMywwLDEsMSw2LDcuODUsNy42MSw3LjYxLDAsMCwwLDEuNTIuMTYsNy41Miw3LjUyLDAsMCwwLDAtMTVaIiBzdHlsZT0iZmlsbDojZmZmIi8+PC9zdmc+";
                this._img.style.width = "100%"; // it's so that the svg is correctly centered inside the outer circle
                this._img.style.height = "100%";
                break;
        }
    }

    public constructor(portContainer: HTMLElement, public connectionPoint: NodeMaterialConnectionPoint, public node: GraphNode, stateManager: StateManager) {
        this._element = portContainer.ownerDocument!.createElement("div");
        this._element.classList.add("port");
        portContainer.appendChild(this._element);
        this._stateManager = stateManager;

        this._img = portContainer.ownerDocument!.createElement("img");
        this._element.appendChild(this._img);

        // determine if node name is editable
        if (portContainer.children[0].className === "port-label") {
            this._portLabelElement = portContainer.children[0];
        }

        (this._element as any).port = this;

        // Drag support
        this._element.ondragstart = () => false;

        this._onCandidateLinkMovedObserver = stateManager.onCandidateLinkMoved.add((coords) => {
            const rect = this._element.getBoundingClientRect();

            if (!coords || rect.left > coords.x || rect.right < coords.x || rect.top > coords.y || rect.bottom < coords.y) {
                this._element.classList.remove("selected");
                return;
            }

            this._element.classList.add("selected");
            this._stateManager.onCandidatePortSelectedObservable.notifyObservers(this);
        });

        this._onSelectionChangedObserver = this._stateManager.onSelectionChangedObservable.add((options) => {
            const { selection } = options || {};
            if (selection === this) {
                this._img.classList.add("selected");
            } else {
                this._img.classList.remove("selected");
            }
        });

        this.refresh();
    }

    public dispose() {
        this._stateManager.onCandidateLinkMoved.remove(this._onCandidateLinkMovedObserver);

        if (this._onSelectionChangedObserver) {
            this._stateManager.onSelectionChangedObservable.remove(this._onSelectionChangedObserver);
        }
    }

    public static CreatePortElement(
        connectionPoint: NodeMaterialConnectionPoint,
        node: GraphNode,
        root: HTMLElement,
        displayManager: Nullable<IDisplayManager>,
        stateManager: StateManager
    ) {
        const portContainer = root.ownerDocument!.createElement("div");
        const block = connectionPoint.ownerBlock;

        portContainer.classList.add("portLine");

        root.appendChild(portContainer);

        if (!displayManager || displayManager.shouldDisplayPortLabels(block)) {
            const portLabel = root.ownerDocument!.createElement("div");
            portLabel.classList.add("port-label");
            portLabel.innerHTML = connectionPoint.displayName || connectionPoint.name;
            portContainer.appendChild(portLabel);
        }

        return new NodePort(portContainer, connectionPoint, node, stateManager);
    }
}
