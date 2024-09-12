import * as React from "react";
import { GraphNode } from "./graphNode";
import * as dagre from "dagre";
import type { Nullable } from "core/types";
import { NodeLink } from "./nodeLink";
import { NodePort } from "./nodePort";
import { Vector2 } from "core/Maths/math.vector";
import { DataStorage } from "core/Misc/dataStorage";
import { GraphFrame } from "./graphFrame";
import type { IEditorData, IFrameData } from "./interfaces/nodeLocationInfo";
import { FrameNodePort } from "./frameNodePort";
import type { StateManager } from "./stateManager";
import type { FramePortData } from "./types/framePortData";
import type { INodeData } from "./interfaces/nodeData";
import type { IPortData } from "./interfaces/portData";
import { PortDataDirection } from "./interfaces/portData";
import type { INodeContainer } from "./interfaces/nodeContainer";
import styles from "./graphCanvas.modules.scss";
import commonStyles from "./common.modules.scss";

import { TypeLedger } from "./typeLedger";
import { RefreshNode } from "./tools";
import { SearchBoxComponent } from "./searchBox";

export interface IGraphCanvasComponentProps {
    stateManager: StateManager;
    onEmitNewNode: (nodeData: INodeData) => GraphNode;
}

export class GraphCanvasComponent extends React.Component<IGraphCanvasComponentProps> implements INodeContainer {
    public static readonly NodeWidth = 100;
    private readonly _minZoom = 0.1;
    private readonly _maxZoom = 4;

    private _hostCanvasRef = React.createRef<HTMLDivElement>();
    private _hostCanvas: HTMLDivElement;
    private _graphCanvasRef = React.createRef<HTMLDivElement>();
    private _graphCanvas: HTMLDivElement;
    private _selectionContainerRef = React.createRef<HTMLDivElement>();
    private _selectionContainer: HTMLDivElement;
    private _frameContainerRef = React.createRef<HTMLDivElement>();
    private _frameContainer: HTMLDivElement;
    private _svgCanvasRef = React.createRef<SVGSVGElement>();
    private _svgCanvas: HTMLElement;
    private _rootContainerRef = React.createRef<HTMLDivElement>();
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
    private _nodeDataContentList = new Array<any>();

    private _altKeyIsPressed = false;
    private _multiKeyIsPressed = false;
    private _oldY = -1;

    public _frameIsMoving = false;
    public _isLoading = false;
    public _targetLinkCandidate: Nullable<NodeLink> = null;

    private _copiedNodes: GraphNode[] = [];
    private _copiedFrames: GraphFrame[] = [];

    public get gridSize() {
        return this._gridSize;
    }

    public set gridSize(value: number) {
        this._gridSize = value;

        this.updateTransform();
    }

