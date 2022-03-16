import { GraphCanvasComponent } from "./graphCanvas";
import { GraphNode } from "./graphNode";
import { NodePort } from "./nodePort";
import { Nullable } from "core/types";
import { Observer, Observable } from "core/Misc/observable";
import { FrameNodePort } from "./frameNodePort";
import { ISelectionChangedOptions } from "../globalState";
import { ElbowBlock } from "core/Materials/Node/Blocks/elbowBlock";

export class NodeLink {
    private _graphCanvas: GraphCanvasComponent;
    private _portA: NodePort | FrameNodePort;
    private _portB?: NodePort | FrameNodePort;
    private _nodeA: GraphNode;
    private _nodeB?: GraphNode;
    private _path: SVGPathElement;
    private _selectionPath: SVGPathElement;
    private _onSelectionChangedObserver: Nullable<Observer<Nullable<ISelectionChangedOptions>>>;
    private _isVisible = true;

    public onDisposedObservable = new Observable<NodeLink>();

    public get isVisible() {
        return this._isVisible;
    }

    public set isVisible(value: boolean) {
        this._isVisible = value;

        if (!value) {
            this._path.classList.add("hidden");
            this._selectionPath.classList.add("hidden");
        } else {
            this._path.classList.remove("hidden");
            this._selectionPath.classList.remove("hidden");
        }

        this.update();
    }

    public get portA() {
        return this._portA;
    }

    public get portB() {
        return this._portB;
    }

    public get nodeA() {
        return this._nodeA;
    }

    public get nodeB() {
        return this._nodeB;
    }

    public update(endX = 0, endY = 0, straight = false) {
        const rectA = this._portA.element.getBoundingClientRect();
        const rootRect = this._graphCanvas.canvasContainer.getBoundingClientRect();
        const zoom = this._graphCanvas.zoom;
        const xOffset = rootRect.left;
        const yOffset = rootRect.top;

        const startX = (rectA.left - xOffset + 0.5 * rectA.width) / zoom;
        const startY = (rectA.top - yOffset + 0.5 * rectA.height) / zoom;

        if (this._portB) {
            const rectB = this._portB.element.getBoundingClientRect();
            endX = (rectB.left - xOffset + 0.5 * rectB.width) / zoom;
            endY = (rectB.top - yOffset + 0.5 * rectB.height) / zoom;
        }

        if (straight) {
            this._path.setAttribute("d", `M${startX},${startY} L${endX},${endY}`);
            this._path.setAttribute("stroke-dasharray", "10, 10");
            this._path.setAttribute("stroke-linecap", "round");
        } else {
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const tangentLength = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 0.5, 300);
            this._path.setAttribute("d", `M${startX},${startY} C${startX + tangentLength},${startY} ${endX - tangentLength},${endY} ${endX},${endY}`);
            this._selectionPath.setAttribute("d", `M${startX},${startY} C${startX + tangentLength},${startY} ${endX - tangentLength},${endY} ${endX},${endY}`);
        }
        this._path.setAttribute("stroke", this._portA.element.style.backgroundColor!);
    }

    public constructor(graphCanvas: GraphCanvasComponent, portA: NodePort, nodeA: GraphNode, portB?: NodePort, nodeB?: GraphNode) {
        this._portA = portA;
        this._portB = portB;
        this._nodeA = nodeA;
        this._nodeB = nodeB;
        this._graphCanvas = graphCanvas;

        const document = portA.element.ownerDocument!;
        const svg = graphCanvas.svgCanvas;

        // Create path
        this._path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this._path.setAttribute("fill", "none");
        this._path.classList.add("link");

        svg.appendChild(this._path);

        this._selectionPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this._selectionPath.setAttribute("fill", "none");
        this._selectionPath.classList.add("selection-link");

        svg.appendChild(this._selectionPath);

        this._selectionPath.onmousedown = (evt: MouseEvent) => this.onClick(evt);

        if (this._portB) {
            // Update
            this.update();
        }

        this._onSelectionChangedObserver = this._graphCanvas.globalState.onSelectionChangedObservable.add((options) => {
            const { selection } = options || {};
            if (selection === this) {
                this._path.classList.add("selected");
                this._selectionPath.classList.add("selected");
            } else {
                this._path.classList.remove("selected");
                this._selectionPath.classList.remove("selected");
            }
        });
    }

    onClick(evt: MouseEvent) {
        if (evt.altKey) {
            // Create an elbow at the clicked location
            this._graphCanvas.globalState.onNewNodeCreatedObservable.addOnce((newNode) => {
                const newElbowBlock = newNode.block as ElbowBlock;
                const nodeA = this._nodeA;
                const pointA = this._portA.connectionPoint;
                const nodeB = this._nodeB!;
                const pointB = this._portB!.connectionPoint;

                // Delete previous link
                this.dispose();

                // Connect to Elbow block
                this._graphCanvas.connectNodes(nodeA, pointA, newNode, newElbowBlock.input);
                this._graphCanvas.connectNodes(newNode, newElbowBlock.output, nodeB, pointB);

                this._graphCanvas.globalState.onRebuildRequiredObservable.notifyObservers(true);
            });

            this._graphCanvas.globalState.onNewBlockRequiredObservable.notifyObservers({
                type: "ElbowBlock",
                targetX: evt.clientX,
                targetY: evt.clientY,
                needRepositioning: true,
            });
            return;
        }

        this._graphCanvas.globalState.onSelectionChangedObservable.notifyObservers({ selection: this });
    }

    public dispose(notify = true) {
        this._graphCanvas.globalState.onSelectionChangedObservable.remove(this._onSelectionChangedObserver);

        if (this._path.parentElement) {
            this._path.parentElement.removeChild(this._path);
        }

        if (this._selectionPath.parentElement) {
            this._selectionPath.parentElement.removeChild(this._selectionPath);
        }

        if (this._nodeB) {
            this._nodeA.links.splice(this._nodeA.links.indexOf(this), 1);
            this._nodeB.links.splice(this._nodeB.links.indexOf(this), 1);
            this._graphCanvas.links.splice(this._graphCanvas.links.indexOf(this), 1);

            this._portA.connectionPoint.disconnectFrom(this._portB!.connectionPoint);

            GraphCanvasComponent._RefreshNode(this._nodeB);
        }

        if (notify) {
            this.onDisposedObservable.notifyObservers(this);

            this.onDisposedObservable.clear();
        }
    }
}
