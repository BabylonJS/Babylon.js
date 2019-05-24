import {
    DiagramEngine,
    DiagramModel,
    DiagramWidget,
    MoveCanvasAction
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

    /**
     * Current row/column position used when adding new nodes
     */
    private _rowPos = new Array<number>()

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
        var outputNode: DefaultNodeModel;
        var filterInputs = [];

        if (options.nodeMaterialBlock) {
            if (options.nodeMaterialBlock instanceof TextureBlock) {
                outputNode = new TextureNodeModel();
                filterInputs.push("uv");
            } else {
                outputNode = new GenericNodeModel();
            }
        } else {
            outputNode = new InputNodeModel();
            (outputNode as InputNodeModel).connection = options.connection;
        }
        this._nodes.push(outputNode)
        outputNode.setPosition(1600 - (300 * options.column), 210 * this._rowPos[options.column])
        this._model.addAll(outputNode);

        if (options.nodeMaterialBlock) {
            outputNode.prepare(options, this._nodes, this._model, this, filterInputs);
        }

        return outputNode;
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
        this._engine.registerNodeFactory(new InputNodeFactory(this.props.globalState));

        // setup the diagram model
        this._model = new DiagramModel();

        // Listen to events to connect/disconnect blocks or
        this._model.addListener({
            linksUpdated: (e) => {
                if (!e.isCreated) {
                    // Link is deleted
                    console.log("link deleted");
                    var link = DefaultPortModel.SortInputOutput(e.link.sourcePort as DefaultPortModel, e.link.targetPort as DefaultPortModel);
                    console.log(link)
                    if (link) {
                        if (link.output.connection && link.input.connection) {
                            // Disconnect standard nodes
                            console.log("disconnected " + link.output.connection.name + " from " + link.input.connection.name)
                            link.output.connection.disconnectFrom(link.input.connection)
                            link.input.syncWithNodeMaterialConnectionPoint(link.input.connection)
                            link.output.syncWithNodeMaterialConnectionPoint(link.output.connection)
                        } else if (link.input.connection && link.input.connection.value) {
                            console.log("value link removed");
                            link.input.connection.value = null;
                        } else {
                            console.log("invalid link error");
                        }
                    }
                } else {
                    console.log("link created")
                    console.log(e.link.sourcePort)
                }
                e.link.addListener({
                    sourcePortChanged: () => {
                        console.log("port change")
                    },
                    targetPortChanged: () => {
                        // Link is created with a target port
                        console.log("Link set to target")
                        var link = DefaultPortModel.SortInputOutput(e.link.sourcePort as DefaultPortModel, e.link.targetPort as DefaultPortModel);

                        if (link) {
                            if (link.output.connection && link.input.connection) {
                                console.log("link standard blocks")
                                link.output.connection.connectTo(link.input.connection)
                            } else if (link.input.connection) {
                                console.log("link value to standard block")
                                link.input.connection.value = link.output.getValue();

                            }
                            if (this.props.globalState.nodeMaterial) {
                                this.props.globalState.nodeMaterial.build()
                            }
                        }
                    }

                })

            },
            nodesUpdated: (e) => {
                if (e.isCreated) {
                    console.log("new node")
                } else {
                    console.log("node deleted")
                }
            }
        });

        this.props.globalState.onRebuildRequiredObservable.add(() => {
            if (this.props.globalState.nodeMaterial) {
                this.props.globalState.nodeMaterial.build();
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

        // Zoom out a bit at the start
        this._model.setZoomLevel(80)

        // load model into engine
        this._engine.setDiagramModel(this._model);
    }

    addNodeFromClass(ObjectClass: typeof NodeMaterialBlock) {
        var block = new ObjectClass(ObjectClass.prototype.getClassName() + "sdfsdf")
        var localNode = this.createNodeFromObject({ column: 0, nodeMaterialBlock: block })
        var widget = (this.refs["test"] as DiagramWidget);

        this.forceUpdate()

        // This is needed to fix link offsets when created, (eg. create a fog block)
        // Todo figure out how to correct this without this
        setTimeout(() => {
            widget.startFiringAction(new MoveCanvasAction(1, 0, this._model));
        }, 500);

        return localNode
    }

    addValueNode(type: string, column = 0, connection?: NodeMaterialConnectionPoint) {
        var localNode = this.createNodeFromObject({ column: column, type: type, connection: connection })
        var outPort = new DefaultPortModel(type, "output");

        localNode.addPort(outPort);

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
                </div>
            </Portal>
        );

    }
}