    public get stateManager() {
        return this.props.stateManager;
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

        props.stateManager.onSelectionChangedObservable.add((options) => {
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
                    this._selectedPort = selection;
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
                            if (this._multiKeyIsPressed || forceKeepSelection) {
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
                            if (this._multiKeyIsPressed || forceKeepSelection) {
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

        props.stateManager.onCandidatePortSelectedObservable.add((port) => {
            this._candidatePort = port;
        });

        props.stateManager.onGridSizeChanged.add(() => {
            this.gridSize = DataStorage.ReadNumber("GridSize", 20);
        });

        this.props.stateManager.hostDocument!.addEventListener("keyup", () => this.onKeyUp(), false);
        this.props.stateManager.hostDocument!.addEventListener(
            "keydown",
            (evt) => {
                this._altKeyIsPressed = evt.altKey;
                this._multiKeyIsPressed = evt.ctrlKey || evt.metaKey;
            },
            false
        );
        this.props.stateManager.hostDocument!.defaultView!.addEventListener(
            "blur",
            () => {
                this._altKeyIsPressed = false;
                this._multiKeyIsPressed = false;
            },
            false
        );

        // Store additional data to serialization object
        this.props.stateManager.storeEditorData = (editorData, graphFrame) => {
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

    populateConnectedEntriesBeforeRemoval(item: GraphNode, items: GraphNode[], inputs: Nullable<IPortData>[], outputs: Nullable<IPortData>[]) {
        inputs.push(
            ...item.content.inputs.filter((i) => i.isConnected && items.every((selected) => selected.content.data !== i.connectedPort?.ownerData)).map((i) => i.connectedPort)
        );

        outputs.push(
            ...item.content.outputs
                .filter((i) => i.isConnected)
                .map((i) => i.endpoints)
                .flat()
                .filter((i) => i && items.every((selected) => selected.content.data !== i.ownerData))
        );
    }

    automaticRewire(inputs: Nullable<IPortData>[], outputs: Nullable<IPortData>[], firstOnly = false) {
        let oneConnectionFound = false;
        if (outputs.length && inputs.length) {
            inputs.forEach((input) => {
                if (oneConnectionFound) {
                    return;
                }
                if (!input) {
                    return;
                }
                const output = outputs[0];
                if (output && input.canConnectTo(output)) {
                    const nodeInput = this.findNodeFromData(input.ownerData);
                    const nodeOutput = this.findNodeFromData(output.ownerData);
                    this.connectNodes(nodeInput, input, nodeOutput, output);
                    outputs.shift();
                    if (firstOnly) {
                        oneConnectionFound = true;
                        return;
                    }
                }
            });
        }
    }

    smartAddOverLink(node: GraphNode, link: NodeLink) {
        // Connect the ports
        const inputs: Nullable<IPortData>[] = [];
        const outputs: Nullable<IPortData>[] = [];
        const availableNodeInputs: Nullable<IPortData>[] = [];
        const availableNodeOutputs: Nullable<IPortData>[] = [];
        const leftNode = link.nodeA;
        const rightNode = link.nodeB!;

        // Delete previous
        link.dispose();

        // Get the ports
        availableNodeInputs.push(...node.content.inputs.filter((i) => !i.isConnected));

        availableNodeOutputs.push(...node.content.outputs);

        inputs.push(...leftNode.content.outputs);

        outputs.push(...rightNode.content.inputs.filter((i) => !i.isConnected));

        // Reconnect
        this.automaticRewire(inputs, availableNodeInputs, true);
        this.automaticRewire(availableNodeOutputs, outputs, true);
        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
    }

    smartAddOverNode(node: GraphNode, source: GraphNode) {
        // Connect the ports
        const inputs: Nullable<IPortData>[] = [];
        const availableNodeInputs: Nullable<IPortData>[] = [];

        // Get the ports
        availableNodeInputs.push(...node.content.inputs.filter((i) => !i.isConnected));

        inputs.push(...source.content.outputs);

        // Reconnect
        this.automaticRewire(inputs, availableNodeInputs, true);
        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
    }

    deleteSelection(onRemove: (nodeData: INodeData) => void, autoReconnect = false) {
        // Delete
        const selectedItems = this.selectedNodes;
        const inputs: Nullable<IPortData>[] = [];
        const outputs: Nullable<IPortData>[] = [];
        let needRebuild = false;

        if (selectedItems.length > 0) {
            needRebuild = true;
            for (const selectedItem of selectedItems) {
                if (autoReconnect) {
                    this.populateConnectedEntriesBeforeRemoval(selectedItem, selectedItems, inputs, outputs);
                }

                selectedItem.dispose();

                onRemove(selectedItem.content);
                this.removeDataFromCache(selectedItem.content.data);
            }
        }

        if (this.selectedLink) {
            needRebuild = true;
            this.selectedLink.dispose();
        }

        if (this.selectedFrames.length) {
            needRebuild = true;
            for (const frame of this.selectedFrames) {
                if (frame.isCollapsed) {
                    while (frame.nodes.length > 0) {
                        onRemove(frame.nodes[0].content);
                        this.removeDataFromCache(frame.nodes[0].content.data);
                        frame.nodes[0].dispose();
                    }
                    frame.isCollapsed = false;
                } else {
                    frame.nodes.forEach((node) => {
                        node.enclosingFrameId = -1;
                    });
                }
                frame.dispose();
            }
        }

        if (!needRebuild) {
            return;
        }

        // Reconnect if required
        this.automaticRewire(inputs, outputs);

        this.props.stateManager.onSelectionChangedObservable.notifyObservers(null);
        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
    }

    handleKeyDown(
        evt: KeyboardEvent,
        onRemove: (nodeData: INodeData) => void,
        mouseLocationX: number,
        mouseLocationY: number,
        dataGenerator: (nodeData: INodeData) => any,
        rootElement: HTMLDivElement
    ) {
        if (this.stateManager.modalIsDisplayed) {
            return;
        }

        if (evt.code === "Space" && evt.target === this.props.stateManager.hostDocument!.body) {
            this.stateManager.modalIsDisplayed = true;
            this.props.stateManager.onSearchBoxRequiredObservable.notifyObservers({ x: mouseLocationX, y: mouseLocationY });
            return;
        }
        if ((evt.keyCode === 46 || evt.keyCode === 8) && !this.props.stateManager.lockObject.lock) {
            this.deleteSelection(onRemove, evt.altKey);
            return;
        }

        if ((!evt.ctrlKey && !evt.metaKey) || this.props.stateManager.lockObject.lock) {
            return;
        }

        if (evt.key === "c" || evt.key === "C") {
            // Copy
            this._copiedNodes = [];
            this._copiedFrames = [];

            if (this.selectedFrames.length) {
                for (const frame of this.selectedFrames) {
                    frame.serialize(true);
                    this._copiedFrames.push(frame);
                }
                return;
            }

            const selectedItems = this.selectedNodes;
            if (!selectedItems.length) {
                return;
            }

            const selectedItem = selectedItems[0] as GraphNode;

            if (!selectedItem.content.data) {
                return;
            }

            this._copiedNodes = selectedItems.slice(0);
        } else if (evt.key === "v" || evt.key === "V") {
            // Paste
            const zoomLevel = this.zoom;
            let currentY = (mouseLocationY - rootElement.offsetTop - this.y - 20) / zoomLevel;

            if (this._copiedFrames.length) {
                for (const frame of this._copiedFrames) {
                    // New frame
                    const newFrame = new GraphFrame(null, this, true);
                    this.frames.push(newFrame);

                    newFrame.width = frame.width;
                    newFrame.height = frame.height;
                    newFrame.width / 2;
                    newFrame.name = frame.name;
                    newFrame.color = frame.color;

                    let currentX = (mouseLocationX - rootElement.offsetLeft - this.x) / zoomLevel;
                    newFrame.x = currentX - newFrame.width / 2;
                    newFrame.y = currentY;

                    // Paste nodes
                    if (frame.nodes.length) {
                        currentX = newFrame.x + frame.nodes[0].x - frame.x;
                        currentY = newFrame.y + frame.nodes[0].y - frame.y;

                        this._frameIsMoving = true;
                        const newNodes = this.pasteSelection(frame.nodes, currentX, currentY, dataGenerator);
                        if (newNodes) {
                            for (const node of newNodes) {
                                newFrame.syncNode(node);
                            }
                        }
                        this._frameIsMoving = false;
                    }

                    newFrame.adjustPorts();

                    if (frame.isCollapsed) {
                        newFrame.isCollapsed = true;
                    }

                    // Select
                    this.props.stateManager.onSelectionChangedObservable.notifyObservers({ selection: newFrame, forceKeepSelection: true });
                    return;
                }
            }

            if (!this._copiedNodes.length) {
                return;
            }

            const currentX = (mouseLocationX - rootElement.offsetLeft - this.x - GraphCanvasComponent.NodeWidth) / zoomLevel;
            this.pasteSelection(this._copiedNodes, currentX, currentY, dataGenerator, true);
        }
    }

    pasteSelection(copiedNodes: GraphNode[], currentX: number, currentY: number, dataGenerator: (nodeData: INodeData) => any, selectNew = false) {
        let originalNode: Nullable<GraphNode> = null;

        const newNodes: GraphNode[] = [];

        // Copy to prevent recursive side effects while creating nodes.
        copiedNodes = copiedNodes.slice();

        // Cancel selection
        this.props.stateManager.onSelectionChangedObservable.notifyObservers(null);

        // Create new nodes
        for (const node of copiedNodes) {
            const data = node.content.data;

            if (!data) {
                continue;
            }

            const newNode = dataGenerator(node.content);

            let x = 0;
            let y = 0;
            if (originalNode) {
                x = currentX + node.x - originalNode.x;
                y = currentY + node.y - originalNode.y;
            } else {
                originalNode = node;
                x = currentX;
                y = currentY;
            }

            newNode.x = x;
            newNode.y = y;
            newNode.cleanAccumulation();

            newNodes.push(newNode);

            this.props.stateManager.onNewNodeCreatedObservable.notifyObservers(newNode);

            if (selectNew) {
                this.props.stateManager.onSelectionChangedObservable.notifyObservers({ selection: newNode, forceKeepSelection: true });
            }
        }

        // Relink
        const done = new Array<boolean>(newNodes.length);
        for (let index = 0; index < newNodes.length; index++) {
            this.reconnectNewNodes(index, newNodes, copiedNodes, done);
        }

        return newNodes;
    }

    reconnectNewNodes(nodeIndex: number, newNodes: GraphNode[], sourceNodes: GraphNode[], done: boolean[]) {
        if (done[nodeIndex]) {
            return;
        }

        const currentNode = newNodes[nodeIndex];
        const sourceNode = sourceNodes[nodeIndex];

        for (let inputIndex = 0; inputIndex < sourceNode.content.inputs.length; inputIndex++) {
            const sourceInput = sourceNode.content.inputs[inputIndex];
            const currentInput = currentNode.content.inputs[inputIndex];
            if (!sourceInput.isConnected) {
                continue;
            }
            const sourceContent = this.findNodeFromData(sourceInput.connectedPort!.ownerData).content;
            const activeNodes = sourceNodes.filter((s) => s.content === sourceContent);

            if (activeNodes.length > 0) {
                const activeNode = activeNodes[0];
                const indexInList = sourceNodes.indexOf(activeNode);

                // First make sure to connect the other one
                this.reconnectNewNodes(indexInList, newNodes, sourceNodes, done);

                // Then reconnect
                const outputIndex = sourceContent.outputs.indexOf(sourceInput.connectedPort!);
                const newOutput = newNodes[indexInList].content.data.outputs[outputIndex];

                newOutput.connectTo(currentInput.data);
            } else {
                // Connect with outside nodes
                sourceInput.connectedPort!.connectTo(currentInput);
            }

            this.connectPorts(currentInput.connectedPort!, currentInput);
        }

        currentNode.refresh();

        done[nodeIndex] = true;
    }

    public getCachedData(): any[] {
        return this._nodeDataContentList;
    }

    public removeDataFromCache(data: any) {
        const dataIndex = this._nodeDataContentList.indexOf(data);

        if (dataIndex > -1) {
            this._nodeDataContentList.splice(dataIndex, 1);
        }
    }

    public createNodeFromObject(nodeData: INodeData, onNodeCreated: (data: any) => void, recursion = true) {
        if (this._nodeDataContentList.indexOf(nodeData.data) !== -1) {
            // Links
            if (nodeData.inputs.length && recursion) {
                for (const input of nodeData.inputs) {
                    if (input.isConnected) {
                        this.connectPorts(input.connectedPort!, input);
                    }
                }
            }
            return this.nodes.filter((n) => n.content.data === nodeData.data)[0];
        }

        onNodeCreated(nodeData.data);

        // Connections
        if (nodeData.inputs.length) {
            for (const input of nodeData.inputs) {
                if (input.connectedPort && recursion) {
                    this.createNodeFromObject(TypeLedger.NodeDataBuilder(input.connectedPort.ownerData, this), onNodeCreated);
                }
            }
        }

        // Graph
        const node = this.appendNode(nodeData);

        // Links
        if (nodeData.inputs.length && recursion) {
            for (const input of nodeData.inputs) {
                if (input.isConnected) {
                    this.connectPorts(input.connectedPort!, input);
                }
            }
        }

        return node;
    }

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
        this._multiKeyIsPressed = false;
        this._oldY = -1;
    }

    findNodeFromData(data: any) {
        return this.nodes.filter((n) => n.content.data === data)[0];
    }

    reset() {
        this._nodeDataContentList = [];

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

    connectPorts(pointA: IPortData, pointB: IPortData) {
        if (!pointA || !pointB) {
            return;
        }

        const ownerDataA = pointA.ownerData;
        const ownerDataB = pointB.ownerData;
        const nodeA = this.findNodeFromData(ownerDataA);
        const nodeB = this.findNodeFromData(ownerDataB);

        if (!nodeA || !nodeB) {
            return;
        }

        const portA = nodeA.getPortForPortData(pointA);
        const portB = nodeB.getPortForPortData(pointB);

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

    appendNode(nodeData: INodeData) {
        const newNode = new GraphNode(nodeData, this.props.stateManager);

        newNode.appendVisual(this._graphCanvas, this);
        newNode.addClassToVisual(nodeData.getClassName());

        this._nodes.push(newNode);
        this._nodeDataContentList.push(nodeData.data);

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
            node.content.outputs.forEach((output) => {
                if (!output.hasEndpoints) {
                    return;
                }

                output.endpoints!.forEach((endpoint) => {
                    const sourceFrames = this._frames.filter((f) => f.nodes.indexOf(node) !== -1);
                    const targetFrames = this._frames.filter((f) => f.nodes.some((n) => n.content.data === endpoint.ownerData));

                    const sourceId = sourceFrames.length > 0 ? sourceFrames[0].id : node.id;
                    const targetId = targetFrames.length > 0 ? targetFrames[0].id : endpoint.ownerData.uniqueId;

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

    override componentDidMount() {
        this._hostCanvas = this._hostCanvasRef.current!;
        this._rootContainer = this._rootContainerRef.current!;
        this._graphCanvas = this._graphCanvasRef.current!;
        this._svgCanvas = this._svgCanvasRef.current! as unknown as HTMLElement;
        this._selectionContainer = this._selectionContainerRef.current!;
        this._frameContainer = this._frameContainerRef.current!;

        this.gridSize = DataStorage.ReadNumber("GridSize", 20);
        this.updateTransform();
    }

    onMove(evt: React.PointerEvent) {
        if (this.stateManager.modalIsDisplayed) {
            return;
        }

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

            this.props.stateManager.onSelectionBoxMoved.notifyObservers(this._selectionBox.getBoundingClientRect());

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
            this.props.stateManager.onCandidateLinkMoved.notifyObservers(new Vector2(evt.pageX, evt.pageY));
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
        if (this.stateManager.modalIsDisplayed) {
            return;
        }

        this._rootContainer.setPointerCapture(evt.pointerId);

        // Port dragging
        if (evt.nativeEvent.srcElement && (evt.nativeEvent.srcElement as HTMLElement).nodeName === "IMG") {
            if (!this._candidateLink) {
                const portElement = ((evt.nativeEvent.srcElement as HTMLElement).parentElement as any).port as NodePort;
                if (this._altKeyIsPressed && (portElement.portData.isConnected || portElement.portData.hasEndpoints)) {
                    const node = portElement.node;
                    // Delete connection
                    const links = node.getLinksForPortData(portElement.portData);

                    links.forEach((link) => {
                        link.dispose(false);
                    });

                    // Pick the first one as target port
                    const targetNode = links[0].nodeA === node ? links[0].nodeB : links[0].nodeA;
                    const targetPort = links[0].nodeA === node ? links[0].portB : links[0].portA;

                    // Start a new one
                    this._candidateLink = new NodeLink(this, targetPort!, targetNode!);
                } else if (this._multiKeyIsPressed && (portElement.portData.isConnected || portElement.portData.hasEndpoints)) {
                    const node = portElement.node;
                    const links = node.getLinksForPortData(portElement.portData);

                    // Pick the first one as target port
                    const linkToConsider = this._selectedLink || links[0];
                    const targetNode = linkToConsider.nodeA === node ? linkToConsider.nodeB : linkToConsider.nodeA;
                    const targetPort = linkToConsider.nodeA === node ? linkToConsider.portB : linkToConsider.portA;

                    // Start a new one
                    this._candidateLink = new NodeLink(this, targetPort!, targetNode!);
                } else {
                    this._candidateLink = new NodeLink(this, portElement, portElement.node);
                }
                this._candidateLinkedHasMoved = false;
            }
            return;
        }

        // Selection?
        if (evt.currentTarget === this._hostCanvas && this._multiKeyIsPressed) {
            this._selectionBox = this.props.stateManager.hostDocument.createElement("div");
            this._selectionBox.classList.add(styles["selection-box"]);
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
            this._frameCandidate = this.props.stateManager.hostDocument.createElement("div");
            this._frameCandidate.classList.add(commonStyles["frame-box"]);
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

        this.props.stateManager.onSelectionChangedObservable.notifyObservers(null);
        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;
    }

    onUp(evt: React.PointerEvent) {
        if (this.stateManager.modalIsDisplayed) {
            return;
        }

        this._mouseStartPointX = null;
        this._mouseStartPointY = null;
        this._rootContainer.releasePointerCapture(evt.pointerId);
        this._oldY = -1;
        if (this._candidateLink) {
            if (this._candidateLinkedHasMoved) {
                this.processCandidatePort();
                this.props.stateManager.onCandidateLinkMoved.notifyObservers(null);
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
                        this.props.stateManager.onSelectionChangedObservable.notifyObservers({ selection: data });
                    }
                } else if (this._candidateLink.portA instanceof NodePort) {
                    this.props.stateManager.onSelectionChangedObservable.notifyObservers({ selection: this._candidateLink.portA });
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

            this.props.stateManager.onSelectionChangedObservable.notifyObservers({ selection: newFrame });
        }
    }

    onWheel(evt: React.WheelEvent) {
        if (this.stateManager.modalIsDisplayed) {
            return;
        }

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
        let pointB = this._candidateLink!.portA.portData;
        let nodeB = this._candidateLink!.portA.node;
        let pointA: IPortData;
        let nodeA: GraphNode;

        if (this._candidatePort) {
            pointA = this._candidatePort.portData;
            nodeA = this._candidatePort.node;
        } else {
            if (pointB.direction === PortDataDirection.Output) {
                return;
            }

            // No destination so let's spin a new input node
            const newDefaultInput = this.props.stateManager.createDefaultInputData(this.props.stateManager.data, this._candidateLink!.portA.portData, this);
            if (!newDefaultInput) {
                return;
            }
            const pointName = newDefaultInput.name;
            const emittedNodeData = newDefaultInput.data;

            pointA = emittedNodeData.getPortByName(pointName)!;
            if (!pointA) {
                for (let i = 0; i < emittedNodeData.outputs.length; i++) {
                    const output = emittedNodeData.outputs[i];
                    const outputData = output.data;
                    const outputBlockType = outputData._blockType;
                    if (outputBlockType === pointB.data._blockType) {
                        pointA = output;
                        break;
                    }
                }
                if (!pointA) {
                    return;
                }
            }
            if (!emittedNodeData.isInput) {
                nodeA = this.props.onEmitNewNode(emittedNodeData);
            } else {
                nodeA = this.appendNode(emittedNodeData as any);
            }
            nodeA.x = this._dropPointX - 200;
            nodeA.y = this._dropPointY - 50;

            const x = nodeA.x - 250;
            let y = nodeA.y;

            emittedNodeData.inputs.forEach((portData: IPortData) => {
                if (portData.connectedPort) {
                    const existingNodes = this.nodes.filter((n) => {
                        return n.content.data === portData.connectedPort?.ownerData;
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

        if (pointA.direction === PortDataDirection.Input) {
            const temp = pointB;
            pointB = pointA;
            pointA = temp;

            const tempNode = nodeA;
            nodeA = nodeB;
            nodeB = tempNode;
        }

        if (pointB.connectedPort === pointA) {
            return;
        }

        if (pointB === pointA) {
            return;
        }

        if (pointB.direction === pointA.direction) {
            return;
        }

        if (pointB.ownerData === pointA.ownerData) {
            return;
        }

        // Check compatibility
        let compatibilityState = pointA.checkCompatibilityState(pointB);
        if ((pointA.needDualDirectionValidation || pointB.needDualDirectionValidation) && !compatibilityState) {
            compatibilityState = pointB.checkCompatibilityState(pointA);
        }

        const message = pointA.getCompatibilityIssueMessage(compatibilityState, nodeB, pointB);

        if (message) {
            this.props.stateManager.onErrorMessageDialogRequiredObservable.notifyObservers(message);
            return;
        }

        let linksToNotifyForDispose: Nullable<NodeLink[]> = null;

        if (pointB.isConnected) {
            const links = nodeB.getLinksForPortData(pointB);

            linksToNotifyForDispose = links.slice();

            links.forEach((link) => {
                link.dispose(false);
            });
        }

        if (pointB.ownerData.inputsAreExclusive) {
            // Disconnect all inputs if node has exclusive inputs
            pointB.ownerData.inputs.forEach((i: any) => {
                const links = nodeB.getLinksForPortData(i);

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

        if (!nodeB.content.isConnectedToOutput || nodeB.content.isConnectedToOutput()) {
            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        }
    }

    connectNodes(nodeA: GraphNode, pointA: IPortData, nodeB: GraphNode, pointB: IPortData) {
        pointA.connectTo(pointB);
        this.connectPorts(pointA, pointB);

        // Need to potentially propagate the type of pointA to other ports of nodes connected to owner of pointB
        // We also need to check if we want to display the promotion warning

        const visitedNodes = new Set<GraphNode>([nodeA]);
        const visitedLinks = new Set<NodeLink>([nodeB.links[nodeB.links.length - 1]]);

        RefreshNode(nodeB, visitedNodes, visitedLinks, this);
    }

    drop(newNode: GraphNode, targetX: number, targetY: number, offsetX: number, offsetY: number) {
        let x = targetX - this.x - offsetX * this.zoom;
        let y = targetY - this.y - offsetY * this.zoom;

        newNode.x = x / this.zoom;
        newNode.y = y / this.zoom;
        newNode.cleanAccumulation();

        x -= GraphCanvasComponent.NodeWidth + 200;

        newNode.content.inputs.forEach((portData) => {
            if (portData.connectedPort) {
                const existingNodes = this.nodes.filter((n) => {
                    return n.content.data === portData.connectedPort?.ownerData;
                });
                const connectedNode = existingNodes[0];

                if (connectedNode.x === 0 && connectedNode.y === 0) {
                    connectedNode.x = x / this.zoom;
                    connectedNode.y = y / this.zoom;
                    connectedNode.cleanAccumulation();
                    y += 80;
                }
            }
        });

        this.props.stateManager.onNewNodeCreatedObservable.notifyObservers(newNode);
        this.props.stateManager.onSelectionChangedObservable.notifyObservers(null);
        this.props.stateManager.onSelectionChangedObservable.notifyObservers({ selection: newNode });
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

    reOrganize(editorData: Nullable<IEditorData> = null, isImportingAFrame = false) {
        if (!editorData || !editorData.locations) {
            this.distributeGraph();
        } else {
            // Locations
            for (const location of editorData.locations) {
                for (const node of this.nodes) {
                    const data = node.content.data;
                    if (data && data.uniqueId === location.blockId) {
                        node.x = location.x;
                        node.y = location.y;
                        node.cleanAccumulation();
                        break;
                    }
                }
            }

            if (!isImportingAFrame) {
                this.processEditorData(editorData);
            }
        }

        this._isLoading = false;
        for (const node of this.nodes) {
            node._refreshLinks();
        }
    }

    addFrame(frameData: IFrameData) {
        const frame = GraphFrame.Parse(frameData, this, this.props.stateManager.getEditorDataMap());
        this._frames.push(frame);
        this.stateManager.onSelectionChangedObservable.notifyObservers({ selection: frame });
    }

    override render() {
        return (
            <div
                ref={this._hostCanvasRef}
                id="graph-canvas"
                className={styles["graph-canvas"]}
                onWheel={(evt) => this.onWheel(evt)}
                onPointerMove={(evt) => this.onMove(evt)}
                onPointerDown={(evt) => this.onDown(evt)}
                onPointerUp={(evt) => this.onUp(evt)}
            >
                <div id="graph-container" className={styles["graph-container"]} ref={this._rootContainerRef}>
                    <div id="graph-canvas-container" className={styles["graph-canvas-container"]} ref={this._graphCanvasRef}></div>
                    <div id="frame-container" className={styles["frame-container"]} ref={this._frameContainerRef}></div>
                    <svg id="graph-svg-container" className={styles["graph-svg-container"]} ref={this._svgCanvasRef}></svg>
                    <div id="selection-container" className={styles["selection-container"]} ref={this._selectionContainerRef}></div>
                </div>
                <SearchBoxComponent stateManager={this.stateManager} />
            </div>
        );
    }
}
