import { RegisterClass } from "../../../../Misc/typeStore";
import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphExecutionBlock } from "../../../flowGraphExecutionBlock";
import { RichTypeNumber } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
/**
 * @experimental
 * Configuration for the multi gate block.
 */
export interface IFlowGraphMultiGateBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The number of output flows.
     */
    numberOutputFlows: number;
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
 * @experimental
 * A block that has an input flow and routes it to any potential output flows, randomly or sequentially
 * @see https://docs.google.com/document/d/1MT7gL-IEn_PUw-4XGBazMxsyqsxqgAVGYcNeC4Cj_9Q/edit#heading=h.i2sn85fbjo60
 */
export class FlowGraphMultiGateBlock extends FlowGraphExecutionBlock {
    /**
     * The class name of the block.
     */
    public static ClassName = "FGMultiGateBlock";
    /**
     * Input connection: Resets the gate.
     */
    public readonly reset: FlowGraphSignalConnection;
    /**
     * Output connections: The output flows.
     */
    public readonly outFlows: FlowGraphSignalConnection[] = [];
    /**
     * Output connection: The index of the current output flow.
     */
    public readonly lastIndex: FlowGraphDataConnection<number>;

    constructor(
        /**
         * the configuration of the block
         */
        public override config: IFlowGraphMultiGateBlockConfiguration
    ) {
        super(config);
        this.reset = this._registerSignalInput("reset");
        this.lastIndex = this.registerDataOutput("lastIndex", RichTypeNumber, -1);
        for (let i = 0; i < this.config.numberOutputFlows; i++) {
            this.outFlows.push(this._registerSignalOutput(`out_${i}`));
        }
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
            return unusedIndexes[Math.floor(Math.random() * unusedIndexes.length)];
        }
    }

    public _execute(context: FlowGraphContext, callingSignal: FlowGraphSignalConnection): void {
        // set the state(s) of the block
        if (!context._hasExecutionVariable(this, "indexesUsed")) {
            context._setExecutionVariable(
                this,
                "indexesUsed",
                this.outFlows.map(() => false)
            );
        }

        if (callingSignal === this.reset) {
            context._deleteExecutionVariable(this, "indexesUsed");
            this.lastIndex.setValue(-1, context);
            return;
        }
        const indexesUsed = context._getExecutionVariable(this, "indexesUsed", [] as boolean[]);
        const nextIndex = this._getNextIndex(indexesUsed);
        if (nextIndex === -1) {
            return;
        }
        this.lastIndex.setValue(nextIndex, context);
        this.outFlows[nextIndex]._activateSignal(context);
        indexesUsed[nextIndex] = true;
        context._setExecutionVariable(this, "indexesUsed", indexesUsed);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphMultiGateBlock.ClassName;
    }

    /**
     * Serializes the block.
     * @param serializationObject the object to serialize to.
     */
    public override serialize(serializationObject?: any): void {
        super.serialize(serializationObject);
        serializationObject.config.numberOutputFlows = this.config.numberOutputFlows;
        serializationObject.config.isRandom = this.config.isRandom;
        serializationObject.config.loop = this.config.isLoop;
        serializationObject.config.startIndex = this.config.startIndex;
    }
}
RegisterClass(FlowGraphMultiGateBlock.ClassName, FlowGraphMultiGateBlock);
