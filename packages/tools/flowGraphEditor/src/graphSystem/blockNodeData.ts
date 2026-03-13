import type { INodeContainer } from "shared-ui-components/nodeGraphSystem/interfaces/nodeContainer";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import type { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import { ConnectionPointPortData } from "./connectionPointPortData";
import * as styles from "./blockNodeData.module.scss";
import type { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphExecutionBlock } from "core/FlowGraph/flowGraphExecutionBlock";
import { FlowGraphBlockDisplayName } from "./blockDisplayUtils";

/**
 * Adapts a FlowGraphBlock to the INodeData interface used by the graph canvas.
 */
export class BlockNodeData implements INodeData {
    private _inputs: IPortData[] = [];
    private _outputs: IPortData[] = [];

    /**
     * Gets or sets a callback used to call node visual refresh
     */
    public refreshCallback?: () => void;

    /** Gets the numeric unique id derived from the block's GUID */
    public get uniqueId(): number {
        // FlowGraph blocks use string GUIDs; hash to a number for the graphing system
        return this._numericId;
    }

    private _numericId: number;

    /** Gets the display name of the block.
     * If the block name hasn't been user-customized (i.e. it's still the raw class name),
     * a cleaned-up label is returned with the "FlowGraph" prefix and "Block" suffix stripped.
     */
    public get name() {
        const raw = this.data.name;
        // Only strip the boilerplate when the user hasn't chosen a custom name yet.
        if (raw === this.data.getClassName()) {
            return FlowGraphBlockDisplayName(raw);
        }
        return raw;
    }

    /**
     * Gets the class name of the underlying block.
     * @returns the class name string
     */
    public getClassName() {
        return this.data.getClassName();
    }

    /** Whether this node is a pure input (no data inputs and not an execution block) */
    public get isInput() {
        return this.data.dataInputs.length === 0 && !this._isExecutionBlock();
    }

    /** Gets the input port data array */
    public get inputs() {
        return this._inputs;
    }

    /** Gets the output port data array */
    public get outputs() {
        return this._outputs;
    }

    /** Gets the comments associated with this block */
    public get comments() {
        return this.data.metadata?.comments || "";
    }

    /** Sets the comments for this block */
    public set comments(value: string) {
        if (!this.data.metadata) {
            this.data.metadata = {};
        }
        this.data.metadata.comments = value;
    }

    /** Gets the execution time (from the last measured execution, if applicable) */
    public get executionTime() {
        if (this._isExecutionBlock()) {
            return (this.data as unknown as FlowGraphExecutionBlock)._lastExecutionTime;
        }
        return -1;
    }

    /**
     * Gets a port by its internal name.
     * @param name - the name to search for
     * @returns the matching port data or null
     */
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

    /**
     * Whether the block is connected to an output.
     * @returns always true for flow graph blocks
     */
    public isConnectedToOutput() {
        return true; // In a flow graph, connectivity is determined differently
    }

    /** Dispose of this node data */
    public dispose() {
        // FlowGraph blocks don't have a dispose currently
    }

    /**
     * Prepare the header icon for the node.
     * @param iconDiv - the icon div element
     * @param _img - the image element (unused)
     */
    public prepareHeaderIcon(iconDiv: HTMLDivElement, _img: HTMLImageElement) {
        iconDiv.classList.add(styles.hidden);
    }

    /** Gets the invisible endpoints (not applicable) */
    public get invisibleEndpoints() {
        return null;
    }

    private _isExecutionBlock(): boolean {
        return !!(this.data as unknown as FlowGraphExecutionBlock).signalInputs;
    }

    private _hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Creates a new BlockNodeData.
     * @param data - the underlying flow graph block
     * @param nodeContainer - the node container for resolving connections
     */
    /**
     * The node container for resolving connections.
     */
    public nodeContainer: INodeContainer;

    public constructor(
        public data: FlowGraphBlock,
        nodeContainer: INodeContainer
    ) {
        this.nodeContainer = nodeContainer;
        this._numericId = this._hashString(data.uniqueId);

        // Add signal inputs (execution flow)
        if ((data as unknown as FlowGraphExecutionBlock).signalInputs) {
            const execBlock = data as unknown as FlowGraphExecutionBlock;
            for (const signalInput of execBlock.signalInputs) {
                this._inputs.push(new ConnectionPointPortData(signalInput, nodeContainer, "signal"));
            }
        }

        // Add data inputs
        for (const input of data.dataInputs) {
            this._inputs.push(new ConnectionPointPortData(input, nodeContainer, "data"));
        }

        // Add signal outputs (execution flow)
        if ((data as unknown as FlowGraphExecutionBlock).signalOutputs) {
            const execBlock = data as unknown as FlowGraphExecutionBlock;
            for (const signalOutput of execBlock.signalOutputs) {
                this._outputs.push(new ConnectionPointPortData(signalOutput, nodeContainer, "signal"));
            }
        }

        // Add data outputs
        for (const output of data.dataOutputs) {
            this._outputs.push(new ConnectionPointPortData(output, nodeContainer, "data"));
        }

        // Compatibility shim: GraphCanvasComponent.reconnectNewNodes accesses
        // content.data.outputs[index].connectTo() to re-establish internal connections
        // after copy/paste. FlowGraphBlock doesn't have a combined `outputs` property
        // (it uses dataOutputs + signalOutputs), so we expose the raw connection points
        // in the same order as this._outputs.
        const rawOutputs: any[] = [];
        if ((data as unknown as FlowGraphExecutionBlock).signalOutputs) {
            rawOutputs.push(...(data as unknown as FlowGraphExecutionBlock).signalOutputs);
        }
        rawOutputs.push(...data.dataOutputs);
        (data as any).outputs = rawOutputs;
    }
}
