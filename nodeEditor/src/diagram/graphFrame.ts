import { GraphNode } from './graphNode';
import { GraphCanvasComponent } from './graphCanvas';
import { Nullable } from 'babylonjs/types';
import { Observer } from 'babylonjs/Misc/observable';
import { NodeLink } from './nodeLink';
import { IFrameData } from '../nodeLocationInfo';
import { Color3 } from 'babylonjs/Maths/math.color';

export class GraphFrame {
    private _name: string;
    private _color: Color3;
    private _x = 0;
    private _y = 0;
    private _gridAlignedX = 0;
    private _gridAlignedY = 0;    
    private _width: number;
    private _height: number;
    public element: HTMLDivElement;   
    private _headerElement: HTMLDivElement;    
    private _nodes: GraphNode[] = [];
    private _ownerCanvas: GraphCanvasComponent;
    private _mouseStartPointX: Nullable<number> = null;
    private _mouseStartPointY: Nullable<number> = null;
    private _onSelectionChangedObserver: Nullable<Observer<Nullable<GraphNode | NodeLink | GraphFrame>>>;   

    public get nodes() {
        return this._nodes;
    }

    public get name() {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
        this._headerElement.innerHTML = value;
    }

    public get color() {
        return this._color;
    }

    public set color(value: Color3) {
        this._color = value;
        this._headerElement.style.background = `rgba(${value.r * 255}, ${value.g * 255}, ${value.b * 255}, 1)`;
        this._headerElement.style.borderColor = `rgba(${value.r * 255}, ${value.g * 255}, ${value.b * 255}, 1)`;
        this.element.style.background = `rgba(${value.r * 255}, ${value.g * 255}, ${value.b * 255}, 0.7)`;
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
    
    public get width() {
        return this._width;
    }

    public set width(value: number) {
        if (this._width === value) {
            return;
        }
        this._width = value;
        
        var gridAlignedRight = this._ownerCanvas.getGridPositionCeil(value + this._gridAlignedX);

        this.element.style.width = `${gridAlignedRight - this._gridAlignedX}px`;
    }

    public get height() {
        return this._height;
    }

    public set height(value: number) {
        if (this._height === value) {
            return;
        }
        this._height = value;
        
        var gridAlignedBottom = this._ownerCanvas.getGridPositionCeil(value + this._gridAlignedY);

        this.element.style.height = `${gridAlignedBottom - this._gridAlignedY}px`;
    }

    public constructor(candidate: Nullable<HTMLDivElement>, canvas: GraphCanvasComponent) {
        this._ownerCanvas = canvas;
        const root = canvas.frameContainer;
        this.element = root.ownerDocument!.createElement("div");        
        this.element.classList.add("frame-box");
        root.appendChild(this.element);

        this._headerElement = root.ownerDocument!.createElement("div");  
        this._headerElement.classList.add("frame-box-header");
        this.element.appendChild(this._headerElement);

        this.name = "Frame";
        this.color = Color3.FromInts(72, 72, 72);

        if (candidate) {
            this.x = parseFloat(candidate.style.left!.replace("px", ""));
            this.y = parseFloat(candidate.style.top!.replace("px", ""));
            this.width = parseFloat(candidate.style.width!.replace("px", ""));
            this.height = parseFloat(candidate.style.height!.replace("px", ""));

            this.cleanAccumulation();        
        }
        
        this._headerElement.addEventListener("pointerdown", evt => this._onDown(evt));
        this._headerElement.addEventListener("pointerup", evt => this._onUp(evt));
        this._headerElement.addEventListener("pointermove", evt => this._onMove(evt));

        this._onSelectionChangedObserver = canvas.globalState.onSelectionChangedObservable.add(node => {
            if (node === this) {
                this.element.classList.add("selected");
            } else {
                this.element.classList.remove("selected");
            }
        });  
                
        // Get nodes
        this._nodes = [];
        this._ownerCanvas.globalState.onFrameCreated.notifyObservers(this);
    }

    public syncNode(node: GraphNode) {
        if (node.isOverlappingFrame(this)) {
            let index = this.nodes.indexOf(node);

            if (index === -1) {
                this.nodes.push(node);
            }
        } else {
            let index = this.nodes.indexOf(node);

            if (index > -1) {
                this.nodes.splice(index, 1);
            }
        }
    }

    public cleanAccumulation() {
        this.x = this._gridAlignedX;
        this.y = this._gridAlignedY;
    }

    private _onDown(evt: PointerEvent) {
        evt.stopPropagation();

        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;        
        
        this._headerElement.setPointerCapture(evt.pointerId);
        this._ownerCanvas.globalState.onSelectionChangedObservable.notifyObservers(this);

        this._ownerCanvas._frameIsMoving = true;
    }    

    private _onUp(evt: PointerEvent) {
        evt.stopPropagation();

        for (var selectedNode of this._nodes) {
            selectedNode.cleanAccumulation();
        }

        this.cleanAccumulation();
        this._mouseStartPointX = null;
        this._mouseStartPointY = null;
        this._headerElement.releasePointerCapture(evt.pointerId);

        this._ownerCanvas._frameIsMoving = false;
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

        
        this._ownerCanvas.frames.splice(this._ownerCanvas.frames.indexOf(this), 1);
    }

    public serialize(): IFrameData {
        return {
            x: this._x,
            y: this._y,
            width: this._width,
            height: this._height,
            color: this._color.asArray(),
            name: this.name
        }
    }

    public static Parse(serializationData: IFrameData, canvas: GraphCanvasComponent) {
        let newFrame = new GraphFrame(null, canvas);

        newFrame.x = serializationData.x;
        newFrame.y = serializationData.y;
        newFrame.width = serializationData.width;
        newFrame.height = serializationData.height;
        newFrame.name = serializationData.name;
        newFrame.color = Color3.FromArray(serializationData.color);

        return newFrame;
    }
}