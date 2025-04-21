import type { INodeContainer } from "shared-ui-components/nodeGraphSystem/interfaces/nodeContainer";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import type { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import { ConnectionPointPortData } from "./connectionPointPortData";
import * as styles from "./blockNodeData.module.scss";
import type { NodeRenderGraphBlock } from "core/FrameGraph/Node/nodeRenderGraphBlock";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import type { NodeRenderGraphTeleportInBlock } from "core/FrameGraph/Node/Blocks/Teleport/teleportInBlock";
import type { NodeRenderGraphTeleportOutBlock } from "core/FrameGraph/Node/Blocks/Teleport/teleportOutBlock";

export class BlockNodeData implements INodeData {
    private _inputs: IPortData[] = [];
    private _outputs: IPortData[] = [];
    private _onBuildObserver: Nullable<Observer<NodeRenderGraphBlock>> = null;

    /**
     * Gets or sets a callback used to call node visual refresh
     */
    public refreshCallback?: () => void;

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

    public isConnectedToOutput() {
        const block = this.data;

        return block.isDebug || block.isAnAncestorOfType("NodeRenderGraphOutputBlock");
    }

    public dispose() {
        this.data.dispose();
        this.data.onBuildObservable.remove(this._onBuildObserver);
    }

    public prepareHeaderIcon(iconDiv: HTMLDivElement, img: HTMLImageElement) {
        if (this.data.getClassName() === "NodeRenderGraphElbowBlock") {
            iconDiv.classList.add(styles.hidden);
            return;
        }

        iconDiv.classList.add(styles.hidden);
    }

    public get invisibleEndpoints(): NodeRenderGraphTeleportOutBlock[] | null {
        if (this.data.isTeleportIn) {
            const teleportIn = this.data as NodeRenderGraphTeleportInBlock;
            return teleportIn.endpoints;
        }

        return null;
    }

    public constructor(
        public data: NodeRenderGraphBlock,
        nodeContainer: INodeContainer
    ) {
        if (data.inputs) {
            for (const input of this.data.inputs) {
                this._inputs.push(new ConnectionPointPortData(input, nodeContainer));
            }
        }

        if (data.outputs) {
            for (const output of this.data.outputs) {
                this._outputs.push(new ConnectionPointPortData(output, nodeContainer));
            }
        }

        this._onBuildObserver = data.onBuildObservable.add(() => {
            if (this.refreshCallback) {
                this.refreshCallback();
            }
        });
    }
}
