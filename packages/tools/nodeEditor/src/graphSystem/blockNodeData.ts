import { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import { GraphNode } from "shared-ui-components/nodeGraphSystem/graphNode";
import { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import { ConnectionPointPortData } from "./connectionPointPortData";

export class BlockNodeData implements INodeData {
    private _inputs: IPortData[] = [];
    private _outputs: IPortData[] = [];

    public get uniqueId(): number {
        return this.data.uniqueId;
    }
    
    public get name() {
        return this.data.name;
    }

    public getClassName() {
        return this.data.getClassName();
    }

    public get isInput() {
        return this.data.isInput;
    }

    public get inputs() {
        return this._inputs;
    }

    public get outputs() {
        return this._outputs;
    }

    public getPortByName(name: string) {
        for (const input of this.inputs) {
            if (input.name === name) {
                return input;
            }
        }
        for (const output of this.outputs) {
            if (output.name === name) {
                return output;
            }
        }

        return null;
    }

    public dispose() {
        this.data.dispose();
    }

    public constructor(public data: NodeMaterialBlock, existingNodes?: GraphNode[]) {
        this.data.inputs.forEach(input => {
            this._inputs.push(new ConnectionPointPortData(input, existingNodes));
        });

        this.data.outputs.forEach(output => {
            this._outputs.push(new ConnectionPointPortData(output, existingNodes));
        });
    }
}