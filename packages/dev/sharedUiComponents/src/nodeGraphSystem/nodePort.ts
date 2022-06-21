import type { NodeMaterialConnectionPoint } from "core/Materials/Node/nodeMaterialBlockConnectionPoint";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import type { Vector2 } from "core/Maths/math.vector";
import type { IDisplayManager } from "../../../../dev/sharedUiComponents/src/nodeGraphSystem/interfaces/displayManager";
import type { GraphNode } from "./graphNode";
import type { FrameNodePort } from "../../../../dev/sharedUiComponents/src/nodeGraphSystem/frameNodePort";
import { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import { ISelectionChangedOptions } from "shared-ui-components/nodeGraphSystem/interfaces/selectionChangedOptions";

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
        this._stateManager.applyNodePortDesign(this.connectionPoint.type, this._element, this._img);
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
