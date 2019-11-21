import * as React from "react";
import { GlobalState } from '../globalState';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { GraphNode } from './graphNode';
import * as dagre from 'dagre';
import { Nullable } from 'babylonjs/types';
import { NodeMaterialConnectionPoint } from 'babylonjs';
import { NodeLink } from './nodeLink';

require("./graphCanvas.scss");

export interface IGraphCanvasComponentProps {
    globalState: GlobalState
}

export class GraphCanvasComponent extends React.Component<IGraphCanvasComponentProps> {
    private _graphCanvas: HTMLDivElement;
    private _svgCanvas: HTMLElement;
    private _rootContainer: HTMLDivElement;
    private _nodes: GraphNode[] = [];
    private _links: NodeLink[] = [];
    private _mouseStartPointX: Nullable<number> = null;
    private _mouseStartPointY: Nullable<number> = null
    private _x = 0;
    private _y = 0;
    private _zoom = 1;
    private _selectedNodes: GraphNode[] = [];

    public get nodes() {
        return this._nodes;
    }

    public get links() {
        return this._links;
    }

    public get zoom() {
        return this._zoom;
    }

    public set zoom(value: number) {
        this._zoom = value;
        this._rootContainer.style.transform = `scale(${value})`;
    }    

    public get x() {
        return this._x;
    }

    public set x(value: number) {
        this._x = value;
        this._rootContainer.style.left = `${value}px`;
    }

    public get y() {
        return this._y;
    }

    public set y(value: number) {
        this._y = value;
        this._rootContainer.style.top = `${value}px`;
    }

    public get selectedNodes() {
        return this._selectedNodes;
    }

    public get canvasContainer() {
        return this._graphCanvas;
    }

    constructor(props: IGraphCanvasComponentProps) {
        super(props);

        props.globalState.onSelectionChangedObservable.add(node => {
            if (!node) {
                this._selectedNodes = [];
            } else {
                this._selectedNodes = [node];
            }
        });
    }

    findNodeFromBlock(block: NodeMaterialBlock) {
        return this.nodes.filter(n => n.block === block)[0];
    }

    reset() {
        for (var node of this._nodes) {
            node.dispose();
        }
        this._nodes = [];
        this._links = [];
        this._graphCanvas.innerHTML = "";
        this._svgCanvas.innerHTML = "";
    }

    connectPorts(pointA: NodeMaterialConnectionPoint, pointB: NodeMaterialConnectionPoint) {
        var blockA = pointA.ownerBlock;
        var blockB = pointB.ownerBlock;
        var nodeA = this.findNodeFromBlock(blockA);
        var nodeB = this.findNodeFromBlock(blockB);

        if (!nodeA || !nodeB) {
            return;
        }

        var portA = nodeA.getPortForConnectionPoint(pointA);
        var portB = nodeB.getPortForConnectionPoint(pointB);

        if (!portA || !portB) {
            return;
        }

        for (var currentLink of this._links) {
            if (currentLink.portA === portA && currentLink.portB === portB) {
                return;
            }
            if (currentLink.portA === portB && currentLink.portB === portA) {
                return;
            }
        }

        const link = new NodeLink(this, portA, nodeA, portB, nodeB);
        this._links.push(link);

        nodeA.links.push(link);
        nodeB.links.push(link);
    }

    removeLink(link: NodeLink) {
        let index = this._links.indexOf(link);

        if (index > -1) {
            this._links.splice(index, 1);
        }

        link.dispose();
    }

    appendBlock(block: NodeMaterialBlock) {
        let newNode = new GraphNode(block, this.props.globalState);

        newNode.appendVisual(this._graphCanvas, this);

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
        this._rootContainer = this.props.globalState.hostDocument.getElementById("graph-container") as HTMLDivElement;
        this._graphCanvas = this.props.globalState.hostDocument.getElementById("graph-canvas-container") as HTMLDivElement;
        this._svgCanvas = this.props.globalState.hostDocument.getElementById("graph-svg-container") as HTMLElement;
    }    

    onMove(evt: React.PointerEvent) {        
        this._rootContainer.style.cursor = "move";

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
        this._rootContainer.setPointerCapture(evt.pointerId);
    }

    onUp(evt: React.PointerEvent) {
        this._mouseStartPointX = null;
        this._mouseStartPointY = null;
        this._rootContainer.releasePointerCapture(evt.pointerId);
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
        const xFactor = this._rootContainer.clientWidth / this._rootContainer.scrollWidth;
        const yFactor = this._rootContainer.clientHeight / this._rootContainer.scrollHeight;
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
                <div id="graph-container">
                    <div id="graph-canvas-container">
                    </div>     
                    <svg id="graph-svg-container">
                    </svg>
                </div>
            </div>
        );
    }
}
