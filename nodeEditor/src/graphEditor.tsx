import {
    DiagramEngine,
    DiagramModel,
    DiagramWidget,
    LinkModel
} from "storm-react-diagrams";

import * as React from "react";
import { GlobalState } from './globalState';

import { GenericNodeFactory } from './components/diagram/generic/genericNodeFactory';
import { GenericNodeModel } from './components/diagram/generic/genericNodeModel';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
import { NodeListComponent } from './components/nodeList/nodeListComponent';
import { PropertyTabComponent } from './components/propertyTab/propertyTabComponent';
import { Portal } from './portal';
import { TextureNodeFactory } from './components/diagram/texture/textureNodeFactory';
import { DefaultNodeModel } from './components/diagram/defaultNodeModel';
import { TextureNodeModel } from './components/diagram/texture/textureNodeModel';
import { DefaultPortModel } from './components/diagram/port/defaultPortModel';
import { InputNodeFactory } from './components/diagram/input/inputNodeFactory';
import { InputNodeModel } from './components/diagram/input/inputNodeModel';
import { TextureBlock } from 'babylonjs/Materials/Node/Blocks/Dual/textureBlock';
import { LogComponent, LogEntry } from './components/log/logComponent';
import { LightBlock } from 'babylonjs/Materials/Node/Blocks/Dual/lightBlock';
import { LightNodeModel } from './components/diagram/light/lightNodeModel';
import { LightNodeFactory } from './components/diagram/light/lightNodeFactory';
import { DataStorage } from './dataStorage';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
import { Nullable } from 'babylonjs/types';
import { MessageDialogComponent } from './sharedComponents/messageDialog';
import { BlockTools } from './blockTools';
import { AdvancedLinkFactory } from './components/diagram/link/advancedLinkFactory';
import { RemapNodeFactory } from './components/diagram/remap/remapNodeFactory';
import { RemapNodeModel } from './components/diagram/remap/remapNodeModel';
import { RemapBlock } from 'babylonjs/Materials/Node/Blocks/remapBlock';
import { GraphHelper } from './graphHelper';
import { PreviewManager } from './components/preview/previewManager';
import { INodeLocationInfo } from './nodeLocationInfo';
import { PreviewMeshControlComponent } from './components/preview/previewMeshControlComponent';
import { TrigonometryNodeFactory } from './components/diagram/trigonometry/trigonometryNodeFactory';
import { TrigonometryBlock } from 'babylonjs/Materials/Node/Blocks/trigonometryBlock';
import { TrigonometryNodeModel } from './components/diagram/trigonometry/trigonometryNodeModel';
import { AdvancedLinkModel } from './components/diagram/link/advancedLinkModel';
import { ClampNodeFactory } from './components/diagram/clamp/clampNodeFactory';
import { ClampNodeModel } from './components/diagram/clamp/clampNodeModel';
import { ClampBlock } from 'babylonjs/Materials/Node/Blocks/clampBlock';
import { LightInformationNodeFactory } from './components/diagram/lightInformation/lightInformationNodeFactory';
import { LightInformationNodeModel } from './components/diagram/lightInformation/lightInformationNodeModel';
import { LightInformationBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/lightInformationBlock';
import { PreviewAreaComponent } from './components/preview/previewAreaComponent';
import { GradientBlock } from 'babylonjs/Materials/Node/Blocks/gradientBlock';
import { GradientNodeModel } from './components/diagram/gradient/gradientNodeModel';
import { GradientNodeFactory } from './components/diagram/gradient/gradientNodeFactory';
import { ReflectionTextureBlock } from 'babylonjs/Materials/Node/Blocks/Dual/reflectionTextureBlock';
import { ReflectionTextureNodeFactory } from './components/diagram/reflectionTexture/reflectionTextureNodeFactory';
import { ReflectionTextureNodeModel } from './components/diagram/reflectionTexture/reflectionTextureNodeModel';

require("storm-react-diagrams/dist/style.min.css");
require("./main.scss");
require("./components/diagram/diagram.scss");

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
    private _engine: DiagramEngine;
    private _model: DiagramModel;

    private _startX: number;
    private _moveInProgress: boolean;

    private _leftWidth = DataStorage.ReadNumber("LeftWidth", 200);
    private _rightWidth = DataStorage.ReadNumber("RightWidth", 300);

    private _nodes = new Array<DefaultNodeModel>();
    private _blocks = new Array<NodeMaterialBlock>();

    private _previewManager: PreviewManager;
    private _copiedNodes: DefaultNodeModel[] = [];
    private _mouseLocationX = 0;
    private _mouseLocationY = 0;
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
            return this._nodes.filter(n => n.block === options.nodeMaterialBlock)[0];
        }

        this._blocks.push(options.nodeMaterialBlock);

        if (this.props.globalState.nodeMaterial!.attachedBlocks.indexOf(options.nodeMaterialBlock) === -1) {
            this.props.globalState.nodeMaterial!.attachedBlocks.push(options.nodeMaterialBlock);
        }

        // Create new node in the graph
        var newNode: DefaultNodeModel;
       
        if (options.nodeMaterialBlock instanceof TextureBlock) {
            newNode = new TextureNodeModel();
        } else if (options.nodeMaterialBlock instanceof ReflectionTextureBlock) {
            newNode = new ReflectionTextureNodeModel();            
        } else if (options.nodeMaterialBlock instanceof LightBlock) {
            newNode = new LightNodeModel();
        } else if (options.nodeMaterialBlock instanceof InputBlock) {
            newNode = new InputNodeModel();     
        } else if (options.nodeMaterialBlock instanceof TrigonometryBlock) {
            newNode = new TrigonometryNodeModel();                    
        } else if (options.nodeMaterialBlock instanceof RemapBlock) {
            newNode = new RemapNodeModel();
        } else if (options.nodeMaterialBlock instanceof ClampBlock) {
            newNode = new ClampNodeModel();        
        } else if (options.nodeMaterialBlock instanceof LightInformationBlock) {
            newNode = new LightInformationNodeModel();
        } else if (options.nodeMaterialBlock instanceof GradientBlock) {
            newNode = new GradientNodeModel();
        } else {
            newNode = new GenericNodeModel();
        }

        if (options.nodeMaterialBlock.isFinalMerger) {
            this.props.globalState.nodeMaterial!.addOutputNode(options.nodeMaterialBlock);
        }

        this._nodes.push(newNode);
        this._model.addAll(newNode);

        if (options.nodeMaterialBlock) {
            newNode.prepare(options, this._nodes, this._model, this);
        }

        return newNode;
    }
    
    addValueNode(type: string) {
        let nodeType: NodeMaterialBlockConnectionPointTypes = BlockTools.GetConnectionNodeTypeFromString(type);

        let newInputBlock = new InputBlock(type, undefined, nodeType);
        var localNode = this.createNodeFromObject({ type: type, nodeMaterialBlock: newInputBlock })

        return localNode;
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
            var widget = (this.refs["test"] as DiagramWidget);
            widget.setState({ document: this.props.globalState.hostDocument })
            this._onWidgetKeyUpPointer = this.onWidgetKeyUp.bind(this)
            this.props.globalState.hostDocument!.addEventListener("keyup", this._onWidgetKeyUpPointer, false);

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
        this._engine.registerNodeFactory(new GenericNodeFactory(this.props.globalState));
        this._engine.registerNodeFactory(new TextureNodeFactory(this.props.globalState));
        this._engine.registerNodeFactory(new LightNodeFactory(this.props.globalState));
        this._engine.registerNodeFactory(new InputNodeFactory(this.props.globalState));
        this._engine.registerNodeFactory(new RemapNodeFactory(this.props.globalState));
        this._engine.registerNodeFactory(new TrigonometryNodeFactory(this.props.globalState));
        this._engine.registerNodeFactory(new ClampNodeFactory(this.props.globalState));
        this._engine.registerNodeFactory(new LightInformationNodeFactory(this.props.globalState));
        this._engine.registerNodeFactory(new GradientNodeFactory(this.props.globalState));
        this._engine.registerNodeFactory(new ReflectionTextureNodeFactory(this.props.globalState));
        this._engine.registerLinkFactory(new AdvancedLinkFactory());

        this.props.globalState.onRebuildRequiredObservable.add(() => {
            if (this.props.globalState.nodeMaterial) {
                this.buildMaterial();
            }
        });

        this.props.globalState.onResetRequiredObservable.add((locations) => {
            this.build(false, locations);
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
            return this._nodes.filter(n => n.block === block)[0];
        }

        this.props.globalState.hostDocument!.addEventListener("keydown", evt => {
            this._altKeyIsPressed = evt.altKey;

            if (!evt.ctrlKey) {
                return;
            }

            if (evt.key === "c") {
                let selectedItems = this._engine.diagramModel.getSelectedItems();
                if (!selectedItems.length) {
                    return;
                }
    
                let selectedItem = selectedItems[0] as DefaultNodeModel;
    
                if (!selectedItem.block) {
                    return;
                }

                this._copiedNodes = selectedItems.map(i => (i as DefaultNodeModel)!);
            } else if (evt.key === "v") {
                if (!this._copiedNodes.length) {
                    return;
                }

                const rootElement = this.props.globalState.hostDocument!.querySelector(".diagram-container") as HTMLDivElement;
                const zoomLevel = this._engine.diagramModel.getZoomLevel() / 100.0;
                let currentX = (this._mouseLocationX - rootElement.offsetLeft - this._engine.diagramModel.getOffsetX() - this.NodeWidth) / zoomLevel;
                let currentY = (this._mouseLocationY - rootElement.offsetTop - this._engine.diagramModel.getOffsetY() - 20) / zoomLevel;
                let originalNode: Nullable<DefaultNodeModel> = null;

                for (var node of this._copiedNodes) {
                    let block = node.block;

                    if (!block) {
                        continue;
                    }

                    let clone = block.clone(this.props.globalState.nodeMaterial.getScene());

                    if (!clone) {
                        return;
                    }
                    
                    let newNode = this.createNodeFromObject({ nodeMaterialBlock: clone });

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

                    newNode.setPosition(x, y);
                }

                this._engine.repaintCanvas();
            }

        }, false);

        this.build(true);
    }

    zoomToFit(retry = 0) {
        const xFactor = this._engine.canvas.clientWidth / this._engine.canvas.scrollWidth;
        const yFactor = this._engine.canvas.clientHeight / this._engine.canvas.scrollHeight;
        const zoomFactor = xFactor < yFactor ? xFactor : yFactor;

        if (zoomFactor === 1) {
            return;
        }

        this._engine.diagramModel.setZoomLevel(this._engine.diagramModel.getZoomLevel() * zoomFactor);
        this._engine.diagramModel.setOffset(0, 0);
        this._engine.repaintCanvas();
        retry++;
        if (retry < 4) {
            setTimeout(() => this.zoomToFit(retry), 1);
        }
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
    }

    applyFragmentOutputConstraints(rootInput: DefaultPortModel) {
        var model = rootInput.parent as GenericNodeModel;
        for (var inputKey in model.getPorts()) {                                       
            let input = model.getPorts()[inputKey];

            if (rootInput.name === "rgba" && (inputKey === "a" || inputKey === "rgb")
                ||
                (rootInput.name === "a" || rootInput.name === "rgb") && inputKey === "rgba") {
                    for (var key in input.links) {
                        let other = input.links[key];
                        other.remove();
                    }
                continue;
            }
        }
    }

    build(needToWait = false, locations: Nullable<INodeLocationInfo[]> = null) {
        // setup the diagram model
        this._model = new DiagramModel();
        this._nodes = [];
        this._blocks = [];

        // Listen to events
        this._model.addListener({
            nodesUpdated: (e) => {                
                if (!e.isCreated) {
                    // Block is deleted
                    let targetBlock = (e.node as GenericNodeModel).block;

                    if (targetBlock) {
                        let attachedBlockIndex = this.props.globalState.nodeMaterial!.attachedBlocks.indexOf(targetBlock);
                        if (attachedBlockIndex > -1) {
                            this.props.globalState.nodeMaterial!.attachedBlocks.splice(attachedBlockIndex, 1);
                        }

                        if (targetBlock.isFinalMerger) {
                            this.props.globalState.nodeMaterial!.removeOutputNode(targetBlock);
                        }
                        let blockIndex = this._blocks.indexOf(targetBlock);

                        if (blockIndex > -1) {
                            this._blocks.splice(blockIndex, 1);
                        }
                    }                  

                    this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
                } else {

                }
            },
            linksUpdated: (e) => {
                if (!e.isCreated) {
                    // Link is deleted
                    this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
                    let sourcePort = e.link.sourcePort as DefaultPortModel;

                    var link = DefaultPortModel.SortInputOutput(sourcePort, e.link.targetPort as DefaultPortModel);
                    if (link) {
                        if (link.input.connection && link.output.connection) {
                            if (link.input.connection.connectedPoint) {
                                // Disconnect standard nodes
                                link.output.connection.disconnectFrom(link.input.connection);
                                link.input.syncWithNodeMaterialConnectionPoint(link.input.connection);
                                link.output.syncWithNodeMaterialConnectionPoint(link.output.connection);
                                
                                this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                            }
                        }
                    } else {
                        if (!e.link.targetPort && e.link.sourcePort && (e.link.sourcePort as DefaultPortModel).position === "input" && !(e.link.sourcePort as DefaultPortModel).connection!.isConnected) {
                            // Drag from input port, we are going to build an input for it                            
                            let input = e.link.sourcePort as DefaultPortModel;

                            if (input.connection!.type == NodeMaterialBlockConnectionPointTypes.AutoDetect) {
                                return;
                            }

                            let nodeModel = this.addValueNode(BlockTools.GetStringFromConnectionNodeType(input.connection!.type));
                            let link = nodeModel.ports.output.link(input);

                            nodeModel.x = e.link.points[1].x - this.NodeWidth;
                            nodeModel.y = e.link.points[1].y;

                            setTimeout(() => {
                                this._model.addLink(link);
                                input.syncWithNodeMaterialConnectionPoint(input.connection!);
                                nodeModel.ports.output.syncWithNodeMaterialConnectionPoint(nodeModel.ports.output.connection!);      
                                
                                let isFragmentOutput = (input.parent as DefaultNodeModel).block!.getClassName() === "FragmentOutputBlock";

                                if (isFragmentOutput) {
                                    this.applyFragmentOutputConstraints(input);
                                }

                                this.forceUpdate();
                            }, 1);
                           
                            nodeModel.ports.output.connection!.connectTo(input.connection!);
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                        }
                    }
                    this.forceUpdate();
                    return;
                } else {
                    e.link.addListener({
                        sourcePortChanged: () => {
                        },
                        targetPortChanged: (evt) => {
                            // Link is created with a target port
                            var link = DefaultPortModel.SortInputOutput(e.link.sourcePort as DefaultPortModel, e.link.targetPort as DefaultPortModel);
    
                            if (link) {
                                if (link.output.connection && link.input.connection) {
                                    let currentBlock = link.input.connection.ownerBlock;
                                    let isFragmentOutput = currentBlock.getClassName() === "FragmentOutputBlock";
    
                                    // Disconnect previous connection
                                    for (var key in link.input.links) {
                                        let other = link.input.links[key];
                                        let sourcePortConnection = (other.getSourcePort() as DefaultPortModel).connection;
                                        let targetPortConnection = (other.getTargetPort() as DefaultPortModel).connection;
    
                                        if (
                                            sourcePortConnection !== (link.output as DefaultPortModel).connection && 
                                            targetPortConnection !== (link.output as DefaultPortModel).connection
                                        ) {
                                            other.remove();
                                        }
                                    }
    
                                    if (link.output.connection.canConnectTo(link.input.connection)) {
                                        if (isFragmentOutput) {
                                            this.applyFragmentOutputConstraints(link.input);
                                        }
        
                                        link.output.connection.connectTo(link.input.connection);
                                    } else {
                                        (evt.entity as AdvancedLinkModel).remove();
                                        this.props.globalState.onErrorMessageDialogRequiredObservable.notifyObservers("Cannot connect two different connection types");    
                                    }
    
                                    this.forceUpdate();
                                }
                                if (this.props.globalState.nodeMaterial) {
                                    this.buildMaterial();
                                }
                            }
                        }
                    });
                }             
            }
        });

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

        // load model into engine
        setTimeout(() => {
            if (this._toAdd) {
                this._model.addAll(...this._toAdd);
            }
            this._toAdd = null;
            this._engine.setDiagramModel(this._model);

            this.forceUpdate();

            this.reOrganize(locations);
        }, needToWait ? 500 : 1);
    }

    reOrganize(locations: Nullable<INodeLocationInfo[]> = null) {
        if (!locations) {
            let nodes = GraphHelper.DistributeGraph(this._model);
            nodes.forEach(node => {
                for (var nodeName in this._model.nodes) {
                    let modelNode = this._model.nodes[nodeName];

                    if (modelNode.id === node.id) {
                        modelNode.setPosition(node.x - node.width / 2, node.y - node.height / 2);
                        return;
                    }
                }
            });
        } else {
            for (var location of locations) {
                for (var node of this._nodes) {
                    if (node.block && node.block.uniqueId === location.blockId) {
                        node.setPosition(location.x, location.y);
                        break;
                    }
                }
            }
        }

        this._engine.repaintCanvas();
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
        let nodeModel: Nullable<DefaultNodeModel> = null;

        if (data.indexOf("Block") === -1) {
            nodeModel = this.addValueNode(data);
        } else {
            let block = BlockTools.GetBlockFromString(data, this.props.globalState.nodeMaterial.getScene(), this.props.globalState.nodeMaterial);   
            
            if (block) {                
                this._toAdd = [];
                block.autoConfigure(this.props.globalState.nodeMaterial);       
                nodeModel = this.createNodeFromObject({ nodeMaterialBlock: block });
            }
        };

        if (nodeModel) {
            const zoomLevel = this._engine.diagramModel.getZoomLevel() / 100.0;

            let x = (event.clientX - event.currentTarget.offsetLeft - this._engine.diagramModel.getOffsetX() - this.NodeWidth) / zoomLevel;
            let y = (event.clientY - event.currentTarget.offsetTop - this._engine.diagramModel.getOffsetY() - 20) / zoomLevel;
            nodeModel.setPosition(x, y);
        
            let block = nodeModel!.block;

            x -= this.NodeWidth + 150;

            block!._inputs.forEach((connection) => {       
                if (connection.connectedPoint) {
                    var existingNodes = this._nodes.filter((n) => { return n.block === (connection as any)._connectedPoint._ownerBlock });
                    let connectedNode = existingNodes[0];

                    if (connectedNode.x === 0 && connectedNode.y === 0) {
                        connectedNode.setPosition(x, y);
                        y += 80;
                    }
                }
            });
            
            this._engine.repaintCanvas();

            setTimeout(() => {
                this._model.addAll(...this._toAdd!);            
                this._toAdd = null;  
                this._model.clearSelection();
                nodeModel!.setSelected(true);

                this._engine.repaintCanvas();  
            }, 150);
        }

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
                        <DiagramWidget className="diagram" deleteKeys={[46]} ref={"test"} 
                        allowLooseLinks={false}
                        inverseZoom={true} 
                        diagramEngine={this._engine} 
                        maxNumberPointsPerLink={0} />
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