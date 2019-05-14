import { NodeModel, DiagramModel } from "storm-react-diagrams";
import { Nullable } from 'babylonjs/types';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { GenericPortModel } from './generic/genericPortModel';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPointTypes';
import { GraphEditor, NodeCreationOptions } from '../../graphEditor';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
import { GlobalState } from '../../globalState';

/**
 * Generic node model which stores information about a node editor block
 */
export class DefaultNodeModel extends NodeModel {
	/**
	 * The babylon block this node represents
	 */
    public block: Nullable<NodeMaterialBlock> = null;

    public ports: { [s: string]: GenericPortModel };

	/**
	 * Constructs the node model
	 */
    constructor(key: string) {
        super(key);
    }

    prepareConnection(type: string, outPort: GenericPortModel, connection?: NodeMaterialConnectionPoint) {

    }

    prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor) {
        this.block = options.nodeMaterialBlock || null;

        if (!options.nodeMaterialBlock) {
            return;
        }
        // Create output ports
        options.nodeMaterialBlock._outputs.forEach((connection: any) => {
            var outputPort = new GenericPortModel(connection.name, "output");
            outputPort.syncWithNodeMaterialConnectionPoint(connection);
            this.addPort(outputPort)
        })

        // Create input ports and nodes if they exist
        options.nodeMaterialBlock._inputs.forEach((connection) => {
            var inputPort = new GenericPortModel(connection.name, "input");
            inputPort.connection = connection;
            this.addPort(inputPort)

            console.log(connection.name + " for " + options.nodeMaterialBlock!.name)

            if (connection.connectedPoint) {
                // Block is not a leaf node, create node for the given block type
                var connectedNode;
                var existingNodes = nodes.filter((n) => { return n.block === (connection as any)._connectedPoint._ownerBlock });
                if (existingNodes.length == 0) {
                    connectedNode = graphEditor.createNodeFromObject({ column: options.column + 1, nodeMaterialBlock: connection.connectedPoint._ownerBlock });
                } else {
                    connectedNode = existingNodes[0];
                }

                let link = connectedNode.ports[connection.connectedPoint.name].link(inputPort);
                model.addAll(link);

            } else if (connection.isAttribute) {

            } else {
                // Create value node for the connection
                var type = ""
                if (connection.type == NodeMaterialBlockConnectionPointTypes.Texture) {
                    type = "Texture"
                } else if (connection.type == NodeMaterialBlockConnectionPointTypes.Matrix) {
                    type = "Matrix"
                } else if (connection.type & NodeMaterialBlockConnectionPointTypes.Vector3OrColor3) {
                    type = "Vector3"
                } else if (connection.type & NodeMaterialBlockConnectionPointTypes.Vector2) {
                    type = "Vector2"
                } else if (connection.type & NodeMaterialBlockConnectionPointTypes.Vector3OrColor3OrVector4OrColor4) {
                    type = "Vector4"
                }

                // Create links
                var localNode = graphEditor.addValueNode(type, options.column + 1, connection);
                if (localNode) {
                    var ports = localNode.getPorts()
                    for (var key in ports) {
                        let link = (ports[key] as GenericPortModel).link(inputPort);
                        model.addAll(link);
                    }
                }
            }
        });
    }

    renderProperties(globalState: GlobalState): JSX.Element | null {
        return null;
    }
}