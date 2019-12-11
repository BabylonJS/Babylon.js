import * as React from "react";
import { GlobalState } from './globalState';

import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { NodeListComponent } from './components/nodeList/nodeListComponent';
import { PropertyTabComponent } from './components/propertyTab/propertyTabComponent';
import { Portal } from './portal';
import { LogComponent, LogEntry } from './components/log/logComponent';
import { DataStorage } from './dataStorage';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
import { Nullable } from 'babylonjs/types';
import { MessageDialogComponent } from './sharedComponents/messageDialog';
import { BlockTools } from './blockTools';
import { PreviewManager } from './components/preview/previewManager';
import { IEditorData } from './nodeLocationInfo';
import { PreviewMeshControlComponent } from './components/preview/previewMeshControlComponent';
import { PreviewAreaComponent } from './components/preview/previewAreaComponent';
import { SerializationTools } from './serializationTools';
import { GraphCanvasComponent } from './diagram/graphCanvas';
import { GraphNode } from './diagram/graphNode';
import { GraphFrame } from './diagram/graphFrame';

require("./main.scss");

interface IGraphEditorProps {
    globalState: GlobalState;
}

export class GraphEditor extends React.Component<IGraphEditorProps> {
    private readonly NodeWidth = 100;
    private _graphCanvas: GraphCanvasComponent;

    private _startX: number;
    private _moveInProgress: boolean;

    private _leftWidth = DataStorage.ReadNumber("LeftWidth", 200);
    private _rightWidth = DataStorage.ReadNumber("RightWidth", 300);

    private _blocks = new Array<NodeMaterialBlock>();

    private _previewManager: PreviewManager;
    private _copiedNodes: GraphNode[] = [];
    private _copiedFrame: Nullable<GraphFrame> = null;
    private _mouseLocationX = 0;
    private _mouseLocationY = 0;
    private _onWidgetKeyUpPointer: any;

    /**
     * Creates a node and recursivly creates its parent nodes from it's input
     * @param nodeMaterialBlock 
     */
    public createNodeFromObject(block: NodeMaterialBlock) {
        if (this._blocks.indexOf(block) !== -1) {        
            return this._graphCanvas.nodes.filter(n => n.block === block)[0];
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
            for (var input of block.inputs) {
                if (input.isConnected) {
                    this.createNodeFromObject(input.sourceBlock!);
                }
            }
        }

        // Graph
        const node = this._graphCanvas.appendBlock(block);

        // Links
        if (block.inputs.length) {
            for (var input of block.inputs) {
                if (input.isConnected) {
                    this._graphCanvas.connectPorts(input.connectedPoint!, input);
                }
            }
        }

        return node;
    }
    
    addValueNode(type: string) {
        let nodeType: NodeMaterialBlockConnectionPointTypes = BlockTools.GetConnectionNodeTypeFromString(type);

        let newInputBlock = new InputBlock(type, undefined, nodeType);
        return this.createNodeFromObject(newInputBlock)
    }

    componentDidMount() {
        if (this.props.globalState.hostDocument) {
            this._graphCanvas = (this.refs["graphCanvas"] as GraphCanvasComponent);
            this._previewManager = new PreviewManager(this.props.globalState.hostDocument.getElementById("preview-canvas") as HTMLCanvasElement, this.props.globalState);
        }

        if (navigator.userAgent.indexOf("Mobile") !== -1) {
            ((this.props.globalState.hostDocument || document).querySelector(".blocker") as HTMLElement).style.visibility = "visible";
        }

        this.build();
    }

    componentWillUnmount() {
        if (this.props.globalState.hostDocument) {
            this.props.globalState.hostDocument!.removeEventListener("keyup", this._onWidgetKeyUpPointer, false);
        }

        if (this._previewManager) {
            this._previewManager.dispose();
        }
    }

