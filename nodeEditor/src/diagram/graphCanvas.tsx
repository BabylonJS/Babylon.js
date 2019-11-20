import * as React from "react";
import { GlobalState } from '../globalState';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { GraphNode } from './graphNode';
import * as dagre from 'dagre';
import { Nullable } from 'babylonjs';

require("./graphCanvas.scss");

export interface IGraphCanvasComponentProps {
    globalState: GlobalState
}

export class GraphCanvasComponent extends React.Component<IGraphCanvasComponentProps> {
    private _rootCanvas: HTMLDivElement;
    private _nodes: GraphNode[] = [];
    private _mouseStartPointX: Nullable<number> = null;
    private _mouseStartPointY: Nullable<number> = null
    private _x = 0;
    private _y = 0;
    private _zoom = 1;

    public get nodes() {
        return this._nodes;
    }

    public get zoom() {
        return this._zoom;
    }

    public set zoom(value: number) {
        this._zoom = value;
        this._rootCanvas.style.transform = `scale(${value})`;
    }    

    public get x() {
        return this._x;
    }

    public set x(value: number) {
        this._x = value;
        this._rootCanvas.style.left = `${value}px`;
    }

    public get y() {
        return this._y;
    }

    public set y(value: number) {
        this._y = value;
        this._rootCanvas.style.top = `${value}px`;
    }

    constructor(props: IGraphCanvasComponentProps) {
        super(props);
    }

    reset() {
        this._nodes = [];
        this._rootCanvas.innerHTML = "";
    }

    appendBlock(block: NodeMaterialBlock) {
        let newNode = new GraphNode(block, this.props.globalState);

        newNode.appendVisual(this._rootCanvas, this);

        this._nodes.push(newNode);

        return newNode;
    }

    distributeGraph() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;

        let graph = new dagre.graphlib.Graph();
        graph.setGraph({});
        graph.setDefaultEdgeLabel(() => ({}));
        graph.graph().rankdir = "LR";

        // Build dagre graph
        this._nodes.forEach(node => {
            graph.setNode(node.id.toString(), {
                id: node.id,
                width: node.width,
                height: node.height
            });
        });

        this._nodes.forEach(node => {
            node.block.outputs.forEach(output => {
                if (!output.hasEndpoints) {
                    return;
                }

                output.endpoints.forEach(endpoint => {
                    graph.setEdge(node.id.toString(), endpoint.ownerBlock.uniqueId.toString());
                });
            });
        });

        // Distribute
        dagre.layout(graph);

        // Update graph
        let dagreNodes = graph.nodes().map(node => graph.node(node));
        dagreNodes.forEach(dagreNode => {
            for (var node of this._nodes) {
                if (node.id === dagreNode.id) {
                    node.x = dagreNode.x - dagreNode.width / 2;
                    node.y = dagreNode.y - dagreNode.height / 2;
                    return;
                }
            }
        });        
    }

    componentDidMount() {
        this._rootCanvas = this.props.globalState.hostDocument.getElementById("graph-canvas-container") as HTMLDivElement;
    }    

    onMove(evt: React.PointerEvent) {        
        this._rootCanvas.style.cursor = "move";

        if (this._mouseStartPointX === null || this._mouseStartPointY === null) {
            return;
        }
        this.x += evt.clientX - this._mouseStartPointX;
        this.y += evt.clientY - this._mouseStartPointY;

        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;
    }

    onDown(evt: React.PointerEvent) {
        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;
        this._rootCanvas.setPointerCapture(evt.pointerId);
    }

    onUp(evt: React.PointerEvent) {
        this._mouseStartPointX = null;
        this._mouseStartPointY = null;
        this._rootCanvas.releasePointerCapture(evt.pointerId);
    }

    onWheel(evt: React.WheelEvent) {
        let delta = -evt.deltaY / 50;

        if (evt.ctrlKey && delta % 1 !== 0) {
            delta /= 3;
        } else {
            delta /= 60;
        }

        this.zoom = Math.min(Math.max(0.4, this.zoom + delta), 4);

        evt.stopPropagation();
    }

    zoomToFit() {
        const xFactor = this._rootCanvas.clientWidth / this._rootCanvas.scrollWidth;
        const yFactor = this._rootCanvas.clientHeight / this._rootCanvas.scrollHeight;
        const zoomFactor = xFactor < yFactor ? xFactor : yFactor;
        
        this.zoom = zoomFactor;
        this.x = 0;
        this.y = 0;
    }
 
    render() {
        return (
            <div id="graph-canvas" 
                onWheel={evt => this.onWheel(evt)}
                onPointerMove={evt => this.onMove(evt)}
                onPointerDown={evt =>  this.onDown(evt)}   
                onPointerUp={evt =>  this.onUp(evt)}   
            >    
                <div id="graph-canvas-container">
                </div>     
            </div>
        );
    }
}
