import {
    DiagramEngine,
    DiagramModel,
    DiagramWidget,
    MoveCanvasAction,
    LinkModel
} from "storm-react-diagrams";

import * as React from "react";
import * as dagre from "dagre";
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
import { DefaultPortModel } from './components/diagram/defaultPortModel';
import { InputNodeFactory } from './components/diagram/input/inputNodeFactory';
import { InputNodeModel } from './components/diagram/input/inputNodeModel';
import { TextureBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/textureBlock';
import { LogComponent, LogEntry } from './components/log/logComponent';
import { LightBlock } from 'babylonjs/Materials/Node/Blocks/Dual/lightBlock';
import { LightNodeModel } from './components/diagram/light/lightNodeModel';
import { LightNodeFactory } from './components/diagram/light/lightNodeFactory';
import { DataStorage } from './dataStorage';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPointTypes';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';

require("storm-react-diagrams/dist/style.min.css");
require("./main.scss");
require("./components/diagram/diagram.scss");

/*
Graph Editor Overview

Storm React setup:
GenericNodeModel - Represents the nodes in the graph and can be any node type (eg. texture, vector2, etc)
GenericNodeWidget - Renders the node model in the graph 
GenericPortModel - Represents the input/output of a node (contained within each GenericNodeModel)

Generating/modifying the graph:
Generating node graph - the createNodeFromObject method is used to recursively create the graph
Modifications to the graph - The listener in the constructor of GraphEditor listens for port changes and updates the node material based on changes
Saving the graph/generating code - Not yet done
*/

interface IGraphEditorProps {
    globalState: GlobalState;
}

export class NodeCreationOptions {
    column: number;
    nodeMaterialBlock: NodeMaterialBlock;
    type?: string;
    connection?: NodeMaterialConnectionPoint;
}

export class GraphEditor extends React.Component<IGraphEditorProps> {
    private _engine: DiagramEngine;
    private _model: DiagramModel;

    private _nodes = new Array<DefaultNodeModel>();

    /** @hidden */
    public _toAdd: LinkModel[] | null = [];

    /**
     * Current row/column position used when adding new nodes
     */
    private _rowPos = new Array<number>();

    /**
     * Creates a node and recursivly creates its parent nodes from it's input
     * @param nodeMaterialBlock 
     */
    public createNodeFromObject(options: NodeCreationOptions) {
        // Update rows/columns
        if (this._rowPos[options.column] == undefined) {
            this._rowPos[options.column] = 0;
        } else {
            this._rowPos[options.column]++;
        }

        // Create new node in the graph
        var newNode: DefaultNodeModel;
        var filterInputs = [];

        if (options.nodeMaterialBlock instanceof TextureBlock) {
            newNode = new TextureNodeModel();
            filterInputs.push("uv");
        } else if (options.nodeMaterialBlock instanceof LightBlock) {
            newNode = new LightNodeModel();
            filterInputs.push("worldPosition");
            filterInputs.push("worldNormal");
            filterInputs.push("cameraPosition");
        } else if (options.nodeMaterialBlock instanceof InputBlock) {
            newNode = new InputNodeModel();
        } else {
            newNode = new GenericNodeModel();
        }

        if (options.nodeMaterialBlock.isFinalMerger) {
            this.props.globalState.nodeMaterial!.addOutputNode(options.nodeMaterialBlock);
        }

        this._nodes.push(newNode)
        newNode.setPosition(1600 - (300 * options.column), 210 * this._rowPos[options.column])
        this._model.addAll(newNode);

        if (options.nodeMaterialBlock) {
            newNode.prepare(options, this._nodes, this._model, this, filterInputs);
        }

        return newNode;
    }

    componentDidMount() {
        if (this.props.globalState.hostDocument) {
            var widget = (this.refs["test"] as DiagramWidget);
            widget.setState({ document: this.props.globalState.hostDocument })
            this.props.globalState.hostDocument!.addEventListener("keyup", widget.onKeyUpPointer as any, false);
        }
    }

    componentWillUnmount() {
        if (this.props.globalState.hostDocument) {
            var widget = (this.refs["test"] as DiagramWidget);
            this.props.globalState.hostDocument!.removeEventListener("keyup", widget.onKeyUpPointer as any, false);
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

        this.props.globalState.onRebuildRequiredObservable.add(() => {
            if (this.props.globalState.nodeMaterial) {
                this.buildMaterial();
            }
            this.forceUpdate();
        });

        this.props.globalState.onResetRequiredObservable.add(() => {
            this._rowPos = [];
            this.build();
            if (this.props.globalState.nodeMaterial) {
                this.buildMaterial();
            }
        });

        this.props.globalState.onUpdateRequiredObservable.add(() => {
            this.forceUpdate();
        });

        this.props.globalState.onZoomToFitRequiredObservable.add(() => {
            this._engine.zoomToFit();
        });

        this.props.globalState.onReOrganizedRequiredObservable.add(() => {
            this.reOrganize();
        })

        this.build();
    }

    distributeGraph() {
        let nodes = this.mapElements();
        let edges = this.mapEdges();
        let graph = new dagre.graphlib.Graph();
        graph.setGraph({});
        graph.setDefaultEdgeLabel(() => ({}));
        graph.graph().rankdir = "LR";
        //add elements to dagre graph
        nodes.forEach(node => {
            graph.setNode(node.id, node.metadata);
        });
        edges.forEach(edge => {
            if (edge.from && edge.to) {
                graph.setEdge(edge.from.id, edge.to.id);
            }
        });
        //auto-distribute
        dagre.layout(graph);
        return graph.nodes().map(node => graph.node(node));
    }

    mapElements() {
        let output = [];

        // dagre compatible format
        for (var nodeName in this._model.nodes) {
            let node = this._model.nodes[nodeName];
            let size = {
                width: node.width,
                height: node.height
            };
            output.push({ id: node.id, metadata: { ...size, id: node.id } });
        }

        return output;
    }

    mapEdges() {
        // returns links which connects nodes
        // we check are there both from and to nodes in the model. Sometimes links can be detached
        let output = [];

        for (var linkName in this._model.links) {
            let link = this._model.links[linkName];

            output.push({
                from: link.sourcePort!.parent,
                to: link.targetPort!.parent
            });
        }

        return output;
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

    build() {
        // setup the diagram model
        this._model = new DiagramModel();

        // Listen to events
        this._model.addListener({
            nodesUpdated: (e) => {
                if (!e.isCreated) {
                    // Block is deleted
                    let targetBlock = (e.node as GenericNodeModel).block;

                    if (targetBlock && targetBlock.isFinalMerger) {
                        this.props.globalState.nodeMaterial!.removeOutputNode(targetBlock);
                    }
                }
            },
            linksUpdated: (e) => {
                if (!e.isCreated) {
                    // Link is deleted
                    this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
                    var link = DefaultPortModel.SortInputOutput(e.link.sourcePort as DefaultPortModel, e.link.targetPort as DefaultPortModel);
                    if (link) {
                        if (link.input.connection) {
                            if (link.output.connection) {
                                // Disconnect standard nodes
                                link.output.connection.disconnectFrom(link.input.connection)
                                link.input.syncWithNodeMaterialConnectionPoint(link.input.connection)
                                link.output.syncWithNodeMaterialConnectionPoint(link.output.connection)
                            }
                        }
                    }
                }

                e.link.addListener({
                    sourcePortChanged: () => {
                        console.log("port change")
                    },
                    targetPortChanged: () => {
                        // Link is created with a target port
                        var link = DefaultPortModel.SortInputOutput(e.link.sourcePort as DefaultPortModel, e.link.targetPort as DefaultPortModel);

                        if (link) {
                            if (link.output.connection && link.input.connection) {
                                link.output.connection.connectTo(link.input.connection)
                            }
                            if (this.props.globalState.nodeMaterial) {
                                this.buildMaterial();
                            }
                        }
                    }
                })
            }
        });

        // Load graph of nodes from the material
        if (this.props.globalState.nodeMaterial) {
            var material: any = this.props.globalState.nodeMaterial;
            material._vertexOutputNodes.forEach((n: any) => {
                this.createNodeFromObject({ column: 0, nodeMaterialBlock: n });
            })
            material._fragmentOutputNodes.forEach((n: any) => {
                this.createNodeFromObject({ column: 0, nodeMaterialBlock: n });
            })
        }

        // load model into engine
        setTimeout(() => {
            if (this._toAdd) {
                this._model.addAll(...this._toAdd);
            }
            this._toAdd = null;
            this._engine.setDiagramModel(this._model);

            this.forceUpdate();

            this.reOrganize();
        }, 550);
    }

    reOrganize() {
        let nodes = this.distributeGraph();
        nodes.forEach(node => {
            for (var nodeName in this._model.nodes) {
                let modelNode = this._model.nodes[nodeName];

                if (modelNode.id === node.id) {
                    modelNode.setPosition(node.x - node.width / 2, node.y - node.height / 2);
                    return;
                }
            }
        });
        this.forceUpdate();
    }

    addNodeFromClass(ObjectClass: typeof NodeMaterialBlock) {
        var block = new ObjectClass(ObjectClass.prototype.getClassName())
        var localNode = this.createNodeFromObject({ column: 0, nodeMaterialBlock: block })
        var widget = (this.refs["test"] as DiagramWidget);

        this.forceUpdate();

        // This is needed to fix link offsets when created, (eg. create a fog block)
        // Todo figure out how to correct this without this
        setTimeout(() => {
            widget.startFiringAction(new MoveCanvasAction(1, 0, this._model));
        }, 500);

        return localNode;
    }

    addValueNode(type: string, column = 0, connection?: NodeMaterialConnectionPoint) {
        let nodeType: NodeMaterialBlockConnectionPointTypes = NodeMaterialBlockConnectionPointTypes.Vector3;
        switch (type) {
            case "Float":
                nodeType = NodeMaterialBlockConnectionPointTypes.Float;
                break;
            case "Vector2":
                nodeType = NodeMaterialBlockConnectionPointTypes.Vector2;
                break;
            case "Vector3":
                nodeType = NodeMaterialBlockConnectionPointTypes.Vector3;
                break;
            case "Vector4":
                nodeType = NodeMaterialBlockConnectionPointTypes.Vector4;
                break;
            case "Matrix":
                nodeType = NodeMaterialBlockConnectionPointTypes.Matrix;
                break;
            case "Color3":
                nodeType = NodeMaterialBlockConnectionPointTypes.Color3;
                break;
            case "Color4":
                nodeType = NodeMaterialBlockConnectionPointTypes.Color4;
                break;
        }

        let newInputBlock = new InputBlock(type, undefined, nodeType);
        newInputBlock.setDefaultValue();
        var localNode = this.createNodeFromObject({ column: column, type: type, connection: connection, nodeMaterialBlock: newInputBlock })

        return localNode;
    }

    private _startX: number;
    private _moveInProgress: boolean;

    private _leftWidth = DataStorage.ReadNumber("LeftWidth", 200);
    private _rightWidth = DataStorage.ReadNumber("RightWidth", 300);

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
        }

        rootElement.style.gridTemplateColumns = this.buildColumnLayout();

        this._startX = evt.clientX;
    }

    buildColumnLayout() {
        return `${this._leftWidth}px 4px calc(100% - ${this._leftWidth + 8 + this._rightWidth}px) 4px ${this._rightWidth}px`;
    }

    render() {
        return (
            <Portal globalState={this.props.globalState}>
                <div id="node-editor-graph-root" style={
                    {
                        gridTemplateColumns: this.buildColumnLayout()
                    }
                }>
                    {/* Node creation menu */}
                    <NodeListComponent globalState={this.props.globalState} onAddValueNode={b => this.addValueNode(b)} onAddNodeFromClass={b => this.addNodeFromClass(b)} />

                    <div id="leftGrab"
                        onPointerDown={evt => this.onPointerDown(evt)}
                        onPointerUp={evt => this.onPointerUp(evt)}
                        onPointerMove={evt => this.resizeColumns(evt)}
                    ></div>

                    {/* The node graph diagram */}
                    <DiagramWidget deleteKeys={[46]} ref={"test"} inverseZoom={true} className="diagram-container" diagramEngine={this._engine} maxNumberPointsPerLink={0} />

                    <div id="rightGrab"
                        onPointerDown={evt => this.onPointerDown(evt)}
                        onPointerUp={evt => this.onPointerUp(evt)}
                        onPointerMove={evt => this.resizeColumns(evt, false)}
                    ></div>

                    {/* Property tab */}
                    <PropertyTabComponent globalState={this.props.globalState} />

                    <LogComponent globalState={this.props.globalState} />
                </div>
            </Portal>
        );

    }
}