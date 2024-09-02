import { NodeMaterialBlockTargets } from "core/Materials/Node/Enums/nodeMaterialBlockTargets";
import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { INodeContainer } from "shared-ui-components/nodeGraphSystem/interfaces/nodeContainer";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import type { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import { ConnectionPointPortData } from "./connectionPointPortData";
import triangle from "../imgs/triangle.svg";
import square from "../imgs/square.svg";
import styles from "./blockNodeData.modules.scss";
import type { NodeMaterialTeleportOutBlock } from "core/Materials/Node/Blocks/Teleport/teleportOutBlock";
import type { NodeMaterialTeleportInBlock } from "core/Materials/Node/Blocks/Teleport/teleportInBlock";

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

    public get executionTime() {
        return -1;
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

    public prepareHeaderIcon(iconDiv: HTMLDivElement, img: HTMLImageElement) {
        if (this.data.getClassName() === "ElbowBlock") {
            iconDiv.classList.add(styles.hidden);
            return;
        }

        if (this.data.target === NodeMaterialBlockTargets.Fragment) {
            iconDiv.title = "In the fragment shader";
            img.src = square;

            return;
        }

        if (this.data.target === NodeMaterialBlockTargets.Vertex) {
            iconDiv.title = "In the vertex shader";
            img.src = triangle;

            return;
        }

        iconDiv.classList.add(styles.hidden);
    }

    public get invisibleEndpoints(): NodeMaterialTeleportOutBlock[] | null {
        if (this.data.isTeleportIn) {
            const teleportIn = this.data as NodeMaterialTeleportInBlock;
            return teleportIn.endpoints;
        }

        return null;
    }

    public constructor(
        public data: NodeMaterialBlock,
        nodeContainer: INodeContainer
    ) {
        if (data.inputs) {
            this.data.inputs.forEach((input) => {
                this._inputs.push(new ConnectionPointPortData(input, nodeContainer));
            });
        }

        if (data.outputs && !this.data.isTeleportIn) {
            this.data.outputs.forEach((output) => {
                this._outputs.push(new ConnectionPointPortData(output, nodeContainer));
            });
        }
    }
}
