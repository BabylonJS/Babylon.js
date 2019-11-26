import { GraphNode } from './graphNode';
import { GraphCanvasComponent } from './graphCanvas';
import { Nullable } from 'babylonjs/types';
import { Observer } from 'babylonjs/Misc/observable';
import { NodeLink } from './nodeLink';

export class GraphNodeGroup {
    private _name: string;
    private _x = 0;
    private _y = 0;
    private _gridAlignedX = 0;
    private _gridAlignedY = 0;    
    public width: number;
    public height: number;
    public element: HTMLDivElement;    
    private _nodes: GraphNode[] = [];
    private _ownerCanvas: GraphCanvasComponent;
    private _mouseStartPointX: Nullable<number> = null;
    private _mouseStartPointY: Nullable<number> = null;
    private _onSelectionChangedObserver: Nullable<Observer<Nullable<GraphNode | NodeLink | GraphNodeGroup>>>;   

    public get nodes() {
        return this._nodes;
    }

    public get gridAlignedX() {
        return this._gridAlignedX;
    }

    public get gridAlignedY() {
        return this._gridAlignedY;
    }

    public get name() {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
        this.element.innerHTML = value;
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

    public constructor(candidate: HTMLDivElement, canvas: GraphCanvasComponent) {
        this._ownerCanvas = canvas;
        const root = canvas.groupContainer;
        this.element = root.ownerDocument!.createElement("div");        
        this.element.classList.add("group-box");
        root.appendChild(this.element);

        this.x = parseFloat(candidate.style.left!.replace("px", ""));
        this.y = parseFloat(candidate.style.top!.replace("px", ""));
        this.width = parseFloat(candidate.style.width!.replace("px", ""));
        this.height = parseFloat(candidate.style.height!.replace("px", ""));

        this.cleanAccumulation();        

        this.element.style.width = `${this.width / canvas.zoom}px`;
        this.element.style.height = `${this.height / canvas.zoom}px`;
        
        this.element.addEventListener("pointerdown", evt => this._onDown(evt));
        this.element.addEventListener("pointerup", evt => this._onUp(evt));
        this.element.addEventListener("pointermove", evt => this._onMove(evt));

        this._onSelectionChangedObserver = canvas.globalState.onSelectionChangedObservable.add(node => {
            if (node === this) {
                this.element.classList.add("selected");
            } else {
                this.element.classList.remove("selected");
            }
        });        
    }

    public cleanAccumulation() {
        this.x = this.gridAlignedX;
        this.y = this.gridAlignedY;
    }

    private _onDown(evt: PointerEvent) {
        evt.stopPropagation();

        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;        
        
        this.element.setPointerCapture(evt.pointerId);
        this._ownerCanvas.globalState.onSelectionChangedObservable.notifyObservers(this);

        // Get nodes
        this._nodes = [];
        this._ownerCanvas.globalState.onGroupAboutToMove.notifyObservers(this);
    }    

    private _onUp(evt: PointerEvent) {
        evt.stopPropagation();

        for (var selectedNode of this._nodes) {
            selectedNode.cleanAccumulation();
        }

        this.cleanAccumulation();
        this._mouseStartPointX = null;
        this._mouseStartPointY = null;
        this.element.releasePointerCapture(evt.pointerId);
    }

    private _onMove(evt: PointerEvent) {
        if (this._mouseStartPointX === null || this._mouseStartPointY === null || evt.ctrlKey) {
            return;
        }

        let newX = (evt.clientX - this._mouseStartPointX) / this._ownerCanvas.zoom;
        let newY = (evt.clientY - this._mouseStartPointY) / this._ownerCanvas.zoom;

        for (var selectedNode of this._nodes) {
            selectedNode.x += newX;
            selectedNode.y += newY;
        }

        this.x += newX;
        this.y += newY;

        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;   

        evt.stopPropagation();
    }

    public dispose() {
        if (this._onSelectionChangedObserver) {
            this._ownerCanvas.globalState.onSelectionChangedObservable.remove(this._onSelectionChangedObserver);
        }

        this.element.parentElement!.removeChild(this.element);
    }
}