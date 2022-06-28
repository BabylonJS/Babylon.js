import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { INodeContainer } from "shared-ui-components/nodeGraphSystem/interfaces/nodeContainer";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import type { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
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

    public get comments() {
        return this.data.comments;
    }

    public set comments(value: string) {
        this.data.comments = value;
    }

    public getPortByName(name: string) {
        for (const input of this.inputs) {
            if (input.internalName === name) {
                return input;
            }
        }
        for (const output of this.outputs) {
            if (output.internalName === name) {
                return output;
            }
        }

        return null;
    }

    public dispose() {
        this.data.dispose();
    }

    public getWarningMessage() {
        if (this.data.getClassName() !== "ElbowBlock" && this.data.willBeGeneratedIntoVertexShaderFromFragmentShader) {
            return "For optimization reasons, this block will be promoted to the vertex shader. You can force it to render in the fragment shader by setting its target to Fragment";
        }

        return "";
    }

    public constructor(public data: NodeMaterialBlock, nodeContainer: INodeContainer) {
        this.data.inputs.forEach((input) => {
            this._inputs.push(new ConnectionPointPortData(input, nodeContainer));
        });

        this.data.outputs.forEach((output) => {
            this._outputs.push(new ConnectionPointPortData(output, nodeContainer));
        });
    }
}
