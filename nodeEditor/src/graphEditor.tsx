import {
    DiagramEngine,
    DiagramWidget,
    LinkModel
} from "storm-react-diagrams";

import * as React from "react";
import { GlobalState } from './globalState';

import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
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
import { INodeLocationInfo } from './nodeLocationInfo';
import { PreviewMeshControlComponent } from './components/preview/previewMeshControlComponent';
import { PreviewAreaComponent } from './components/preview/previewAreaComponent';
import { SerializationTools } from './serializationTools';
import { GraphCanvasComponent } from './diagram/graphCanvas';
import { GraphNode } from './diagram/graphNode';

require("./main.scss");

interface IGraphEditorProps {
    globalState: GlobalState;
}

export class NodeCreationOptions {
    nodeMaterialBlock: NodeMaterialBlock;
    type?: string;
    connection?: NodeMaterialConnectionPoint;
}

export class GraphEditor extends React.Component<IGraphEditorProps> {
    private readonly NodeWidth = 100;
    private _graphCanvas: GraphCanvasComponent;
    private _engine: DiagramEngine;

    private _startX: number;
    private _moveInProgress: boolean;

    private _leftWidth = DataStorage.ReadNumber("LeftWidth", 200);
    private _rightWidth = DataStorage.ReadNumber("RightWidth", 300);

    private _blocks = new Array<NodeMaterialBlock>();

    private _previewManager: PreviewManager;
    // private _copiedNodes: GraphNode[] = [];
    // private _mouseLocationX = 0;
    // private _mouseLocationY = 0;
    private _onWidgetKeyUpPointer: any;

    private _altKeyIsPressed = false;
    private _oldY = -1;

    /** @hidden */
    public _toAdd: LinkModel[] | null = [];

    /**
     * Creates a node and recursivly creates its parent nodes from it's input
     * @param nodeMaterialBlock 
     */
    public createNodeFromObject(options: NodeCreationOptions) {
        if (this._blocks.indexOf(options.nodeMaterialBlock) !== -1) {        
            return this._graphCanvas.nodes.filter(n => n.block === options.nodeMaterialBlock)[0];
        }

        this._blocks.push(options.nodeMaterialBlock);

        if (this.props.globalState.nodeMaterial!.attachedBlocks.indexOf(options.nodeMaterialBlock) === -1) {
            this.props.globalState.nodeMaterial!.attachedBlocks.push(options.nodeMaterialBlock);
        }

        if (options.nodeMaterialBlock.isFinalMerger) {
            this.props.globalState.nodeMaterial!.addOutputNode(options.nodeMaterialBlock);
        }

        // Graph
        return this._graphCanvas.appendBlock(options.nodeMaterialBlock);
    }
    
    addValueNode(type: string) {
        let nodeType: NodeMaterialBlockConnectionPointTypes = BlockTools.GetConnectionNodeTypeFromString(type);

        let newInputBlock = new InputBlock(type, undefined, nodeType);
        return this.createNodeFromObject({ type: type, nodeMaterialBlock: newInputBlock })
    }

    onWidgetKeyUp(evt: any) {        
        this._altKeyIsPressed = false;
        this._oldY = -1;

        var widget = (this.refs["test"] as DiagramWidget);

        if (!widget || this.props.globalState.blockKeyboardEvents) {
            return;
        }

        widget.onKeyUp(evt)
    }

