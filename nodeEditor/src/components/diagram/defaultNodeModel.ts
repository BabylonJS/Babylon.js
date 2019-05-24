import { NodeModel, DiagramModel } from "storm-react-diagrams";
import { Nullable } from 'babylonjs/types';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPointTypes';
import { GraphEditor, NodeCreationOptions } from '../../graphEditor';
import { GlobalState } from '../../globalState';
import { DefaultPortModel } from './defaultPortModel';

/**
 * Generic node model which stores information about a node editor block
 */
export class DefaultNodeModel extends NodeModel {
	/**
	 * The babylon block this node represents
	 */
    public block: Nullable<NodeMaterialBlock> = null;

    public ports: { [s: string]: DefaultPortModel };

	/**
	 * Constructs the node model
	 */
    constructor(key: string) {
        super(key);
    }

    prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor, filterInputs: string[]) {
        this.block = options.nodeMaterialBlock || null;

        if (!options.nodeMaterialBlock) {
            return;
        }
        // Create output ports
        options.nodeMaterialBlock._outputs.forEach((connection: any) => {
            var outputPort = new DefaultPortModel(connection.name, "output");
            outputPort.syncWithNodeMaterialConnectionPoint(connection);
            this.addPort(outputPort)
        })

        // Create input ports and nodes if they exist
        options.nodeMaterialBlock._inputs.forEach((connection) => {
            if (filterInputs.length > 0 && filterInputs.indexOf(connection.name) === -1) {
                return;
            }

            var inputPort = new DefaultPortModel(connection.name, "input");
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
                        let link = (ports[key] as DefaultPortModel).link(inputPort);
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