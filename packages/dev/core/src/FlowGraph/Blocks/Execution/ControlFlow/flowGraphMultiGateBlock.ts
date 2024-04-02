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
    loop?: boolean;
    /**
     * The index of the output flow to start with. Default to 0.
     */
    startIndex?: number;
}
/**
 * @experimental
 * A block that has an input flow and routes it to any potential output flows, randomly or sequentially
 * @see https://docs.google.com/document/d/1MT7gL-IEn_PUw-4XGBazMxsyqsxqgAVGYcNeC4Cj_9Q/edit#heading=h.i2sn85fbjo60
 */
export class FlowGraphMultiGateBlock extends FlowGraphExecutionBlock {
    /**
     * Input connection: Resets the gate.
     */
    public readonly reset: FlowGraphSignalConnection;
    /**
     * Output connections: The output flows.
     */
    public outFlows: FlowGraphSignalConnection[];
    /**
     * Output connection: The index of the current output flow.
     */
    public readonly currentIndex: FlowGraphDataConnection<number>;
    private _cachedUnusedIndexes: number[] = [];

    constructor(
        /**
         * the configuration of the block
         */
        public config: IFlowGraphMultiGateBlockConfiguration
    ) {
        super(config);
        this.reset = this._registerSignalInput("reset");
        this.currentIndex = this.registerDataOutput("currentIndex", RichTypeNumber);
        this.config.startIndex = this.config.startIndex !== undefined ? this.config.startIndex : 0;
        this.config.startIndex = Math.max(0, Math.min(this.config.startIndex!, this.config.numberOutputFlows - 1));
        this.outFlows = [];
        for (let i = 0; i < this.config.numberOutputFlows; i++) {
            this.outFlows.push(this._registerSignalOutput(`out${i}`));
        }
    }

    private _getUnusedIndexes(context: FlowGraphContext): number[] {
        const result = this._cachedUnusedIndexes;
        result.length = 0;
        if (!context._hasExecutionVariable(this, "unusedIndexes")) {
            for (let i = 0; i < this.config.numberOutputFlows; i++) {
                result.push(i);
            }
        } else {
            const contextUnusedIndexes = context._getExecutionVariable(this, "unusedIndexes");
            for (let i = 0; i < contextUnusedIndexes.length; i++) {
                result.push(contextUnusedIndexes[i]);
            }
        }
        return result;
    }

    private _getNextOutput(currentIndex: number, unusedIndexes: number[]): number {
        if (this.config.isRandom) {
            const nextIndex = Math.floor(Math.random() * unusedIndexes.length);
            return unusedIndexes[nextIndex];
        } else {
            return currentIndex + 1;
        }
    }

    public _execute(context: FlowGraphContext, callingSignal: FlowGraphSignalConnection): void {
        const currentIndex = context._getExecutionVariable(this, "currentIndex") ?? this.config.startIndex! - 1;
        let unusedIndexes = this._getUnusedIndexes(context);

        if (callingSignal === this.reset) {
            context._deleteExecutionVariable(this, "currentIndex");
            context._deleteExecutionVariable(this, "unusedIndexes");
            return;
        }

        let nextIndex = this._getNextOutput(currentIndex, unusedIndexes);
        if (nextIndex >= this.config.numberOutputFlows && this.config.loop) {
            nextIndex = 0;
        } else if (nextIndex >= this.config.numberOutputFlows && !this.config.loop) {
            return;
        }

        unusedIndexes = unusedIndexes.filter((i) => i !== nextIndex);
        if (unusedIndexes.length === 0) {
            for (let i = 0; i < this.config.numberOutputFlows; i++) {
                unusedIndexes.push(i);
            }
        }
        context._setExecutionVariable(this, "unusedIndexes", unusedIndexes);
        context._setExecutionVariable(this, "currentIndex", nextIndex);
        this.currentIndex.setValue(nextIndex, context);
        this.outFlows[nextIndex]._activateSignal(context);
    }

    /**
     * @returns class name of the block.
     */
    public getClassName(): string {
        return "FGMultiGateBlock";
    }

    /**
     * Serializes the block.
     * @param serializationObject the object to serialize to.
     */
    public serialize(serializationObject?: any): void {
        super.serialize(serializationObject);
        serializationObject.config.numberOutputFlows = this.config.numberOutputFlows;
        serializationObject.config.isRandom = this.config.isRandom;
        serializationObject.config.loop = this.config.loop;
        serializationObject.config.startIndex = this.config.startIndex;
    }
}
RegisterClass("FGMultiGateBlock", FlowGraphMultiGateBlock);