    constructor(props: IGraphEditorProps) {
        super(props);

        this.props.globalState.onRebuildRequiredObservable.add(() => {
            if (this.props.globalState.nodeMaterial) {
                this.buildMaterial();
            }
        });

        this.props.globalState.onResetRequiredObservable.add(() => {
            this.build();
            if (this.props.globalState.nodeMaterial) {
                this.buildMaterial();
            }
        });

        this.props.globalState.onZoomToFitRequiredObservable.add(() => {
            this.zoomToFit();
        });

        this.props.globalState.onReOrganizedRequiredObservable.add(() => {
            this.reOrganize();
        });

        this.props.globalState.onGetNodeFromBlock = (block) => {
             return this._graphCanvas.findNodeFromBlock(block);
        }

        this.props.globalState.hostDocument!.addEventListener("keydown", evt => {
            if (evt.keyCode === 46 && !this.props.globalState.blockKeyboardEvents) { // Delete                
                let selectedItems = this._graphCanvas.selectedNodes;

                for (var selectedItem of selectedItems) {
                    selectedItem.dispose();

                    let targetBlock = selectedItem.block;
                    this.props.globalState.nodeMaterial!.removeBlock(targetBlock);
                    let blockIndex = this._blocks.indexOf(targetBlock);

                    if (blockIndex > -1) {
                        this._blocks.splice(blockIndex, 1);
                    }                                  
                }

                if (this._graphCanvas.selectedLink) {
                    this._graphCanvas.selectedLink.dispose();
                }

                if (this._graphCanvas.selectedFrame) {
                    this._graphCanvas.selectedFrame.dispose();
                }

                this.props.globalState.onSelectionChangedObservable.notifyObservers(null);  
                this.props.globalState.onRebuildRequiredObservable.notifyObservers();  
                return;
            }

            if (!evt.ctrlKey || this.props.globalState.blockKeyboardEvents) {
                return;
            }

            if (evt.key === "c") { // Copy
                this._copiedNodes = [];
                this._copiedFrame = null;

                if (this._graphCanvas.selectedFrame) {
                    this._copiedFrame = this._graphCanvas.selectedFrame;
                    return;
                }

                let selectedItems = this._graphCanvas.selectedNodes;
                if (!selectedItems.length) {
                    return;
                }
    
                let selectedItem = selectedItems[0] as GraphNode;
    
                if (!selectedItem.block) {
                    return;
                }

                this._copiedNodes = selectedItems.slice(0);
            } else if (evt.key === "v") { // Paste
                const rootElement = this.props.globalState.hostDocument!.querySelector(".diagram-container") as HTMLDivElement;
                const zoomLevel = this._graphCanvas.zoom;
                let currentY = (this._mouseLocationY - rootElement.offsetTop - this._graphCanvas.y - 20) / zoomLevel;

                if (this._copiedFrame) {                    
                    // New frame
                    let newFrame = new GraphFrame(null, this._graphCanvas, true);
                    this._graphCanvas.frames.push(newFrame);

                    newFrame.width = this._copiedFrame.width;
                    newFrame.height = this._copiedFrame.height;newFrame.width / 2
                    newFrame.name = this._copiedFrame.name;
                    newFrame.color = this._copiedFrame.color;

                    let currentX = (this._mouseLocationX - rootElement.offsetLeft - this._graphCanvas.x) / zoomLevel;
                    newFrame.x = currentX - newFrame.width / 2;
                    newFrame.y = currentY;

                    // Paste nodes

                    if (this._copiedFrame.nodes.length) {
                        currentX = newFrame.x + this._copiedFrame.nodes[0].x - this._copiedFrame.x;
                        currentY = newFrame.y + this._copiedFrame.nodes[0].y - this._copiedFrame.y;
                        this.pasteSelection(this._copiedFrame.nodes, currentX, currentY);                  
                    }

                    if (this._copiedFrame.isCollapsed) {
                        newFrame.isCollapsed = true;
                    }
                    return;
                }

                if (!this._copiedNodes.length) {
                    return;
                }

                let currentX = (this._mouseLocationX - rootElement.offsetLeft - this._graphCanvas.x - this.NodeWidth) / zoomLevel;
                this.pasteSelection(this._copiedNodes, currentX, currentY);
            }

        }, false);
    }

