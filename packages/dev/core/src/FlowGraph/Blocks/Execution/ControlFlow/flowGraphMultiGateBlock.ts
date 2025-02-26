import { RegisterClass } from "../../../../Misc/typeStore";
import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphExecutionBlock } from "../../../flowGraphExecutionBlock";
import { RichTypeFlowGraphInteger } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
/**
 * Configuration for the multi gate block.
 */
export interface IFlowGraphMultiGateBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The number of output signals. Required.
     */
    outputSignalCount: number;
    /**
     * If the block should pick a random output flow from the ones that haven't been executed. Default to false.
     */
    isRandom?: boolean;
    /**
     * If the block should loop back to the first output flow after executing the last one. Default to false.
     */
    isLoop?: boolean;
}

/**
 * A block that has an input flow and routes it to any potential output flows, randomly or sequentially
 */
export class FlowGraphMultiGateBlock extends FlowGraphExecutionBlock {
    /**
     * Input connection: Resets the gate.
     */
    public readonly reset: FlowGraphSignalConnection;
    /**
     * Output connections: The output signals.
     */
    public readonly outputSignals: FlowGraphSignalConnection[] = [];
    /**
     * Output connection: The index of the current output flow.
     */
    public readonly lastIndex: FlowGraphDataConnection<FlowGraphInteger>;

    constructor(
        /**
         * the configuration of the block
         */
        public override config: IFlowGraphMultiGateBlockConfiguration
    ) {
        super(config);
        this.reset = this._registerSignalInput("reset");
        this.lastIndex = this.registerDataOutput("lastIndex", RichTypeFlowGraphInteger, new FlowGraphInteger(-1));
        this.setNumberOfOutputSignals(config?.outputSignalCount);
    }

    private _getNextIndex(indexesUsed: boolean[]): number {
        // find the next index available from the indexes used array

        // if all outputs were used, reset the indexes used array if we are in a loop multi gate
        if (!indexesUsed.includes(false)) {
            if (this.config.isLoop) {
                indexesUsed.fill(false);
            }
        }
        if (!this.config.isRandom) {
            return indexesUsed.indexOf(false);
        } else {
            const unusedIndexes = indexesUsed.map((used, index) => (used ? -1 : index)).filter((index) => index !== -1);
            return unusedIndexes.length ? unusedIndexes[Math.floor(Math.random() * unusedIndexes.length)] : -1;
        }
    }

    /**
     * Sets the block's output signals. Would usually be passed from the constructor but can be changed afterwards.
     * @param numberOutputSignals the number of output flows
     */
    public setNumberOfOutputSignals(numberOutputSignals: number = 1) {
        // check the size of the outFlow Array, see if it is not larger than needed
        while (this.outputSignals.length > numberOutputSignals) {
            const flow = this.outputSignals.pop();
            if (flow) {
                flow.disconnectFromAll();
                this._unregisterSignalOutput(flow.name);
            }
        }

        while (this.outputSignals.length < numberOutputSignals) {
            this.outputSignals.push(this._registerSignalOutput(`out_${this.outputSignals.length}`));
        }
    }

    public _execute(context: FlowGraphContext, callingSignal: FlowGraphSignalConnection): void {
        // set the state(s) of the block
        if (!context._hasExecutionVariable(this, "indexesUsed")) {
            context._setExecutionVariable(
                this,
                "indexesUsed",
                this.outputSignals.map(() => false)
            );
        }

        if (callingSignal === this.reset) {
            context._deleteExecutionVariable(this, "indexesUsed");
            this.lastIndex.setValue(new FlowGraphInteger(-1), context);
            return;
        }
        const indexesUsed = context._getExecutionVariable(this, "indexesUsed", [] as boolean[]);
        const nextIndex = this._getNextIndex(indexesUsed);
        if (nextIndex > -1) {
            this.lastIndex.setValue(new FlowGraphInteger(nextIndex), context);
            indexesUsed[nextIndex] = true;
            context._setExecutionVariable(this, "indexesUsed", indexesUsed);
            this.outputSignals[nextIndex]._activateSignal(context);
        }
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.MultiGate;
    }

    /**
     * Serializes the block.
     * @param serializationObject the object to serialize to.
     */
    public override serialize(serializationObject?: any): void {
        super.serialize(serializationObject);
        serializationObject.config.outputSignalCount = this.config.outputSignalCount;
        serializationObject.config.isRandom = this.config.isRandom;
        serializationObject.config.loop = this.config.isLoop;
        serializationObject.config.startIndex = this.config.startIndex;
    }
}
RegisterClass(FlowGraphBlockNames.MultiGate, FlowGraphMultiGateBlock);