    componentDidMount() {
        if (this.props.globalState.hostDocument) {
            this._graphCanvas = (this.refs["graphCanvas"] as GraphCanvasComponent);


            var widget = (this.refs["test"] as DiagramWidget);
            widget.setState({ document: this.props.globalState.hostDocument })
            this._onWidgetKeyUpPointer = this.onWidgetKeyUp.bind(this)
            this.props.globalState.hostDocument!.addEventListener("keyup", this._onWidgetKeyUpPointer, false);
            this.props.globalState.hostDocument!.defaultView!.addEventListener("blur", () => this._altKeyIsPressed = false, false);

            let previousMouseMove = widget.onMouseMove;
            widget.onMouseMove = (evt: any) => {
                if (this._altKeyIsPressed && evt.buttons === 1) {
                    if (this._oldY < 0) {
                        this._oldY = evt.pageY;
                    }

                    let zoomDelta = (evt.pageY - this._oldY) / 10;
                    if (Math.abs(zoomDelta) > 5) {
                        this._engine.diagramModel.setZoomLevel(this._engine.diagramModel.getZoomLevel() + zoomDelta);
                        this._engine.repaintCanvas();
                        this._oldY = evt.pageY;      
                    }
                    return;
                }
                previousMouseMove(evt);
            }

            let previousMouseUp = widget.onMouseUp;
            widget.onMouseUp = (evt: any) => {
                this._oldY = -1;
                previousMouseUp(evt);
            }

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

        // setup the diagram engine
        this._engine = new DiagramEngine();
        this._engine.installDefaultFactories()

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

        this.props.globalState.onUpdateRequiredObservable.add(() => {          
            this._engine.repaintCanvas();  
        });

        this.props.globalState.onZoomToFitRequiredObservable.add(() => {
            this.zoomToFit();
        });

        this.props.globalState.onReOrganizedRequiredObservable.add(() => {
            this.reOrganize();
        });

        this.props.globalState.onGetNodeFromBlock = (block) => {
             return this._graphCanvas.nodes.filter(n => n.block === block)[0];
        }

        this.props.globalState.hostDocument!.addEventListener("keydown", evt => {
            this._altKeyIsPressed = evt.altKey;

            if (!evt.ctrlKey) {
                return;
            }

            // if (evt.key === "c") {
            //     let selectedItems = this._engine.diagramModel.getSelectedItems();
            //     if (!selectedItems.length) {
            //         return;
            //     }
    
            //     let selectedItem = selectedItems[0] as DefaultNodeModel;
    
            //     if (!selectedItem.block) {
            //         return;
            //     }

            //     this._copiedNodes = selectedItems.map(i => (i as DefaultNodeModel)!);
            // } else if (evt.key === "v") {
            //     if (!this._copiedNodes.length) {
            //         return;
            //     }

            //     const rootElement = this.props.globalState.hostDocument!.querySelector(".diagram-container") as HTMLDivElement;
            //     const zoomLevel = this._engine.diagramModel.getZoomLevel() / 100.0;
            //     let currentX = (this._mouseLocationX - rootElement.offsetLeft - this._engine.diagramModel.getOffsetX() - this.NodeWidth) / zoomLevel;
            //     let currentY = (this._mouseLocationY - rootElement.offsetTop - this._engine.diagramModel.getOffsetY() - 20) / zoomLevel;
            //     let originalNode: Nullable<DefaultNodeModel> = null;

            //     for (var node of this._copiedNodes) {
            //         let block = node.block;

            //         if (!block) {
            //             continue;
            //         }

            //         let clone = block.clone(this.props.globalState.nodeMaterial.getScene());

            //         if (!clone) {
            //             return;
            //         }
                    
            //         let newNode = this.createNodeFromObject({ nodeMaterialBlock: clone });

            //         let x = 0;
            //         let y = 0;
            //         if (originalNode) {
            //             x = currentX + node.x - originalNode.x;
            //             y = currentY + node.y - originalNode.y;
            //         } else {
            //             originalNode = node;
            //             x = currentX;
            //             y = currentY;
            //         }

            //         newNode.x = x;
            //         newNode.y = y;
            //     }

            //     this._engine.repaintCanvas();
            // }

        }, false);
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

    // applyFragmentOutputConstraints(rootInput: DefaultPortModel) {
    //     var model = rootInput.parent as GenericNodeModel;
    //     for (var inputKey in model.getPorts()) {                                       
    //         let input = model.getPorts()[inputKey];

    //         if (rootInput.name === "rgba" && (inputKey === "a" || inputKey === "rgb")
    //             ||
    //             (rootInput.name === "a" || rootInput.name === "rgb") && inputKey === "rgba") {
    //                 for (var key in input.links) {
    //                     let other = input.links[key];
    //                     other.remove();
    //                 }
    //             continue;
    //         }
    //     }
    // }

    build() {        
        let locations: Nullable<INodeLocationInfo[]> = this.props.globalState.nodeMaterial.editorData;
        // setup the diagram model
        this._blocks = [];
        this._graphCanvas.reset();

        // Listen to events
        // this._model.addListener({
        //     nodesUpdated: (e) => {                
        //         if (!e.isCreated) {
        //             // Block is deleted
        //             let targetBlock = (e.node as GenericNodeModel).block;

        //             if (targetBlock) {
        //                 let attachedBlockIndex = this.props.globalState.nodeMaterial!.attachedBlocks.indexOf(targetBlock);
        //                 if (attachedBlockIndex > -1) {
        //                     this.props.globalState.nodeMaterial!.attachedBlocks.splice(attachedBlockIndex, 1);
        //                 }

        //                 if (targetBlock.isFinalMerger) {
        //                     this.props.globalState.nodeMaterial!.removeOutputNode(targetBlock);
        //                 }
        //                 let blockIndex = this._blocks.indexOf(targetBlock);

        //                 if (blockIndex > -1) {
        //                     this._blocks.splice(blockIndex, 1);
        //                 }
        //             }                  

        //             this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
        //         } else {

        //         }
        //     },
        //     linksUpdated: (e) => {
        //         if (!e.isCreated) {
        //             // Link is deleted
        //             this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
        //             let sourcePort = e.link.sourcePort as DefaultPortModel;

        //             var link = DefaultPortModel.SortInputOutput(sourcePort, e.link.targetPort as DefaultPortModel);
        //             if (link) {
        //                 if (link.input.connection && link.output.connection) {
        //                     if (link.input.connection.connectedPoint) {
        //                         // Disconnect standard nodes
        //                         link.output.connection.disconnectFrom(link.input.connection);
        //                         link.input.syncWithNodeMaterialConnectionPoint(link.input.connection);
        //                         link.output.syncWithNodeMaterialConnectionPoint(link.output.connection);
                                
        //                         this.props.globalState.onRebuildRequiredObservable.notifyObservers();
        //                     }
        //                 }
        //             } else {
        //                 if (!e.link.targetPort && e.link.sourcePort && (e.link.sourcePort as DefaultPortModel).position === "input" && !(e.link.sourcePort as DefaultPortModel).connection!.isConnected) {
        //                     // Drag from input port, we are going to build an input for it                            
        //                     let input = e.link.sourcePort as DefaultPortModel;

        //                     if (input.connection!.type == NodeMaterialBlockConnectionPointTypes.AutoDetect) {
        //                         return;
        //                     }

        //                     let nodeModel = this.addValueNode(BlockTools.GetStringFromConnectionNodeType(input.connection!.type));
        //                     let link = nodeModel.ports.output.link(input);

        //                     nodeModel.x = e.link.points[1].x - this.NodeWidth;
        //                     nodeModel.y = e.link.points[1].y;

        //                     setTimeout(() => {
        //                         this._model.addLink(link);
        //                         input.syncWithNodeMaterialConnectionPoint(input.connection!);
        //                         nodeModel.ports.output.syncWithNodeMaterialConnectionPoint(nodeModel.ports.output.connection!);      
                                
        //                         let isFragmentOutput = (input.parent as DefaultNodeModel).block!.getClassName() === "FragmentOutputBlock";

        //                         if (isFragmentOutput) {
        //                             this.applyFragmentOutputConstraints(input);
        //                         }

        //                         this.forceUpdate();
        //                     }, 1);
                           
        //                     nodeModel.ports.output.connection!.connectTo(input.connection!);
        //                     this.props.globalState.onRebuildRequiredObservable.notifyObservers();
        //                 }
        //             }
        //             this.forceUpdate();
        //             return;
        //         } else {
        //             e.link.addListener({
        //                 sourcePortChanged: () => {
        //                 },
        //                 targetPortChanged: (evt) => {
        //                     // Link is created with a target port
        //                     var link = DefaultPortModel.SortInputOutput(e.link.sourcePort as DefaultPortModel, e.link.targetPort as DefaultPortModel);
    
        //                     if (link) {
        //                         if (link.output.connection && link.input.connection) {
        //                             let currentBlock = link.input.connection.ownerBlock;
        //                             let isFragmentOutput = currentBlock.getClassName() === "FragmentOutputBlock";
    
        //                             // Disconnect previous connection
        //                             for (var key in link.input.links) {
        //                                 let other = link.input.links[key];
        //                                 let sourcePortConnection = (other.getSourcePort() as DefaultPortModel).connection;
        //                                 let targetPortConnection = (other.getTargetPort() as DefaultPortModel).connection;
    
        //                                 if (
        //                                     sourcePortConnection !== (link.output as DefaultPortModel).connection && 
        //                                     targetPortConnection !== (link.output as DefaultPortModel).connection
        //                                 ) {
        //                                     other.remove();
        //                                 }
        //                             }
    
        //                             let compatibilityState = link.output.connection.checkCompatibilityState(link.input.connection);
        //                             if (compatibilityState === NodeMaterialConnectionPointCompatibilityStates.Compatible) {
        //                                 if (isFragmentOutput) {
        //                                     this.applyFragmentOutputConstraints(link.input);
        //                                 }
        
        //                                 link.output.connection.connectTo(link.input.connection);
        //                             } else {
        //                                 (evt.entity as AdvancedLinkModel).remove();

        //                                 let message = "";

        //                                 switch (compatibilityState) {
        //                                     case NodeMaterialConnectionPointCompatibilityStates.TypeIncompatible:
        //                                         message = "Cannot connect two different connection types";
        //                                         break;
        //                                     case NodeMaterialConnectionPointCompatibilityStates.TargetIncompatible:
        //                                         message = "Source block can only work in fragment shader whereas destination block is currently aimed for the vertex shader";
        //                                         break;
        //                                 }

        //                                 this.props.globalState.onErrorMessageDialogRequiredObservable.notifyObservers(message);    
        //                             }
    
        //                             this.forceUpdate();
        //                         }
        //                         if (this.props.globalState.nodeMaterial) {
        //                             this.buildMaterial();
        //                         }
        //                     } else {
        //                         e.link.remove();
        //                     }
        //                 }
        //             });
        //         }             
        //     }
        // });

        // Load graph of nodes from the material
        if (this.props.globalState.nodeMaterial) {
            var material = this.props.globalState.nodeMaterial;
            material._vertexOutputNodes.forEach((n: any) => {
                this.createNodeFromObject({ nodeMaterialBlock: n });
            });
            material._fragmentOutputNodes.forEach((n: any) => {
                this.createNodeFromObject({ nodeMaterialBlock: n });
            });

            material.attachedBlocks.forEach((n: any) => {
                this.createNodeFromObject({ nodeMaterialBlock: n });
            });
        }

        this.reOrganize(locations);
    }

    reOrganize(locations: Nullable<INodeLocationInfo[]> = null) {
        if (!locations) {
            this._graphCanvas.distributeGraph();
        } else {
            this._graphCanvas.x = 0;
            this._graphCanvas.y = 0;
            this._graphCanvas.zoom = 1;
            for (var location of locations) {
                for (var node of this._graphCanvas.nodes) {
                    if (node.block && node.block.uniqueId === location.blockId) {
                        node.x = location.x;
                        node.y = location.y;
                        break;
                    }
                }
            }
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

            this._toAdd = [];
            block.autoConfigure(this.props.globalState.nodeMaterial);       
            newNode = this.createNodeFromObject({ nodeMaterialBlock: block });
        };

        let x = (event.clientX - event.currentTarget.offsetLeft - this._graphCanvas.x - this.NodeWidth) / this._graphCanvas.zoom;
        let y = (event.clientY - event.currentTarget.offsetTop - this._graphCanvas.y - 20) / this._graphCanvas.zoom;
        
        newNode.x = x;
        newNode.y = y;

        this.props.globalState.onSelectionChangedObservable.notifyObservers(newNode);

        // if (nodeModel) {
        //     const zoomLevel = this._engine.diagramModel.getZoomLevel() / 100.0;

        //     let x = (event.clientX - event.currentTarget.offsetLeft - this._engine.diagramModel.getOffsetX() - this.NodeWidth) / zoomLevel;
        //     let y = (event.clientY - event.currentTarget.offsetTop - this._engine.diagramModel.getOffsetY() - 20) / zoomLevel;
        //     nodeModel.setPosition(x, y);
        
        //     let block = nodeModel!.block;

        //     x -= this.NodeWidth + 150;

        //     block!._inputs.forEach((connection) => {       
        //         if (connection.connectedPoint) {
        //             var existingNodes = this._nodes.filter((n) => { return n.block === (connection as any)._connectedPoint._ownerBlock });
        //             let connectedNode = existingNodes[0];

        //             if (connectedNode.x === 0 && connectedNode.y === 0) {
        //                 connectedNode.setPosition(x, y);
        //                 y += 80;
        //             }
        //         }
        //     });
            
        //     this._engine.repaintCanvas();

        //     setTimeout(() => {
        //         this._model.addAll(...this._toAdd!);            
        //         this._toAdd = null;  
        //         this._model.clearSelection();
        //         nodeModel!.setSelected(true);

        //         this._engine.repaintCanvas();  
        //     }, 150);
        // }

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
                        // this._mouseLocationX = evt.pageX;
                        // this._mouseLocationY = evt.pageY;
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
                        <DiagramWidget className="diagram" deleteKeys={[46]} ref={"test"} 
                        allowLooseLinks={false}
                        inverseZoom={true} 
                        diagramEngine={this._engine} 
                        maxNumberPointsPerLink={0} />
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