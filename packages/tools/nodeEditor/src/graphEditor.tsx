import * as React from "react";
import type { GlobalState } from "./globalState";

import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import { NodeListComponent } from "./components/nodeList/nodeListComponent";
import { PropertyTabComponent } from "./components/propertyTab/propertyTabComponent";
import { Portal } from "./portal";
import { LogComponent, LogEntry } from "./components/log/logComponent";
import { DataStorage } from "core/Misc/dataStorage";
import type { NodeMaterialBlockConnectionPointTypes } from "core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import { CustomBlock } from "core/Materials/Node/Blocks/customBlock";
import { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import type { Nullable } from "core/types";
import { MessageDialogComponent } from "./sharedComponents/messageDialog";
import { BlockTools } from "./blockTools";
import { PreviewManager } from "./components/preview/previewManager";
import type { IEditorData } from "./nodeLocationInfo";
import { PreviewMeshControlComponent } from "./components/preview/previewMeshControlComponent";
import { PreviewAreaComponent } from "./components/preview/previewAreaComponent";
import { SerializationTools } from "./serializationTools";
import { GraphCanvasComponent } from "./diagram/graphCanvas";
import type { GraphNode } from "./diagram/graphNode";
import { GraphFrame } from "./diagram/graphFrame";
import * as ReactDOM from "react-dom";
import type { IInspectorOptions } from "core/Debug/debugLayer";
import { Popup } from "./sharedComponents/popup";

import "./main.scss";

interface IGraphEditorProps {
    globalState: GlobalState;
}

interface IGraphEditorState {
    showPreviewPopUp: boolean;
}

interface IInternalPreviewAreaOptions extends IInspectorOptions {
    popup: boolean;
    original: boolean;
    explorerWidth?: string;
    inspectorWidth?: string;
    embedHostWidth?: string;
}

export class GraphEditor extends React.Component<IGraphEditorProps, IGraphEditorState> {
    public static readonly NodeWidth = 100;
    private _graphCanvasRef: React.RefObject<GraphCanvasComponent>;
    private _diagramContainerRef: React.RefObject<HTMLDivElement>;
    private _graphCanvas: GraphCanvasComponent;
    private _diagramContainer: HTMLDivElement;

    private _startX: number;
    private _moveInProgress: boolean;

    private _leftWidth = DataStorage.ReadNumber("LeftWidth", 200);
    private _rightWidth = DataStorage.ReadNumber("RightWidth", 300);

    private _blocks = new Array<NodeMaterialBlock>();

    private _previewManager: PreviewManager;
    private _copiedNodes: GraphNode[] = [];
    private _copiedFrames: GraphFrame[] = [];
    private _mouseLocationX = 0;
    private _mouseLocationY = 0;
    private _onWidgetKeyUpPointer: any;

    private _previewHost: Nullable<HTMLElement>;
    private _popUpWindow: Window;

    /**
     * Creates a node and recursivly creates its parent nodes from it's input
     * @param block
     * @param recursion
     */
    public createNodeFromObject(block: NodeMaterialBlock, recursion = true) {
        if (this._blocks.indexOf(block) !== -1) {
            return this._graphCanvas.nodes.filter((n) => n.block === block)[0];
        }

        this._blocks.push(block);

        if (this.props.globalState.nodeMaterial!.attachedBlocks.indexOf(block) === -1) {
            this.props.globalState.nodeMaterial!.attachedBlocks.push(block);
        }

        if (block.isFinalMerger) {
            this.props.globalState.nodeMaterial!.addOutputNode(block);
        }

        // Connections
        if (block.inputs.length) {
            for (const input of block.inputs) {
                if (input.isConnected && recursion) {
                    this.createNodeFromObject(input.sourceBlock!);
                }
            }
        }

        // Graph
        const node = this._graphCanvas.appendBlock(block);

        // Links
        if (block.inputs.length && recursion) {
            for (const input of block.inputs) {
                if (input.isConnected) {
                    this._graphCanvas.connectPorts(input.connectedPoint!, input);
                }
            }
        }

        return node;
    }

    addValueNode(type: string) {
        const nodeType: NodeMaterialBlockConnectionPointTypes = BlockTools.GetConnectionNodeTypeFromString(type);

        const newInputBlock = new InputBlock(type, undefined, nodeType);
        return this.createNodeFromObject(newInputBlock);
    }

    componentDidMount() {
        window.addEventListener("wheel", this.onWheel, { passive: false });

        if (this.props.globalState.hostDocument) {
            this._graphCanvas = this._graphCanvasRef.current!;
            this._diagramContainer = this._diagramContainerRef.current!;
            this._previewManager = new PreviewManager(this.props.globalState.hostDocument.getElementById("preview-canvas") as HTMLCanvasElement, this.props.globalState);
            (this.props.globalState as any)._previewManager = this._previewManager;
        }

        if (navigator.userAgent.indexOf("Mobile") !== -1) {
            ((this.props.globalState.hostDocument || document).querySelector(".blocker") as HTMLElement).style.visibility = "visible";
        }

        this.props.globalState.onPopupClosedObservable.addOnce(() => {
            this.componentWillUnmount();
        });

        this.build();
    }

    componentWillUnmount() {
        window.removeEventListener("wheel", this.onWheel);

        if (this.props.globalState.hostDocument) {
            this.props.globalState.hostDocument!.removeEventListener("keyup", this._onWidgetKeyUpPointer, false);
        }

        if (this._previewManager) {
            this._previewManager.dispose();
            this._previewManager = null as any;
        }
    }

    constructor(props: IGraphEditorProps) {
        super(props);

        this.state = {
            showPreviewPopUp: false,
        };

        this._graphCanvasRef = React.createRef();
        this._diagramContainerRef = React.createRef();

        this.props.globalState.onNewBlockRequiredObservable.add((eventData) => {
            let targetX = eventData.targetX;
            let targetY = eventData.targetY;

            if (eventData.needRepositioning) {
                targetX = targetX - this._diagramContainer.offsetLeft;
                targetY = targetY - this._diagramContainer.offsetTop;
            }

            this.emitNewBlock(eventData.type, targetX, targetY);
        });

        this.props.globalState.onRebuildRequiredObservable.add((autoConfigure) => {
            if (this.props.globalState.nodeMaterial) {
                this.buildMaterial(autoConfigure);
            }
        });

        this.props.globalState.onResetRequiredObservable.add(() => {
            this.build();
            if (this.props.globalState.nodeMaterial) {
                this.buildMaterial();
            }
        });

        this.props.globalState.onImportFrameObservable.add((source: any) => {
            const frameData = source.editorData.frames[0];

            // create new graph nodes for only blocks from frame (last blocks added)
            this.props.globalState.nodeMaterial.attachedBlocks.slice(-frameData.blocks.length).forEach((block: NodeMaterialBlock) => {
                this.createNodeFromObject(block);
            });
            this._graphCanvas.addFrame(frameData);
            this.reOrganize(this.props.globalState.nodeMaterial.editorData, true);
        });

        this.props.globalState.onZoomToFitRequiredObservable.add(() => {
            this.zoomToFit();
        });

        this.props.globalState.onReOrganizedRequiredObservable.add(() => {
            this.reOrganize();
        });

        this.props.globalState.onGetNodeFromBlock = (block) => {
            return this._graphCanvas.findNodeFromBlock(block);
        };

        this.props.globalState.hostDocument!.addEventListener(
            "keydown",
            (evt) => {
                if ((evt.keyCode === 46 || evt.keyCode === 8) && !this.props.globalState.blockKeyboardEvents) {
                    // Delete
                    const selectedItems = this._graphCanvas.selectedNodes;

                    for (const selectedItem of selectedItems) {
                        selectedItem.dispose();

                        const targetBlock = selectedItem.block;
                        this.props.globalState.nodeMaterial!.removeBlock(targetBlock);
                        const blockIndex = this._blocks.indexOf(targetBlock);

                        if (blockIndex > -1) {
                            this._blocks.splice(blockIndex, 1);
                        }
                    }

                    if (this._graphCanvas.selectedLink) {
                        this._graphCanvas.selectedLink.dispose();
                    }

                    if (this._graphCanvas.selectedFrames.length) {
                        for (const frame of this._graphCanvas.selectedFrames) {
                            if (frame.isCollapsed) {
                                while (frame.nodes.length > 0) {
                                    const targetBlock = frame.nodes[0].block;
                                    this.props.globalState.nodeMaterial!.removeBlock(targetBlock);
                                    const blockIndex = this._blocks.indexOf(targetBlock);

                                    if (blockIndex > -1) {
                                        this._blocks.splice(blockIndex, 1);
                                    }
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

                    this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
                    this.props.globalState.onRebuildRequiredObservable.notifyObservers(false);
                    return;
                }

                if (!evt.ctrlKey || this.props.globalState.blockKeyboardEvents) {
                    return;
                }

                if (evt.key === "c" || evt.key === "C") {
                    // Copy
                    this._copiedNodes = [];
                    this._copiedFrames = [];

                    if (this._graphCanvas.selectedFrames.length) {
                        for (const frame of this._graphCanvas.selectedFrames) {
                            frame.serialize(true);
                            this._copiedFrames.push(frame);
                        }
                        return;
                    }

                    const selectedItems = this._graphCanvas.selectedNodes;
                    if (!selectedItems.length) {
                        return;
                    }

                    const selectedItem = selectedItems[0] as GraphNode;

                    if (!selectedItem.block) {
                        return;
                    }

                    this._copiedNodes = selectedItems.slice(0);
                } else if (evt.key === "v" || evt.key === "V") {
                    // Paste
                    const rootElement = this.props.globalState.hostDocument!.querySelector(".diagram-container") as HTMLDivElement;
                    const zoomLevel = this._graphCanvas.zoom;
                    let currentY = (this._mouseLocationY - rootElement.offsetTop - this._graphCanvas.y - 20) / zoomLevel;

                    if (this._copiedFrames.length) {
                        for (const frame of this._copiedFrames) {
                            // New frame
                            const newFrame = new GraphFrame(null, this._graphCanvas, true);
                            this._graphCanvas.frames.push(newFrame);

                            newFrame.width = frame.width;
                            newFrame.height = frame.height;
                            newFrame.width / 2;
                            newFrame.name = frame.name;
                            newFrame.color = frame.color;

                            let currentX = (this._mouseLocationX - rootElement.offsetLeft - this._graphCanvas.x) / zoomLevel;
                            newFrame.x = currentX - newFrame.width / 2;
                            newFrame.y = currentY;

                            // Paste nodes
                            if (frame.nodes.length) {
                                currentX = newFrame.x + frame.nodes[0].x - frame.x;
                                currentY = newFrame.y + frame.nodes[0].y - frame.y;

                                this._graphCanvas._frameIsMoving = true;
                                const newNodes = this.pasteSelection(frame.nodes, currentX, currentY);
                                if (newNodes) {
                                    for (const node of newNodes) {
                                        newFrame.syncNode(node);
                                    }
                                }
                                this._graphCanvas._frameIsMoving = false;
                            }

                            newFrame.adjustPorts();

                            if (frame.isCollapsed) {
                                newFrame.isCollapsed = true;
                            }

                            // Select
                            this.props.globalState.onSelectionChangedObservable.notifyObservers({ selection: newFrame, forceKeepSelection: true });
                            return;
                        }
                    }

                    if (!this._copiedNodes.length) {
                        return;
                    }

                    const currentX = (this._mouseLocationX - rootElement.offsetLeft - this._graphCanvas.x - GraphEditor.NodeWidth) / zoomLevel;
                    this.pasteSelection(this._copiedNodes, currentX, currentY, true);
                }
            },
            false
        );
    }

    reconnectNewNodes(nodeIndex: number, newNodes: GraphNode[], sourceNodes: GraphNode[], done: boolean[]) {
        if (done[nodeIndex]) {
            return;
        }

        const currentNode = newNodes[nodeIndex];
        const block = currentNode.block;
        const sourceNode = sourceNodes[nodeIndex];

        for (let inputIndex = 0; inputIndex < sourceNode.block.inputs.length; inputIndex++) {
            const sourceInput = sourceNode.block.inputs[inputIndex];
            const currentInput = block.inputs[inputIndex];
            if (!sourceInput.isConnected) {
                continue;
            }
            const sourceBlock = sourceInput.connectedPoint!.ownerBlock;
            const activeNodes = sourceNodes.filter((s) => s.block === sourceBlock);

            if (activeNodes.length > 0) {
                const activeNode = activeNodes[0];
                const indexInList = sourceNodes.indexOf(activeNode);

                // First make sure to connect the other one
                this.reconnectNewNodes(indexInList, newNodes, sourceNodes, done);

                // Then reconnect
                const outputIndex = sourceBlock.outputs.indexOf(sourceInput.connectedPoint!);
                const newOutput = newNodes[indexInList].block.outputs[outputIndex];

                newOutput.connectTo(currentInput);
            } else {
                // Connect with outside blocks
                sourceInput._connectedPoint!.connectTo(currentInput);
            }

            this._graphCanvas.connectPorts(currentInput.connectedPoint!, currentInput);
        }

        currentNode.refresh();

        done[nodeIndex] = true;
    }

    pasteSelection(copiedNodes: GraphNode[], currentX: number, currentY: number, selectNew = false) {
        let originalNode: Nullable<GraphNode> = null;

        const newNodes: GraphNode[] = [];

        // Copy to prevent recursive side effects while creating nodes.
        copiedNodes = copiedNodes.slice();

        // Cancel selection
        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);

        // Create new nodes
        for (const node of copiedNodes) {
            const block = node.block;

            if (!block) {
                continue;
            }

            const clone = block.clone(this.props.globalState.nodeMaterial.getScene());

            if (!clone) {
                return;
            }

            const newNode = this.createNodeFromObject(clone, false);

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

            if (selectNew) {
                this.props.globalState.onSelectionChangedObservable.notifyObservers({ selection: newNode, forceKeepSelection: true });
            }
        }

        // Relink
        const done = new Array<boolean>(newNodes.length);
        for (let index = 0; index < newNodes.length; index++) {
            this.reconnectNewNodes(index, newNodes, copiedNodes, done);
        }

        return newNodes;
    }

    zoomToFit() {
        this._graphCanvas.zoomToFit();
    }

    buildMaterial(autoConfigure = true) {
        if (!this.props.globalState.nodeMaterial) {
            return;
        }

        try {
            this.props.globalState.nodeMaterial.options.emitComments = true;
            this.props.globalState.nodeMaterial.build(true, undefined, autoConfigure);
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Node material build successful", false));
        } catch (err) {
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(err, true));
        }

        SerializationTools.UpdateLocations(this.props.globalState.nodeMaterial, this.props.globalState);

        this.props.globalState.onBuiltObservable.notifyObservers();
    }

    build() {
        let editorData = this.props.globalState.nodeMaterial.editorData;
        this._graphCanvas._isLoading = true; // Will help loading large graphes

        if (editorData instanceof Array) {
            editorData = {
                locations: editorData,
            };
        }

        // setup the diagram model
        this._blocks = [];
        this._graphCanvas.reset();

        // Load graph of nodes from the material
        if (this.props.globalState.nodeMaterial) {
            this.loadGraph();
        }

        this.reOrganize(editorData);
    }

    loadGraph() {
        const material = this.props.globalState.nodeMaterial;
        material._vertexOutputNodes.forEach((n: any) => {
            this.createNodeFromObject(n, true);
        });
        material._fragmentOutputNodes.forEach((n: any) => {
            this.createNodeFromObject(n, true);
        });

        material.attachedBlocks.forEach((n: any) => {
            this.createNodeFromObject(n, true);
        });

        // Links
        material.attachedBlocks.forEach((n: any) => {
            if (n.inputs.length) {
                for (const input of n.inputs) {
                    if (input.isConnected) {
                        this._graphCanvas.connectPorts(input.connectedPoint!, input);
                    }
                }
            }
        });
    }

    showWaitScreen() {
        this.props.globalState.hostDocument.querySelector(".wait-screen")?.classList.remove("hidden");
    }

    hideWaitScreen() {
        this.props.globalState.hostDocument.querySelector(".wait-screen")?.classList.add("hidden");
    }

    reOrganize(editorData: Nullable<IEditorData> = null, isImportingAFrame = false) {
        this.showWaitScreen();
        this._graphCanvas._isLoading = true; // Will help loading large graphes

        setTimeout(() => {
            if (!editorData || !editorData.locations) {
                this._graphCanvas.distributeGraph();
            } else {
                // Locations
                for (const location of editorData.locations) {
                    for (const node of this._graphCanvas.nodes) {
                        if (node.block && node.block.uniqueId === location.blockId) {
                            node.x = location.x;
                            node.y = location.y;
                            node.cleanAccumulation();
                            break;
                        }
                    }
                }

                if (!isImportingAFrame) {
                    this._graphCanvas.processEditorData(editorData);
                }
            }

            this._graphCanvas._isLoading = false;
            for (const node of this._graphCanvas.nodes) {
                node._refreshLinks();
            }
            this.hideWaitScreen();
        });
    }

    onPointerDown(evt: React.PointerEvent<HTMLDivElement>) {
        this._startX = evt.clientX;
        this._moveInProgress = true;
        evt.currentTarget.setPointerCapture(evt.pointerId);
    }

    onPointerUp(evt: React.PointerEvent<HTMLDivElement>) {
        this._moveInProgress = false;
        evt.currentTarget.releasePointerCapture(evt.pointerId);
    }

    onWheel(this: any, evt: WheelEvent) {
        if (evt.ctrlKey) {
            return evt.preventDefault();
        }

        if (Math.abs(evt.deltaX) < Math.abs(evt.deltaY)) {
            return;
        }

        const scrollLeftMax = this.scrollWidth - this.offsetWidth;
        if (this.scrollLeft + evt.deltaX < 0 || this.scrollLeft + evt.deltaX > scrollLeftMax) {
            return evt.preventDefault();
        }
    }

    resizeColumns(evt: React.PointerEvent<HTMLDivElement>, forLeft = true) {
        if (!this._moveInProgress) {
            return;
        }

        const deltaX = evt.clientX - this._startX;
        const rootElement = evt.currentTarget.ownerDocument!.getElementById("node-editor-graph-root") as HTMLDivElement;

        if (forLeft) {
            this._leftWidth += deltaX;
            this._leftWidth = Math.max(150, Math.min(400, this._leftWidth));
            DataStorage.WriteNumber("LeftWidth", this._leftWidth);
        } else {
            this._rightWidth -= deltaX;
            this._rightWidth = Math.max(250, Math.min(500, this._rightWidth));
            DataStorage.WriteNumber("RightWidth", this._rightWidth);
            rootElement.ownerDocument!.getElementById("preview")!.style.height = this._rightWidth + "px";
        }

        rootElement.style.gridTemplateColumns = this.buildColumnLayout();

        this._startX = evt.clientX;
    }

    buildColumnLayout() {
        return `${this._leftWidth}px 4px calc(100% - ${this._leftWidth + 8 + this._rightWidth}px) 4px ${this._rightWidth}px`;
    }

    emitNewBlock(blockType: string, targetX: number, targetY: number) {
        let newNode: GraphNode;

        let customBlockData: any;

        if (blockType.indexOf("CustomBlock") > -1) {
            const storageData = localStorage.getItem(blockType);
            if (!storageData) {
                this.props.globalState.onErrorMessageDialogRequiredObservable.notifyObservers(`Error loading custom block`);
                return;
            }

            customBlockData = JSON.parse(storageData);
            if (!customBlockData) {
                this.props.globalState.onErrorMessageDialogRequiredObservable.notifyObservers(`Error parsing custom block`);
                return;
            }
        } else if (blockType.indexOf("Custom") > -1) {
            const storageData = localStorage.getItem(blockType);
            if (storageData) {
                const frameData = JSON.parse(storageData);

                //edit position before loading.
                const newX = (targetX - this._graphCanvas.x - GraphEditor.NodeWidth) / this._graphCanvas.zoom;
                const newY = (targetY - this._graphCanvas.y - 20) / this._graphCanvas.zoom;
                const oldX = frameData.editorData.frames[0].x;
                const oldY = frameData.editorData.frames[0].y;
                frameData.editorData.frames[0].x = newX;
                frameData.editorData.frames[0].y = newY;
                for (const location of frameData.editorData.locations) {
                    location.x += newX - oldX;
                    location.y += newY - oldY;
                }

                SerializationTools.AddFrameToMaterial(frameData, this.props.globalState, this.props.globalState.nodeMaterial);
                this._graphCanvas.frames[this._graphCanvas.frames.length - 1].cleanAccumulation();
                this.forceUpdate();
                return;
            }
        }

        if (blockType.indexOf("Block") === -1) {
            newNode = this.addValueNode(blockType);
        } else {
            let block: NodeMaterialBlock;
            if (customBlockData) {
                block = new CustomBlock("");
                (block as CustomBlock).options = customBlockData;
            } else {
                block = BlockTools.GetBlockFromString(blockType, this.props.globalState.nodeMaterial.getScene(), this.props.globalState.nodeMaterial)!;
            }

            if (block.isUnique) {
                const className = block.getClassName();
                for (const other of this._blocks) {
                    if (other !== block && other.getClassName() === className) {
                        this.props.globalState.onErrorMessageDialogRequiredObservable.notifyObservers(`You can only have one ${className} per graph`);
                        return;
                    }
                }
            }

            block.autoConfigure(this.props.globalState.nodeMaterial);
            newNode = this.createNodeFromObject(block);
        }

        // Size exceptions
        let offsetX = GraphEditor.NodeWidth;
        let offsetY = 20;

        if (blockType === "ElbowBlock") {
            offsetX = 10;
            offsetY = 10;
        }

        // Drop
        let x = targetX - this._graphCanvas.x - offsetX * this._graphCanvas.zoom;
        let y = targetY - this._graphCanvas.y - offsetY * this._graphCanvas.zoom;

        newNode.x = x / this._graphCanvas.zoom;
        newNode.y = y / this._graphCanvas.zoom;
        newNode.cleanAccumulation();

        this.props.globalState.onNewNodeCreatedObservable.notifyObservers(newNode);
        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
        this.props.globalState.onSelectionChangedObservable.notifyObservers({ selection: newNode });

        const block = newNode.block;

        x -= GraphEditor.NodeWidth + 150;

        block.inputs.forEach((connection) => {
            if (connection.connectedPoint) {
                const existingNodes = this._graphCanvas.nodes.filter((n) => {
                    return n.block === (connection as any).connectedPoint.ownerBlock;
                });
                const connectedNode = existingNodes[0];

                if (connectedNode.x === 0 && connectedNode.y === 0) {
                    connectedNode.x = x / this._graphCanvas.zoom;
                    connectedNode.y = y / this._graphCanvas.zoom;
                    connectedNode.cleanAccumulation();
                    y += 80;
                }
            }
        });

        this.forceUpdate();
    }

    dropNewBlock(event: React.DragEvent<HTMLDivElement>) {
        const data = event.dataTransfer.getData("babylonjs-material-node") as string;

        this.emitNewBlock(data, event.clientX - this._diagramContainer.offsetLeft, event.clientY - this._diagramContainer.offsetTop);
    }

    handlePopUp = () => {
        this.setState({
            showPreviewPopUp: true,
        });
        this.createPopUp();
        this.props.globalState.hostWindow.addEventListener("beforeunload", this.handleClosingPopUp);
    };

    handleClosingPopUp = () => {
        if (this._previewManager) {
            this._previewManager.dispose();
        }
        this._popUpWindow.close();
        this.setState(
            {
                showPreviewPopUp: false,
            },
            () => this.initiatePreviewArea()
        );
    };

    initiatePreviewArea = (canvas: HTMLCanvasElement = this.props.globalState.hostDocument.getElementById("preview-canvas") as HTMLCanvasElement) => {
        this._previewManager = new PreviewManager(canvas, this.props.globalState);
    };

    createPopUp = () => {
        const userOptions = {
            original: true,
            popup: true,
            overlay: false,
            embedMode: false,
            enableClose: true,
            handleResize: true,
            enablePopup: true,
        };
        const options = {
            embedHostWidth: "100%",
            ...userOptions,
        };
        const popUpWindow = this.createPopupWindow("PREVIEW AREA", "_PreviewHostWindow");
        if (popUpWindow) {
            popUpWindow.addEventListener("beforeunload", this.handleClosingPopUp);
            const parentControl = popUpWindow.document.getElementById("node-editor-graph-root");
            this.createPreviewMeshControlHost(options, parentControl);
            this.createPreviewHost(options, parentControl);
            if (parentControl) {
                this.fixPopUpStyles(parentControl.ownerDocument!);
                this.initiatePreviewArea(parentControl.ownerDocument!.getElementById("preview-canvas") as HTMLCanvasElement);
            }
        }
    };

    createPopupWindow = (title: string, windowVariableName: string, width = 500, height = 500): Window | null => {
        const windowCreationOptionsList = {
            width: width,
            height: height,
            top: (this.props.globalState.hostWindow.innerHeight - width) / 2 + window.screenY,
            left: (this.props.globalState.hostWindow.innerWidth - height) / 2 + window.screenX,
        };

        const windowCreationOptions = Object.keys(windowCreationOptionsList)
            .map((key) => key + "=" + (windowCreationOptionsList as any)[key])
            .join(",");

        const popupWindow = this.props.globalState.hostWindow.open("", title, windowCreationOptions);
        if (!popupWindow) {
            return null;
        }

        const parentDocument = popupWindow.document;

        parentDocument.title = title;
        parentDocument.body.style.width = "100%";
        parentDocument.body.style.height = "100%";
        parentDocument.body.style.margin = "0";
        parentDocument.body.style.padding = "0";

        const parentControl = parentDocument.createElement("div");
        parentControl.style.width = "100%";
        parentControl.style.height = "100%";
        parentControl.style.margin = "0";
        parentControl.style.padding = "0";
        parentControl.style.display = "grid";
        parentControl.style.gridTemplateRows = "40px auto";
        parentControl.id = "node-editor-graph-root";
        parentControl.className = "right-panel popup";

        popupWindow.document.body.appendChild(parentControl);

        Popup._CopyStyles(this.props.globalState.hostWindow.document, parentDocument);

        (this as any)[windowVariableName] = popupWindow;

        this._popUpWindow = popupWindow;

        return popupWindow;
    };

    createPreviewMeshControlHost = (options: IInternalPreviewAreaOptions, parentControl: Nullable<HTMLElement>) => {
        // Prepare the preview control host
        if (parentControl) {
            const host = parentControl.ownerDocument!.createElement("div");

            host.id = "PreviewMeshControl-host";
            host.style.width = options.embedHostWidth || "auto";

            parentControl.appendChild(host);
            const previewMeshControlComponentHost = React.createElement(PreviewMeshControlComponent, {
                globalState: this.props.globalState,
                togglePreviewAreaComponent: this.handlePopUp,
            });
            ReactDOM.render(previewMeshControlComponentHost, host);
        }
    };

    createPreviewHost = (options: IInternalPreviewAreaOptions, parentControl: Nullable<HTMLElement>) => {
        // Prepare the preview host
        if (parentControl) {
            const host = parentControl.ownerDocument!.createElement("div");

            host.id = "PreviewAreaComponent-host";
            host.style.width = options.embedHostWidth || "auto";
            host.style.height = "100%";
            host.style.overflow = "hidden";
            host.style.display = "grid";
            host.style.gridRow = "2";
            host.style.gridTemplateRows = "auto 40px";
            host.style.gridTemplateRows = "calc(100% - 40px) 40px";

            parentControl.appendChild(host);

            this._previewHost = host;

            if (!options.overlay) {
                this._previewHost.style.position = "relative";
            }
        }

        if (this._previewHost) {
            const previewAreaComponentHost = React.createElement(PreviewAreaComponent, {
                globalState: this.props.globalState,
                width: 200,
            });
            ReactDOM.render(previewAreaComponentHost, this._previewHost);
        }
    };

    fixPopUpStyles = (document: Document) => {
        const previewContainer = document.getElementById("preview");
        if (previewContainer) {
            previewContainer.style.height = "auto";
            previewContainer.style.gridRow = "1";
        }
        const previewConfigBar = document.getElementById("preview-config-bar");
        if (previewConfigBar) {
            previewConfigBar.style.gridRow = "2";
        }
        const newWindowButton = document.getElementById("preview-new-window");
        if (newWindowButton) {
            newWindowButton.style.display = "none";
        }
        const previewMeshBar = document.getElementById("preview-mesh-bar");
        if (previewMeshBar) {
            previewMeshBar.style.gridTemplateColumns = "auto 1fr 40px 40px";
        }
    };

    render() {
        return (
            <Portal globalState={this.props.globalState}>
                <div
                    id="node-editor-graph-root"
                    style={{
                        gridTemplateColumns: this.buildColumnLayout(),
                    }}
                    onMouseMove={(evt) => {
                        this._mouseLocationX = evt.pageX;
                        this._mouseLocationY = evt.pageY;
                    }}
                    onMouseDown={(evt) => {
                        if ((evt.target as HTMLElement).nodeName === "INPUT") {
                            return;
                        }
                        this.props.globalState.blockKeyboardEvents = false;
                    }}
                >
                    {/* Node creation menu */}
                    <NodeListComponent globalState={this.props.globalState} />

                    <div
                        id="leftGrab"
                        onPointerDown={(evt) => this.onPointerDown(evt)}
                        onPointerUp={(evt) => this.onPointerUp(evt)}
                        onPointerMove={(evt) => this.resizeColumns(evt)}
                    ></div>

                    {/* The node graph diagram */}
                    <div
                        className="diagram-container"
                        ref={this._diagramContainerRef}
                        onDrop={(event) => {
                            this.dropNewBlock(event);
                        }}
                        onDragOver={(event) => {
                            event.preventDefault();
                        }}
                    >
                        <GraphCanvasComponent
                            ref={this._graphCanvasRef}
                            globalState={this.props.globalState}
                            onEmitNewBlock={(block) => {
                                return this.createNodeFromObject(block);
                            }}
                        />
                    </div>

                    <div
                        id="rightGrab"
                        onPointerDown={(evt) => this.onPointerDown(evt)}
                        onPointerUp={(evt) => this.onPointerUp(evt)}
                        onPointerMove={(evt) => this.resizeColumns(evt, false)}
                    ></div>

                    {/* Property tab */}
                    <div className="right-panel">
                        <PropertyTabComponent globalState={this.props.globalState} />
                        {!this.state.showPreviewPopUp ? <PreviewMeshControlComponent globalState={this.props.globalState} togglePreviewAreaComponent={this.handlePopUp} /> : null}
                        {!this.state.showPreviewPopUp ? <PreviewAreaComponent globalState={this.props.globalState} width={this._rightWidth} /> : null}
                    </div>

                    <LogComponent globalState={this.props.globalState} />
                </div>
                <MessageDialogComponent globalState={this.props.globalState} />
                <div className="blocker">Node Material Editor runs only on desktop</div>
                <div className="wait-screen hidden">Processing...please wait</div>
            </Portal>
        );
    }
}
