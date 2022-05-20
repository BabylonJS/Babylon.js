import * as React from "react";
import type { GlobalState } from "../globalState";
import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import { GraphNode } from "./graphNode";
import * as dagre from "dagre";
import type { Nullable } from "core/types";
import { NodeLink } from "./nodeLink";
import { NodePort } from "./nodePort";
import type { NodeMaterialConnectionPoint } from "core/Materials/Node/nodeMaterialBlockConnectionPoint";
import { NodeMaterialConnectionPointDirection, NodeMaterialConnectionPointCompatibilityStates } from "core/Materials/Node/nodeMaterialBlockConnectionPoint";
import { Vector2 } from "core/Maths/math.vector";
import type { FragmentOutputBlock } from "core/Materials/Node/Blocks/Fragment/fragmentOutputBlock";
import { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { DataStorage } from "core/Misc/dataStorage";
import { GraphFrame } from "./graphFrame";
import type { IEditorData, IFrameData } from "../nodeLocationInfo";
import { FrameNodePort } from "./frameNodePort";

import "./graphCanvas.scss";

export interface IGraphCanvasComponentProps {
    globalState: GlobalState;
    onEmitNewBlock: (block: NodeMaterialBlock) => GraphNode;
}

export type FramePortData = {
    frame: GraphFrame;
    port: FrameNodePort;
};

export const isFramePortData = (variableToCheck: any): variableToCheck is FramePortData => {
    if (variableToCheck) {
        return (variableToCheck as FramePortData).port !== undefined;
    } else {
        return false;
    }
};

export class GraphCanvasComponent extends React.Component<IGraphCanvasComponentProps> {
    private readonly _minZoom = 0.1;
    private readonly _maxZoom = 4;

    private _hostCanvas: HTMLDivElement;
    private _graphCanvas: HTMLDivElement;
    private _selectionContainer: HTMLDivElement;
    private _frameContainer: HTMLDivElement;
    private _svgCanvas: HTMLElement;
    private _rootContainer: HTMLDivElement;
    private _nodes: GraphNode[] = [];
    private _links: NodeLink[] = [];
    private _mouseStartPointX: Nullable<number> = null;
    private _mouseStartPointY: Nullable<number> = null;
    private _dropPointX = 0;
    private _dropPointY = 0;
    private _selectionStartX = 0;
    private _selectionStartY = 0;
    private _candidateLinkedHasMoved = false;
    private _x = 0;
    private _y = 0;
    private _zoom = 1;
    private _selectedNodes: GraphNode[] = [];
    private _selectedLink: Nullable<NodeLink> = null;
    private _selectedPort: Nullable<NodePort> = null;
    private _candidateLink: Nullable<NodeLink> = null;
    private _candidatePort: Nullable<NodePort | FrameNodePort> = null;
    private _gridSize = 20;
    private _selectionBox: Nullable<HTMLDivElement> = null;
    private _selectedFrames: GraphFrame[] = [];
    private _frameCandidate: Nullable<HTMLDivElement> = null;
    private _frames: GraphFrame[] = [];

    private _altKeyIsPressed = false;
    private _ctrlKeyIsPressed = false;
    private _oldY = -1;

    public _frameIsMoving = false;
    public _isLoading = false;

    public get gridSize() {
        return this._gridSize;
    }

    public set gridSize(value: number) {
        this._gridSize = value;

        this.updateTransform();
    }

    public get globalState() {
        return this.props.globalState;
    }

    public get nodes() {
        return this._nodes;
    }

    public get links() {
        return this._links;
    }

    public get frames() {
        return this._frames;
    }

    public get zoom() {
        return this._zoom;
    }

    public set zoom(value: number) {
        if (this._zoom === value) {
            return;
        }

        this._zoom = value;

        this.updateTransform();
    }

    public get x() {
        return this._x;
    }

    public set x(value: number) {
        this._x = value;

        this.updateTransform();
    }

    public get y() {
        return this._y;
    }

    public set y(value: number) {
        this._y = value;

        this.updateTransform();
    }

    public get selectedNodes() {
        return this._selectedNodes;
    }

    public get selectedLink() {
        return this._selectedLink;
    }
    public get selectedFrames() {
        return this._selectedFrames;
    }

    public get selectedPort() {
        return this._selectedPort;
    }

    public get canvasContainer() {
        return this._graphCanvas;
    }

    public get hostCanvas() {
        return this._hostCanvas;
    }

    public get svgCanvas() {
        return this._svgCanvas;
    }

    public get selectionContainer() {
        return this._selectionContainer;
    }

    public get frameContainer() {
        return this._frameContainer;
    }

    // There is a selection conflict between nodes and frames if any selected node is inside any selected frame
    private _selectedFrameAndNodesConflict(frameSelection: GraphFrame[], nodeSelection: GraphNode[]) {
        for (const frame of frameSelection) {
            for (const node of nodeSelection) {
                if (frame.nodes.includes(node)) {
                    return true;
                }
            }
        }
        return false;
    }

    constructor(props: IGraphCanvasComponentProps) {
        super(props);

        props.globalState.onSelectionChangedObservable.add((options) => {
            const { selection, forceKeepSelection, marqueeSelection = false } = options || {};
            if (!selection) {
                this._selectedNodes = [];
                this._selectedLink = null;
                this._selectedFrames = [];
                this._selectedPort = null;
            } else {
                if (selection instanceof NodeLink) {
                    this._selectedNodes = [];
                    this._selectedFrames = [];
                    this._selectedLink = selection;
                    this._selectedPort = null;
                } else if (selection instanceof NodePort) {
                    this._selectedNodes = [];
                    this._selectedFrames = [];
                    this._selectedLink = null;
                    this._selectedPort = selection;
                } else if (selection instanceof FrameNodePort) {
                    this._selectedNodes = [];
                    this._selectedFrames = [];
                    this._selectedLink = null;
                    this._selectedPort = selection.port;
                } else if (selection instanceof GraphNode || selection instanceof GraphFrame) {
                    // If in marquee selection mode, always prioritize selecting nodes. Otherwise, always prioritize selecting the type of
                    // the selected element
                    if (marqueeSelection) {
                        if (selection instanceof GraphFrame && !this._selectedFrames.includes(selection)) {
                            this._selectedFrames.push(selection);
                        } else if (selection instanceof GraphNode && !this._selectedNodes.includes(selection)) {
                            this._selectedNodes.push(selection);
                        }
                        if (this._selectedFrameAndNodesConflict(this.selectedFrames, this.selectedNodes)) {
                            const framesToRemove = new Set();
                            for (const selectedNode of this._selectedNodes) {
                                for (const selectedFrame of this._selectedFrames) {
                                    if (selectedFrame.nodes.includes(selectedNode)) {
                                        framesToRemove.add(selectedFrame);
                                    }
                                }
                            }
                            this._selectedFrames = this._selectedFrames.filter((f) => !framesToRemove.has(f));
                        }
                    } else {
                        if (selection instanceof GraphFrame) {
                            if (this._ctrlKeyIsPressed || forceKeepSelection) {
                                if (!this._selectedFrameAndNodesConflict([selection], this._selectedNodes) && !this._selectedFrames.includes(selection)) {
                                    this._selectedFrames.push(selection);
                                }
                            } else {
                                this._selectedFrames = [selection];
                                this._selectedNodes = [];
                                this._selectedLink = null;
                                this._selectedPort = null;
                            }
                        } else if (selection instanceof GraphNode) {
                            if (this._ctrlKeyIsPressed || forceKeepSelection) {
                                if (!this._selectedFrameAndNodesConflict(this._selectedFrames, [selection]) && !this._selectedNodes.includes(selection)) {
                                    this._selectedNodes.push(selection);
                                }
                            } else {
                                this._selectedFrames = [];
                                this._selectedNodes = [selection];
                                this._selectedLink = null;
                                this._selectedPort = null;
                            }
                        }
                    }
                }
            }
        });

        props.globalState.onCandidatePortSelectedObservable.add((port) => {
            this._candidatePort = port;
        });

        props.globalState.onGridSizeChanged.add(() => {
            this.gridSize = DataStorage.ReadNumber("GridSize", 20);
        });

        this.props.globalState.hostDocument!.addEventListener("keyup", () => this.onKeyUp(), false);
        this.props.globalState.hostDocument!.addEventListener(
            "keydown",
            (evt) => {
                this._altKeyIsPressed = evt.altKey;
                this._ctrlKeyIsPressed = evt.ctrlKey;
            },
            false
        );
        this.props.globalState.hostDocument!.defaultView!.addEventListener(
            "blur",
            () => {
                this._altKeyIsPressed = false;
                this._ctrlKeyIsPressed = false;
            },
            false
        );

        // Store additional data to serialization object
        this.props.globalState.storeEditorData = (editorData, graphFrame) => {
            editorData.frames = [];
            if (graphFrame) {
                editorData.frames.push(graphFrame!.serialize(false));
            } else {
                editorData.x = this.x;
                editorData.y = this.y;
                editorData.zoom = this.zoom;
                for (const frame of this._frames) {
                    editorData.frames.push(frame.serialize(true));
                }
            }
        };
    }

    public static _RefreshNode = (node: GraphNode, visitedNodes?: Set<GraphNode>, visitedLinks?: Set<NodeLink>) => {
        node.refresh();

        const links = node.links;

        if (visitedNodes) {
            // refresh first the nodes so that the right types are assigned to the auto-detect ports
            links.forEach((link) => {
                const nodeA = link.nodeA,
                    nodeB = link.nodeB;

                if (!visitedNodes.has(nodeA)) {
                    visitedNodes.add(nodeA);
                    this._RefreshNode(nodeA, visitedNodes, visitedLinks);
                }

                if (nodeB && !visitedNodes.has(nodeB)) {
                    visitedNodes.add(nodeB);
                    this._RefreshNode(nodeB, visitedNodes, visitedLinks);
                }
            });
        }

        if (!visitedLinks) {
            return;
        }

        // then refresh the links to display the right color between ports
        links.forEach((link) => {
            if (!visitedLinks.has(link)) {
                visitedLinks.add(link);
                link.update();
            }
        });
    };

    public getGridPosition(position: number, useCeil = false) {
        const gridSize = this.gridSize;
        if (gridSize === 0) {
            return position;
        }
        if (useCeil) {
            return gridSize * Math.ceil(position / gridSize);
        }
        return gridSize * Math.floor(position / gridSize);
    }

    public getGridPositionCeil(position: number) {
        const gridSize = this.gridSize;
        if (gridSize === 0) {
            return position;
        }
        return gridSize * Math.ceil(position / gridSize);
    }

    updateTransform() {
        this._rootContainer.style.transform = `translate(${this._x}px, ${this._y}px) scale(${this._zoom})`;

        if (DataStorage.ReadBoolean("ShowGrid", true)) {
            this._hostCanvas.style.backgroundSize = `${this._gridSize * this._zoom}px ${this._gridSize * this._zoom}px`;
            this._hostCanvas.style.backgroundPosition = `${this._x}px ${this._y}px`;
        } else {
            this._hostCanvas.style.backgroundSize = `0`;
        }
    }

    onKeyUp() {
        this._altKeyIsPressed = false;
        this._ctrlKeyIsPressed = false;
        this._oldY = -1;
    }

    findNodeFromBlock(block: NodeMaterialBlock) {
        return this.nodes.filter((n) => n.block === block)[0];
    }

    reset() {
        for (const node of this._nodes) {
            node.dispose();
        }

        const frames = this._frames.splice(0);
        for (const frame of frames) {
            frame.dispose();
        }
        this._nodes = [];
        this._frames = [];
        this._links = [];
        this._graphCanvas.innerHTML = "";
        this._svgCanvas.innerHTML = "";
    }

    connectPorts(pointA: NodeMaterialConnectionPoint, pointB: NodeMaterialConnectionPoint) {
        const blockA = pointA.ownerBlock;
        const blockB = pointB.ownerBlock;
        const nodeA = this.findNodeFromBlock(blockA);
        const nodeB = this.findNodeFromBlock(blockB);

        if (!nodeA || !nodeB) {
            return;
        }

        const portA = nodeA.getPortForConnectionPoint(pointA);
        const portB = nodeB.getPortForConnectionPoint(pointB);

        if (!portA || !portB) {
            return;
        }

        for (const currentLink of this._links) {
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
        const index = this._links.indexOf(link);

        if (index > -1) {
            this._links.splice(index, 1);
        }

        link.dispose();
    }

    appendBlock(block: NodeMaterialBlock) {
        const newNode = new GraphNode(block, this.props.globalState);

        newNode.appendVisual(this._graphCanvas, this);

        this._nodes.push(newNode);

        return newNode;
    }

    distributeGraph() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;

        const graph = new dagre.graphlib.Graph();
        graph.setGraph({});
        graph.setDefaultEdgeLabel(() => ({}));
        graph.graph().rankdir = "LR";

        // Build dagre graph
        this._nodes.forEach((node) => {
            if (this._frames.some((f) => f.nodes.indexOf(node) !== -1)) {
                return;
            }

            graph.setNode(node.id.toString(), {
                id: node.id,
                type: "node",
                width: node.width,
                height: node.height,
            });
        });

        this._frames.forEach((frame) => {
            graph.setNode(frame.id.toString(), {
                id: frame.id,
                type: "frame",
                width: frame.element.clientWidth,
                height: frame.element.clientHeight,
            });
        });

        this._nodes.forEach((node) => {
            node.block.outputs.forEach((output) => {
                if (!output.hasEndpoints) {
                    return;
                }

                output.endpoints.forEach((endpoint) => {
                    const sourceFrames = this._frames.filter((f) => f.nodes.indexOf(node) !== -1);
                    const targetFrames = this._frames.filter((f) => f.nodes.some((n) => n.block === endpoint.ownerBlock));

                    const sourceId = sourceFrames.length > 0 ? sourceFrames[0].id : node.id;
                    const targetId = targetFrames.length > 0 ? targetFrames[0].id : endpoint.ownerBlock.uniqueId;

                    graph.setEdge(sourceId.toString(), targetId.toString());
                });
            });
        });

        // Distribute
        dagre.layout(graph);

        // Update graph
        const dagreNodes = graph.nodes().map((node) => graph.node(node));
        dagreNodes.forEach((dagreNode: any) => {
            if (!dagreNode) {
                return;
            }
            if (dagreNode.type === "node") {
                for (const node of this._nodes) {
                    if (node.id === dagreNode.id) {
                        node.x = dagreNode.x - dagreNode.width / 2;
                        node.y = dagreNode.y - dagreNode.height / 2;
                        node.cleanAccumulation();
                        return;
                    }
                }
                return;
            }

            for (const frame of this._frames) {
                if (frame.id === dagreNode.id) {
                    this._frameIsMoving = true;
                    frame.move(dagreNode.x - dagreNode.width / 2, dagreNode.y - dagreNode.height / 2, false);
                    frame.cleanAccumulation();
                    this._frameIsMoving = false;
                    return;
                }
            }
        });
    }

    componentDidMount() {
        this._hostCanvas = this.props.globalState.hostDocument.getElementById("graph-canvas") as HTMLDivElement;
        this._rootContainer = this.props.globalState.hostDocument.getElementById("graph-container") as HTMLDivElement;
        this._graphCanvas = this.props.globalState.hostDocument.getElementById("graph-canvas-container") as HTMLDivElement;
        this._svgCanvas = this.props.globalState.hostDocument.getElementById("graph-svg-container") as HTMLElement;
        this._selectionContainer = this.props.globalState.hostDocument.getElementById("selection-container") as HTMLDivElement;
        this._frameContainer = this.props.globalState.hostDocument.getElementById("frame-container") as HTMLDivElement;

        this.gridSize = DataStorage.ReadNumber("GridSize", 20);
        this.updateTransform();
    }

    onMove(evt: React.PointerEvent) {
        // Selection box
        if (this._selectionBox) {
            const rootRect = this.canvasContainer.getBoundingClientRect();

            const localX = evt.pageX - rootRect.left;
            const localY = evt.pageY - rootRect.top;

            if (localX > this._selectionStartX) {
                this._selectionBox.style.left = `${this._selectionStartX / this.zoom}px`;
                this._selectionBox.style.width = `${(localX - this._selectionStartX) / this.zoom}px`;
            } else {
                this._selectionBox.style.left = `${localX / this.zoom}px`;
                this._selectionBox.style.width = `${(this._selectionStartX - localX) / this.zoom}px`;
            }

            if (localY > this._selectionStartY) {
                this._selectionBox.style.top = `${this._selectionStartY / this.zoom}px`;
                this._selectionBox.style.height = `${(localY - this._selectionStartY) / this.zoom}px`;
            } else {
                this._selectionBox.style.top = `${localY / this.zoom}px`;
                this._selectionBox.style.height = `${(this._selectionStartY - localY) / this.zoom}px`;
            }

            this.props.globalState.onSelectionBoxMoved.notifyObservers(this._selectionBox.getBoundingClientRect());

            return;
        }

        // Candidate frame box
        if (this._frameCandidate) {
            const rootRect = this.canvasContainer.getBoundingClientRect();

            const localX = evt.pageX - rootRect.left;
            const localY = evt.pageY - rootRect.top;

            if (localX > this._selectionStartX) {
                this._frameCandidate.style.left = `${this._selectionStartX / this.zoom}px`;
                this._frameCandidate.style.width = `${(localX - this._selectionStartX) / this.zoom}px`;
            } else {
                this._frameCandidate.style.left = `${localX / this.zoom}px`;
                this._frameCandidate.style.width = `${(this._selectionStartX - localX) / this.zoom}px`;
            }

            if (localY > this._selectionStartY) {
                this._frameCandidate.style.top = `${this._selectionStartY / this.zoom}px`;
                this._frameCandidate.style.height = `${(localY - this._selectionStartY) / this.zoom}px`;
            } else {
                this._frameCandidate.style.top = `${localY / this.zoom}px`;
                this._frameCandidate.style.height = `${(this._selectionStartY - localY) / this.zoom}px`;
            }

            return;
        }

        // Candidate link
        if (this._candidateLink) {
            const rootRect = this.canvasContainer.getBoundingClientRect();
            this._candidatePort = null;
            this.props.globalState.onCandidateLinkMoved.notifyObservers(new Vector2(evt.pageX, evt.pageY));
            this._dropPointX = (evt.pageX - rootRect.left) / this.zoom;
            this._dropPointY = (evt.pageY - rootRect.top) / this.zoom;

            this._candidateLink.update(this._dropPointX, this._dropPointY, true);
            this._candidateLinkedHasMoved = true;

            return;
        }

        // Zoom with mouse + alt
        if (this._altKeyIsPressed && evt.buttons === 1) {
            if (this._oldY < 0) {
                this._oldY = evt.pageY;
            }

            const zoomDelta = (evt.pageY - this._oldY) / 10;
            if (Math.abs(zoomDelta) > 5) {
                const oldZoom = this.zoom;
                this.zoom = Math.max(Math.min(this._maxZoom, this.zoom + zoomDelta / 100), this._minZoom);

                const boundingRect = evt.currentTarget.getBoundingClientRect();
                const clientWidth = boundingRect.width;
                const widthDiff = clientWidth * this.zoom - clientWidth * oldZoom;
                const clientX = evt.clientX - boundingRect.left;

                const xFactor = (clientX - this.x) / oldZoom / clientWidth;

                this.x = this.x - widthDiff * xFactor;

                this._oldY = evt.pageY;
            }
            return;
        }

        // Move canvas
        this._rootContainer.style.cursor = "move";

        if (this._mouseStartPointX === null || this._mouseStartPointY === null) {
            return;
        }
        this.x += evt.clientX - this._mouseStartPointX;
        this.y += evt.clientY - this._mouseStartPointY;

        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;
    }

    onDown(evt: React.PointerEvent<HTMLElement>) {
        this._rootContainer.setPointerCapture(evt.pointerId);

        // Selection?
        if (evt.currentTarget === this._hostCanvas && evt.ctrlKey) {
            this._selectionBox = this.props.globalState.hostDocument.createElement("div");
            this._selectionBox.classList.add("selection-box");
            this._selectionContainer.appendChild(this._selectionBox);

            const rootRect = this.canvasContainer.getBoundingClientRect();
            this._selectionStartX = evt.pageX - rootRect.left;
            this._selectionStartY = evt.pageY - rootRect.top;
            this._selectionBox.style.left = `${this._selectionStartX / this.zoom}px`;
            this._selectionBox.style.top = `${this._selectionStartY / this.zoom}px`;
            this._selectionBox.style.width = "0px";
            this._selectionBox.style.height = "0px";
            return;
        }

        // Frame?
        if (evt.currentTarget === this._hostCanvas && evt.shiftKey) {
            this._frameCandidate = this.props.globalState.hostDocument.createElement("div");
            this._frameCandidate.classList.add("frame-box");
            this._frameContainer.appendChild(this._frameCandidate);

            const rootRect = this.canvasContainer.getBoundingClientRect();
            this._selectionStartX = evt.pageX - rootRect.left;
            this._selectionStartY = evt.pageY - rootRect.top;
            this._frameCandidate.style.left = `${this._selectionStartX / this.zoom}px`;
            this._frameCandidate.style.top = `${this._selectionStartY / this.zoom}px`;
            this._frameCandidate.style.width = "0px";
            this._frameCandidate.style.height = "0px";
            return;
        }

        // Port dragging
        if (evt.nativeEvent.srcElement && (evt.nativeEvent.srcElement as HTMLElement).nodeName === "IMG") {
            if (!this._candidateLink) {
                const portElement = ((evt.nativeEvent.srcElement as HTMLElement).parentElement as any).port as NodePort;
                this._candidateLink = new NodeLink(this, portElement, portElement.node);
                this._candidateLinkedHasMoved = false;
            }
            return;
        }

        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;
    }

    onUp(evt: React.PointerEvent) {
        this._mouseStartPointX = null;
        this._mouseStartPointY = null;
        this._rootContainer.releasePointerCapture(evt.pointerId);
        this._oldY = -1;

        if (this._candidateLink) {
            if (this._candidateLinkedHasMoved) {
                this.processCandidatePort();
                this.props.globalState.onCandidateLinkMoved.notifyObservers(null);
            } else {
                // is a click event on NodePort
                if (this._candidateLink.portA instanceof FrameNodePort) {
                    //only on Frame Node Ports
                    const port = this._candidateLink.portA;
                    const frame = this.frames.find((frame: GraphFrame) => frame.id === port.parentFrameId);
                    if (frame) {
                        const data: FramePortData = {
                            frame,
                            port,
                        };
                        this.props.globalState.onSelectionChangedObservable.notifyObservers({ selection: data });
                    }
                } else if (this._candidateLink.portA instanceof NodePort) {
                    this.props.globalState.onSelectionChangedObservable.notifyObservers({ selection: this._candidateLink.portA });
                }
            }
            this._candidateLink.dispose();
            this._candidateLink = null;
            this._candidatePort = null;
        }

        if (this._selectionBox) {
            this._selectionBox.parentElement!.removeChild(this._selectionBox);
            this._selectionBox = null;
        }

        if (this._frameCandidate) {
            const newFrame = new GraphFrame(this._frameCandidate, this);
            this._frames.push(newFrame);

            this._frameCandidate.parentElement!.removeChild(this._frameCandidate);
            this._frameCandidate = null;

            this.props.globalState.onSelectionChangedObservable.notifyObservers({ selection: newFrame });
        }
    }

    onWheel(evt: React.WheelEvent) {
        const delta = evt.deltaY < 0 ? 0.1 : -0.1;

        const oldZoom = this.zoom;
        this.zoom = Math.min(Math.max(this._minZoom, this.zoom + delta * this.zoom), this._maxZoom);

        const boundingRect = evt.currentTarget.getBoundingClientRect();
        const clientWidth = boundingRect.width;
        const clientHeight = boundingRect.height;
        const widthDiff = clientWidth * this.zoom - clientWidth * oldZoom;
        const heightDiff = clientHeight * this.zoom - clientHeight * oldZoom;
        const clientX = evt.clientX - boundingRect.left;
        const clientY = evt.clientY - boundingRect.top;

        const xFactor = (clientX - this.x) / oldZoom / clientWidth;
        const yFactor = (clientY - this.y) / oldZoom / clientHeight;

        this.x = this.x - widthDiff * xFactor;
        this.y = this.y - heightDiff * yFactor;
    }

    zoomToFit() {
        // Get negative offset
        let minX = 0;
        let minY = 0;
        this._nodes.forEach((node) => {
            if (this._frames.some((f) => f.nodes.indexOf(node) !== -1)) {
                return;
            }

            if (node.x < minX) {
                minX = node.x;
            }
            if (node.y < minY) {
                minY = node.y;
            }
        });

        this._frames.forEach((frame) => {
            if (frame.x < minX) {
                minX = frame.x;
            }
            if (frame.y < minY) {
                minY = frame.y;
            }
        });

        // Restore to 0
        this._frames.forEach((frame) => {
            frame.x += -minX;
            frame.y += -minY;
            frame.cleanAccumulation();
        });

        this._nodes.forEach((node) => {
            node.x += -minX;
            node.y += -minY;
            node.cleanAccumulation();
        });

        // Get correct zoom
        const xFactor = this._rootContainer.clientWidth / this._rootContainer.scrollWidth;
        const yFactor = this._rootContainer.clientHeight / this._rootContainer.scrollHeight;
        const zoomFactor = xFactor < yFactor ? xFactor : yFactor;

        this.zoom = zoomFactor;
        this.x = 0;
        this.y = 0;
    }

    processCandidatePort() {
        let pointB = this._candidateLink!.portA.connectionPoint;
        let nodeB = this._candidateLink!.portA.node;
        let pointA: NodeMaterialConnectionPoint;
        let nodeA: GraphNode;

        if (this._candidatePort) {
            pointA = this._candidatePort.connectionPoint;
            nodeA = this._candidatePort.node;
        } else {
            if (pointB.direction === NodeMaterialConnectionPointDirection.Output) {
                return;
            }

            // No destination so let's spin a new input block
            let pointName = "output",
                emittedBlock;
            const customInputBlock = this._candidateLink!.portA.connectionPoint.createCustomInputBlock();
            if (!customInputBlock) {
                emittedBlock = new InputBlock(
                    NodeMaterialBlockConnectionPointTypes[this._candidateLink!.portA.connectionPoint.type],
                    undefined,
                    this._candidateLink!.portA.connectionPoint.type
                );
            } else {
                [emittedBlock, pointName] = customInputBlock;
            }
            this.props.globalState.nodeMaterial.attachedBlocks.push(emittedBlock);
            pointA = (emittedBlock as any)[pointName];
            if (!emittedBlock.isInput) {
                emittedBlock.autoConfigure(this.props.globalState.nodeMaterial);
                nodeA = this.props.onEmitNewBlock(emittedBlock);
            } else {
                nodeA = this.appendBlock(emittedBlock);
            }
            nodeA.x = this._dropPointX - 200;
            nodeA.y = this._dropPointY - 50;

            const x = nodeA.x - 250;
            let y = nodeA.y;

            emittedBlock.inputs.forEach((connection) => {
                if (connection.connectedPoint) {
                    const existingNodes = this.nodes.filter((n) => {
                        return n.block === (connection as any).connectedPoint.ownerBlock;
                    });
                    const connectedNode = existingNodes[0];

                    if (connectedNode.x === 0 && connectedNode.y === 0) {
                        connectedNode.x = x;
                        connectedNode.y = y;
                        connectedNode.cleanAccumulation();
                        y += 80;
                    }
                }
            });
        }

        if (pointA.direction === NodeMaterialConnectionPointDirection.Input) {
            const temp = pointB;
            pointB = pointA;
            pointA = temp;

            const tempNode = nodeA;
            nodeA = nodeB;
            nodeB = tempNode;
        }

        if (pointB.connectedPoint === pointA) {
            return;
        }

        if (pointB === pointA) {
            return;
        }

        if (pointB.direction === pointA.direction) {
            return;
        }

        if (pointB.ownerBlock === pointA.ownerBlock) {
            return;
        }

        // Check compatibility
        const isFragmentOutput = pointB.ownerBlock.getClassName() === "FragmentOutputBlock";
        let compatibilityState = pointA.checkCompatibilityState(pointB);
        if (
            (pointA.needDualDirectionValidation || pointB.needDualDirectionValidation) &&
            compatibilityState === NodeMaterialConnectionPointCompatibilityStates.Compatible &&
            !(pointA instanceof InputBlock)
        ) {
            compatibilityState = pointB.checkCompatibilityState(pointA);
        }
        if (compatibilityState === NodeMaterialConnectionPointCompatibilityStates.Compatible) {
            if (isFragmentOutput) {
                const fragmentBlock = pointB.ownerBlock as FragmentOutputBlock;

                if (pointB.name === "rgb" && fragmentBlock.rgba.isConnected) {
                    nodeB.getLinksForConnectionPoint(fragmentBlock.rgba)[0].dispose();
                } else if (pointB.name === "rgba" && fragmentBlock.rgb.isConnected) {
                    nodeB.getLinksForConnectionPoint(fragmentBlock.rgb)[0].dispose();
                }
            }
        } else {
            let message = "";

            switch (compatibilityState) {
                case NodeMaterialConnectionPointCompatibilityStates.TypeIncompatible:
                    message = "Cannot connect two different connection types";
                    break;
                case NodeMaterialConnectionPointCompatibilityStates.TargetIncompatible:
                    message = "Source block can only work in fragment shader whereas destination block is currently aimed for the vertex shader";
                    break;
                case NodeMaterialConnectionPointCompatibilityStates.HierarchyIssue:
                    message = "Source block cannot be connected with one of its ancestors";
                    break;
            }

            this.props.globalState.onErrorMessageDialogRequiredObservable.notifyObservers(message);
            return;
        }

        let linksToNotifyForDispose: Nullable<NodeLink[]> = null;

        if (pointB.isConnected) {
            const links = nodeB.getLinksForConnectionPoint(pointB);

            linksToNotifyForDispose = links.slice();

            links.forEach((link) => {
                link.dispose(false);
            });
        }

        if (pointB.ownerBlock.inputsAreExclusive) {
            // Disconnect all inputs if block has exclusive inputs
            pointB.ownerBlock.inputs.forEach((i) => {
                const links = nodeB.getLinksForConnectionPoint(i);

                if (!linksToNotifyForDispose) {
                    linksToNotifyForDispose = links.slice();
                } else {
                    linksToNotifyForDispose.push(...links.slice());
                }

                links.forEach((link) => {
                    link.dispose(false);
                });
            });
        }

        this.connectNodes(nodeA, pointA, nodeB, pointB);

        linksToNotifyForDispose?.forEach((link) => {
            link.onDisposedObservable.notifyObservers(link);
            link.onDisposedObservable.clear();
        });

        this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
    }

    connectNodes(nodeA: GraphNode, pointA: NodeMaterialConnectionPoint, nodeB: GraphNode, pointB: NodeMaterialConnectionPoint) {
        pointA.connectTo(pointB);
        this.connectPorts(pointA, pointB);

        // Need to potentially propagate the type of pointA to other ports of blocks connected to owner of pointB
        // We also need to check if we want to display the promotion warning

        const visitedNodes = new Set<GraphNode>([nodeA]);
        const visitedLinks = new Set<NodeLink>([nodeB.links[nodeB.links.length - 1]]);

        GraphCanvasComponent._RefreshNode(nodeB, visitedNodes, visitedLinks);
    }

    processEditorData(editorData: IEditorData) {
        const frames = this._frames.splice(0);
        for (const frame of frames) {
            frame.dispose();
        }

        this._frames = [];
        this.x = editorData.x || 0;
        this.y = editorData.y || 0;
        this.zoom = editorData.zoom || 1;

        // Frames
        if (editorData.frames) {
            for (const frameData of editorData.frames) {
                const frame = GraphFrame.Parse(frameData, this, editorData.map);
                this._frames.push(frame);
            }
        }
    }

    addFrame(frameData: IFrameData) {
        const frame = GraphFrame.Parse(frameData, this, this.props.globalState.nodeMaterial.editorData.map);
        this._frames.push(frame);
        this.globalState.onSelectionChangedObservable.notifyObservers({ selection: frame });
    }

    render() {
        return (
            <div
                id="graph-canvas"
                onWheel={(evt) => this.onWheel(evt)}
                onPointerMove={(evt) => this.onMove(evt)}
                onPointerDown={(evt) => this.onDown(evt)}
                onPointerUp={(evt) => this.onUp(evt)}
            >
                <div id="graph-container">
                    <div id="graph-canvas-container"></div>
                    <div id="frame-container"></div>
                    <svg id="graph-svg-container"></svg>
                    <div id="selection-container"></div>
                </div>
            </div>
        );
    }
}
