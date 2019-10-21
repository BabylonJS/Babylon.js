import { LinkModel, PortModel } from "storm-react-diagrams";
import { Nullable } from 'babylonjs/types';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
import { DefaultNodeModel } from '../defaultNodeModel';
import { AdvancedLinkModel } from '../link/advancedLinkModel';

/**
 * Port model
 */
export class DefaultPortModel extends PortModel {
	/**
	 * If the port is input or output
	 */
    public position: string | "input" | "output";
	/**
	 * What the port is connected to
	 */
    public connection: Nullable<NodeMaterialConnectionPoint> = null;

    public defaultValue: any;

    static idCounter = 0;

    constructor(name: string, type: string = "input") {
        super(name, "generic");
        this.position = type;
        DefaultPortModel.idCounter++;
    }

    canLinkToPort(port: DefaultPortModel): boolean {
        if (!this.connection || !port.connection) {
            return true;
        }

        return this.connection.canConnectTo(port.connection);
    }

    syncWithNodeMaterialConnectionPoint(connection: NodeMaterialConnectionPoint) {
        this.connection = connection;
        this.name = connection.name;
    }

    getNodeModel() {
        return this.parent as DefaultNodeModel
    }

    link(outPort: DefaultPortModel) {
        var link = this.createLinkModel()
        link.setSourcePort(this)
        link.setTargetPort(outPort)
        return link;
    }

    createLinkModel(): LinkModel {
        return new AdvancedLinkModel();
    }

    static SortInputOutput(a: Nullable<DefaultPortModel>, b: Nullable<DefaultPortModel>) {
        if (!a || !b) {
            return null;
        } else if (a.position == "output" && b.position == "input") {
            return {
                input: b,
                output: a
            }
        } else if (b.position == "output" && a.position == "input") {
            return {
                input: a,
                output: b
            }
        } else {
            return null;
        }
    }
}