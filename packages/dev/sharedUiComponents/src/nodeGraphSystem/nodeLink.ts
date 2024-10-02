import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { Observable } from "core/Misc/observable";
import type { FrameNodePort } from "./frameNodePort";
import type { NodePort } from "./nodePort";
import type { GraphNode } from "./graphNode";
import type { GraphCanvasComponent } from "./graphCanvas";
import type { ISelectionChangedOptions } from "./interfaces/selectionChangedOptions";
import { RefreshNode } from "./tools";
import commonStyles from "./common.modules.scss";
import styles from "./nodeLink.modules.scss";

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
    private _isTargetCandidate = false;

    public onDisposedObservable = new Observable<NodeLink>();

    public get isTargetCandidate() {
        return this._isTargetCandidate;
    }

    public set isTargetCandidate(value: boolean) {
        if (this._isTargetCandidate === value) {
            return;
        }

        this._isTargetCandidate = value;

        if (value) {
            this._path.classList.add(styles["target-candidate"]);
        } else {
            this._path.classList.remove(styles["target-candidate"]);
        }
    }

    public get isVisible() {
        return this._isVisible;
    }

    public set isVisible(value: boolean) {
        this._isVisible = value;

        if (!value) {
            this._path.classList.add(commonStyles["hidden"]);
            this._selectionPath.classList.add(commonStyles["hidden"]);
        } else {
            this._path.classList.remove(commonStyles["hidden"]);
            this._selectionPath.classList.remove(commonStyles["hidden"]);
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

    public intersectsWith(rect: DOMRect) {
        const locatRect = this._path.getBoundingClientRect();
        if (rect.left > locatRect.right || rect.right < locatRect.left || rect.top > locatRect.bottom || rect.bottom < locatRect.top) {
            return false;
        }

        const zoom = this._graphCanvas.zoom;
        const svg = this._graphCanvas.svgCanvas as any as SVGSVGElement;
        const rootRect = svg.getBoundingClientRect();

        const left = (rect.x - rootRect.x) / zoom;
        const top = (rect.y - rootRect.y) / zoom;
        const right = left + rect.width / zoom;
        const bottom = top + rect.height / zoom;

        const sampleRate = 10; // Checking 10 times on the path should be enough

        for (let index = 0; index < 1; index += 1 / sampleRate) {
            const point = this._path.getPointAtLength(index * this._path.getTotalLength());
            if (left < point.x && right > point.x && top < point.y && bottom > point.y) {
                return true;
            }
        }

        return false;
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

    public get path() {
        return this._path;
    }

    public get selectionPath() {
        return this._selectionPath;
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
        this._path.classList.add(styles["link"]);

        svg.appendChild(this._path);

        this._selectionPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this._selectionPath.setAttribute("fill", "none");
        this._selectionPath.classList.add(styles["selection-link"]);

        svg.appendChild(this._selectionPath);

        this._selectionPath.onmousedown = (evt: MouseEvent) => this.onClick(evt);

        if (this._portB) {
            // Update
            this.update();
        }

        this._onSelectionChangedObserver = this._graphCanvas.stateManager.onSelectionChangedObservable.add((options) => {
            const { selection } = options || {};
            if (selection === this) {
                this._path.classList.add(styles["selected"]);
                this._selectionPath.classList.add(styles["selected"]);
            } else {
                this._path.classList.remove(styles["selected"]);
                this._selectionPath.classList.remove(styles["selected"]);
            }
        });
    }

    onClick(evt: MouseEvent) {
        const stateManager = this._graphCanvas.stateManager;
        const nodeA = this._nodeA;
        const pointA = this._portA.portData;
        const nodeB = this._nodeB!;
        const pointB = this._portB!.portData;

        const reconnect = (newNode: GraphNode) => {
            const newBlock = newNode.content.data as any;

            // Delete previous link
            this.dispose();

            // Connect to the new block
            this._graphCanvas.connectNodes(nodeA, pointA, newNode, newNode.getPortDataForPortDataContent(newBlock.input)!);
            this._graphCanvas.connectNodes(newNode, newNode.getPortDataForPortDataContent(newBlock.output)!, nodeB, pointB);

            stateManager.onRebuildRequiredObservable.notifyObservers();
        };

        if (evt.altKey) {
            if (!stateManager.isElbowConnectionAllowed(this._portA, this._portB!)) {
                return;
            }

            // Create an elbow at the clicked location
            stateManager.onNewNodeCreatedObservable.addOnce(reconnect);

            stateManager.onNewBlockRequiredObservable.notifyObservers({
                type: "ElbowBlock",
                targetX: evt.clientX,
                targetY: evt.clientY,
                needRepositioning: true,
            });

            // Make sure the undo/redo stack is reverted as we did 2 actions (create and connect)
            stateManager.historyStack.collapseLastTwo();

            return;
        }

        if (evt.ctrlKey) {
            if (!stateManager.isDebugConnectionAllowed(this._portA, this._portB!)) {
                return;
            }

            // Create a debug at the clicked location
            stateManager.onNewNodeCreatedObservable.addOnce(reconnect);

            stateManager.onNewBlockRequiredObservable.notifyObservers({
                type: "DebugBlock",
                targetX: evt.clientX,
                targetY: evt.clientY,
                needRepositioning: true,
            });

            // Make sure the undo/redo stack is reverted as we did 2 actions (create and connect)
            stateManager.historyStack.collapseLastTwo();
            return;
        }

        stateManager.onSelectionChangedObservable.notifyObservers({ selection: this });
    }

    public dispose(notify = true) {
        this._graphCanvas.stateManager.onSelectionChangedObservable.remove(this._onSelectionChangedObserver);

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

            this._portA.portData.disconnectFrom(this._portB!.portData);

            RefreshNode(this._nodeB, undefined, undefined, this._graphCanvas);
        }

        if (notify) {
            this.onDisposedObservable.notifyObservers(this);

            this.onDisposedObservable.clear();
        }
    }
}
