import { LinkModel, PortModel, DefaultLinkModel } from "storm-react-diagrams";
import { Nullable } from 'babylonjs/types';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
import { DefaultNodeModel } from './defaultNodeModel';

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
        return new DefaultLinkModel();
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