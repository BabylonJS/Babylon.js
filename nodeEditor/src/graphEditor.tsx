import {
    DiagramEngine,
    DiagramModel,
    DiagramWidget,
    MoveCanvasAction,
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
import { DefaultPortModel } from './components/diagram/defaultPortModel';
import { InputNodeFactory } from './components/diagram/input/inputNodeFactory';
import { InputNodeModel } from './components/diagram/input/inputNodeModel';
import { TextureBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/textureBlock';
import { Vector2, Vector3, Vector4, Matrix, Color3, Color4 } from 'babylonjs/Maths/math';
import { LogComponent } from './components/log/logComponent';
import { LightBlock } from 'babylonjs/Materials/Node/Blocks/Dual/lightBlock';
import { LightNodeModel } from './components/diagram/light/lightNodeModel';
import { LightNodeFactory } from './components/diagram/light/lightNodeFactory';

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
    nodeMaterialBlock?: NodeMaterialBlock;
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

        if (options.nodeMaterialBlock) {
            if (options.nodeMaterialBlock instanceof TextureBlock) {
                newNode = new TextureNodeModel();
                filterInputs.push("uv");
            } else if (options.nodeMaterialBlock instanceof LightBlock) {
                newNode = new LightNodeModel();
                filterInputs.push("worldPosition");
                filterInputs.push("worldNormal");
                filterInputs.push("cameraPosition");
            } else {
                newNode = new GenericNodeModel();
            }

            if (options.nodeMaterialBlock.isFinalMerger) {
                this.props.globalState.nodeMaterial!.addOutputNode(options.nodeMaterialBlock);
            }

        } else {
            newNode = new InputNodeModel();
            (newNode as InputNodeModel).connection = options.connection;
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

        this.build();
    }

    buildMaterial() {
        if (!this.props.globalState.nodeMaterial) {
            return;
        }

        try {
            this.props.globalState.nodeMaterial.build(true);
            this.props.globalState.onLogRequiredObservable.notifyObservers("Node material build successful");
        }
        catch (err) {
            this.props.globalState.onLogRequiredObservable.notifyObservers(err);
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
                            } else if (link.input.connection.value) {
                                link.input.connection.value = null;
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
                            } else if (link.input.connection) {
                                if (!link.output.connection) { // Input Node
                                    let name = link.output.name;
                                    link.output.syncWithNodeMaterialConnectionPoint(link.input.connection);
                                    link.output.name = name;
                                    (link.output.getNode() as InputNodeModel).connection = link.output.connection!;
                                    link.input.connection.value = link.output.defaultValue;
                                }
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
        }, 550);
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
        var localNode = this.createNodeFromObject({ column: column, type: type, connection: connection })
        var outPort = new DefaultPortModel(type, "output");

        localNode.addPort(outPort);

        if (!connection) {
            switch (type) {
                case "Vector2":
                    outPort.defaultValue = Vector2.Zero();
                    break;
                case "Vector3":
                    outPort.defaultValue = Vector3.Zero();
                    break;
                case "Vector4":
                    outPort.defaultValue = Vector4.Zero();
                    break;
                case "Matrix":
                    outPort.defaultValue = Matrix.Identity();
                    break;
                case "Color3":
                    outPort.defaultValue = Color3.White();
                    break;
                case "Color4":
                    outPort.defaultValue = new Color4(1, 1, 1, 1);
                    break;
            }
        }

        return localNode;
    }

    render() {
        return (
            <Portal globalState={this.props.globalState}>
                <div id="node-editor-graph-root">
                    {/* Node creation menu */}
                    <NodeListComponent globalState={this.props.globalState} onAddValueNode={b => this.addValueNode(b)} onAddNodeFromClass={b => this.addNodeFromClass(b)} />

                    {/* The node graph diagram */}
                    <DiagramWidget deleteKeys={[46]} ref={"test"} inverseZoom={true} className="diagram-container" diagramEngine={this._engine} maxNumberPointsPerLink={0} />

                    {/* Property tab */}
                    <PropertyTabComponent globalState={this.props.globalState} />

                    <LogComponent globalState={this.props.globalState} />
                </div>
            </Portal>
        );

    }
}