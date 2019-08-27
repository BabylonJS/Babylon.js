import { NodeModel, DiagramModel } from "storm-react-diagrams";
import { Nullable } from 'babylonjs/types';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { GraphEditor, NodeCreationOptions } from '../../graphEditor';
import { GlobalState } from '../../globalState';
import { DefaultPortModel } from './port/defaultPortModel';

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

    prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor) {
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

            var inputPort = new DefaultPortModel(connection.name, "input");
            inputPort.connection = connection;
            this.addPort(inputPort)

            if (connection.connectedPoint) {
                // Block is not a leaf node, create node for the given block type
                var connectedNode;
                var existingNodes = nodes.filter((n) => { return n.block === (connection as any)._connectedPoint._ownerBlock });
                if (existingNodes.length == 0) {
                    connectedNode = graphEditor.createNodeFromObject({ nodeMaterialBlock: connection.connectedPoint._ownerBlock });
                } else {
                    connectedNode = existingNodes[0];
                }

                let link = connectedNode.ports[connection.connectedPoint.name].link(inputPort);
                if (graphEditor._toAdd) {
                    graphEditor._toAdd.push(link);
                } else {
                    model.addAll(link);
                }
            }
        });
    }

    renderProperties(globalState: GlobalState): JSX.Element | null {
        return null;
    }
}