    reconnectNewNodes(nodeIndex: number, newNodes:GraphNode[], sourceNodes:GraphNode[], done: boolean[]) {
        if (done[nodeIndex]) {
            return;
        }

        const currentNode = newNodes[nodeIndex];
        const block = currentNode.block;
        const sourceNode = sourceNodes[nodeIndex];

        for (var inputIndex = 0; inputIndex < sourceNode.block.inputs.length; inputIndex++) {
            let sourceInput = sourceNode.block.inputs[inputIndex];
            const currentInput = block.inputs[inputIndex];
            if (!sourceInput.isConnected) {
                continue;
            }
            const sourceBlock = sourceInput.connectedPoint!.ownerBlock;
            const activeNodes = sourceNodes.filter(s => s.block === sourceBlock);

            if (activeNodes.length > 0) {
                const activeNode = activeNodes[0];
                let indexInList = sourceNodes.indexOf(activeNode);

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

    pasteSelection(copiedNodes: GraphNode[], currentX: number, currentY: number) {

        let originalNode: Nullable<GraphNode> = null;

        let newNodes:GraphNode[] = [];

        // Create new nodes
        for (var node of copiedNodes) {
            let block = node.block;

            if (!block) {
                continue;
            }

            let clone = block.clone(this.props.globalState.nodeMaterial.getScene());

            if (!clone) {
                return;
            }
            
            let newNode = this.createNodeFromObject(clone);

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
        }

        // Relink
        let done = new Array<boolean>(newNodes.length);
        for (var index = 0; index < newNodes.length; index++) {
            this.reconnectNewNodes(index, newNodes, copiedNodes, done);
        }

    }

    zoomToFit() {
        this._graphCanvas.zoomToFit();
    }

    buildMaterial() {
        if (!this.props.globalState.nodeMaterial) {
            return;
        }

        try {
            this.props.globalState.nodeMaterial.build(true);
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Node material build successful", false));
        }
        catch (err) {
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(err, true));
        }

        SerializationTools.UpdateLocations(this.props.globalState.nodeMaterial, this.props.globalState);
    }

    build() {        
        let editorData = this.props.globalState.nodeMaterial.editorData;

        if (editorData instanceof Array) {
            editorData = {
                locations: editorData
            }
        }

        // setup the diagram model
        this._blocks = [];
        this._graphCanvas.reset();

        // Load graph of nodes from the material
        if (this.props.globalState.nodeMaterial) {
            var material = this.props.globalState.nodeMaterial;
            material._vertexOutputNodes.forEach((n: any) => {
                this.createNodeFromObject(n);
            });
            material._fragmentOutputNodes.forEach((n: any) => {
                this.createNodeFromObject(n);
            });

            material.attachedBlocks.forEach((n: any) => {
                this.createNodeFromObject(n);
            });

            // Links
            material.attachedBlocks.forEach((n: any) => {
                if (n.inputs.length) {
                    for (var input of n.inputs) {
                        if (input.isConnected) {
                            this._graphCanvas.connectPorts(input.connectedPoint!, input);
                        }
                    }
                }
            });            
        }

        this.reOrganize(editorData);
    }

    reOrganize(editorData: Nullable<IEditorData> = null) {
        if (!editorData || !editorData.locations) {
            this._graphCanvas.distributeGraph();
        } else {
            // Locations
            for (var location of editorData.locations) {
                for (var node of this._graphCanvas.nodes) {
                    if (node.block && node.block.uniqueId === location.blockId) {
                        node.x = location.x;
                        node.y = location.y;
                        node.cleanAccumulation();
                        break;
                    }
                }
            }

            this._graphCanvas.processEditorData(editorData);
        }
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

    resizeColumns(evt: React.PointerEvent<HTMLDivElement>, forLeft = true) {
        if (!this._moveInProgress) {
            return;
        }

        const deltaX = evt.clientX - this._startX;
        const rootElement = evt.currentTarget.ownerDocument!.getElementById("node-editor-graph-root") as HTMLDivElement;

        if (forLeft) {
            this._leftWidth += deltaX;
            this._leftWidth = Math.max(150, Math.min(400, this._leftWidth));
            DataStorage.StoreNumber("LeftWidth", this._leftWidth);
        } else {
            this._rightWidth -= deltaX;
            this._rightWidth = Math.max(250, Math.min(500, this._rightWidth));
            DataStorage.StoreNumber("RightWidth", this._rightWidth);
            rootElement.ownerDocument!.getElementById("preview")!.style.height = this._rightWidth + "px";
        }

        rootElement.style.gridTemplateColumns = this.buildColumnLayout();

        this._startX = evt.clientX;
    }

    buildColumnLayout() {
        return `${this._leftWidth}px 4px calc(100% - ${this._leftWidth + 8 + this._rightWidth}px) 4px ${this._rightWidth}px`;
    }

    emitNewBlock(event: React.DragEvent<HTMLDivElement>) {
        var data = event.dataTransfer.getData("babylonjs-material-node") as string;
        let newNode: GraphNode;

        if (data.indexOf("Block") === -1) {
            newNode = this.addValueNode(data);
        } else {
            let block = BlockTools.GetBlockFromString(data, this.props.globalState.nodeMaterial.getScene(), this.props.globalState.nodeMaterial)!;   
            
            if (block.isUnique) {
                const className = block.getClassName();
                for (var other of this._blocks) {
                    if (other !== block && other.getClassName() === className) {
                        this.props.globalState.onErrorMessageDialogRequiredObservable.notifyObservers(`You can only have one ${className} per graph`);                                
                        return;
                    }
                }
            } 

            block.autoConfigure(this.props.globalState.nodeMaterial);       
            newNode = this.createNodeFromObject(block);
        };

        let x = event.clientX - event.currentTarget.offsetLeft - this._graphCanvas.x - this.NodeWidth;
        let y = event.clientY - event.currentTarget.offsetTop - this._graphCanvas.y - 20;
        
        newNode.x = x / this._graphCanvas.zoom;
        newNode.y = y / this._graphCanvas.zoom;
        newNode.cleanAccumulation();

        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
        this.props.globalState.onSelectionChangedObservable.notifyObservers(newNode);

        let block = newNode.block;

        x -= this.NodeWidth + 150;

        block.inputs.forEach((connection) => {       
            if (connection.connectedPoint) {
                var existingNodes = this._graphCanvas.nodes.filter((n) => { return n.block === (connection as any).connectedPoint.ownerBlock });
                let connectedNode = existingNodes[0];

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

    render() {
        return (
            <Portal globalState={this.props.globalState}>
                <div id="node-editor-graph-root" style={
                    {
                        gridTemplateColumns: this.buildColumnLayout()
                    }}
                    onMouseMove={evt => {                
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

                    <div id="leftGrab"
                        onPointerDown={evt => this.onPointerDown(evt)}
                        onPointerUp={evt => this.onPointerUp(evt)}
                        onPointerMove={evt => this.resizeColumns(evt)}
                    ></div>

                    {/* The node graph diagram */}
                    <div className="diagram-container"
                        onDrop={event => {
                            this.emitNewBlock(event);
                        }}
                        onDragOver={event => {
                            event.preventDefault();
                        }}
                    >
                        <GraphCanvasComponent ref={"graphCanvas"} globalState={this.props.globalState}/>
                    </div>

                    <div id="rightGrab"
                        onPointerDown={evt => this.onPointerDown(evt)}
                        onPointerUp={evt => this.onPointerUp(evt)}
                        onPointerMove={evt => this.resizeColumns(evt, false)}
                    ></div>

                    {/* Property tab */}
                    <div className="right-panel">
                        <PropertyTabComponent globalState={this.props.globalState} />
                        <PreviewMeshControlComponent globalState={this.props.globalState} />
                        <PreviewAreaComponent globalState={this.props.globalState} width={this._rightWidth}/>
                    </div>

                    <LogComponent globalState={this.props.globalState} />
                </div>                
                <MessageDialogComponent globalState={this.props.globalState} />
                <div className="blocker">
                    Node Material Editor runs only on desktop
                </div>
            </Portal>
        );
    }
}