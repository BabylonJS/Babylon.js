import { GraphCanvasComponent, FramePortData } from './graphCanvas';
import { GraphNode } from './graphNode';
import { NodePort } from './nodePort';
import { Nullable } from 'babylonjs/types';
import { Observer, Observable } from 'babylonjs/Misc/observable';
import { GraphFrame } from './graphFrame';
import { FrameNodePort } from './frameNodePort';

export class NodeLink {
    private _graphCanvas: GraphCanvasComponent;
    private _portA: NodePort | FrameNodePort;
    private _portB?: NodePort | FrameNodePort;
    private _nodeA: GraphNode;
    private _nodeB?: GraphNode;
    private _path: SVGPathElement;
    private _selectionPath: SVGPathElement;
    private _onSelectionChangedObserver: Nullable<Observer<Nullable<GraphFrame | GraphNode | NodeLink | NodePort | FramePortData>>>;  
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

        var startX = (rectA.left - xOffset + 0.5 * rectA.width) / zoom;
        var startY = (rectA.top - yOffset + 0.5 * rectA.height) / zoom;

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

        var document = portA.element.ownerDocument!;
        var svg = graphCanvas.svgCanvas;

        // Create path
        this._path = document.createElementNS('http://www.w3.org/2000/svg', "path");
        this._path.setAttribute("fill", "none");
        this._path.classList.add("link");

        svg.appendChild(this._path);

        this._selectionPath = document.createElementNS('http://www.w3.org/2000/svg', "path");
        this._selectionPath.setAttribute("fill", "none");
        this._selectionPath.classList.add("selection-link");

        svg.appendChild(this._selectionPath);

        this._selectionPath.onmousedown = () => this.onClick();

        if (this._portB) {
            // Update
            this.update();
        }

        this._onSelectionChangedObserver = this._graphCanvas.globalState.onSelectionChangedObservable.add((selection) => {
            if (selection === this) {
                this._path.classList.add("selected");
                this._selectionPath.classList.add("selected");
            } else {
                this._path.classList.remove("selected");
                this._selectionPath.classList.remove("selected");
            }
        });
    }

    onClick() {
        this._graphCanvas.globalState.onSelectionChangedObservable.notifyObservers(this);
    }

    public dispose() {
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
        }

        this.onDisposedObservable.notifyObservers(this);

        this.onDisposedObservable.clear();
    }
}