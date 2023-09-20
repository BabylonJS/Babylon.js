import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { FlowGraphExecutionBlock } from "core/FlowGraph/flowGraphExecutionBlock";
import { RichTypeNumber } from "core/FlowGraph/flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "core/FlowGraph/flowGraphSignalConnection";

export interface IFlowGraphMultiGateBlockConfiguration {
    numberOutputFlows: number;
    isRandom?: boolean;
    loop?: boolean;
    startIndex?: number;
}
/**
 * @experimental
 * A block that has an input flow and routes it to any potential output flows, randomly or sequentially
 * @see https://docs.google.com/document/d/1MT7gL-IEn_PUw-4XGBazMxsyqsxqgAVGYcNeC4Cj_9Q/edit#heading=h.i2sn85fbjo60
 */
export class FlowGraphMultiGateBlock extends FlowGraphExecutionBlock {
    private _config: IFlowGraphMultiGateBlockConfiguration;
    public readonly reset: FlowGraphSignalConnection;
    public readonly outFlows: FlowGraphSignalConnection[] = [];
    public readonly currentIndex: FlowGraphDataConnection<number>;

    constructor(config: IFlowGraphMultiGateBlockConfiguration) {
        super();
        this._config = {
            isRandom: false,
            loop: false,
            startIndex: 0,
            ...config,
        };
        this._config.startIndex = Math.max(0, Math.min(this._config.startIndex!, this._config.numberOutputFlows - 1));

        for (let i = 0; i < this._config.numberOutputFlows; i++) {
            this.outFlows.push(this._registerSignalOutput(`out${i}`));
        }

        this.reset = this._registerSignalInput("reset");
        this.currentIndex = this._registerDataOutput("currentIndex", RichTypeNumber);
    }

    private _getUnusedIndexes(context: FlowGraphContext): number[] {
        let result = [];
        if (!context._hasExecutionVariable(this, "unusedIndexes")) {
            for (let i = 0; i < this._config.numberOutputFlows; i++) {
                result.push(i);
            }
        } else {
            result = context._getExecutionVariable(this, "unusedIndexes");
        }
        return result;
    }

    private _getNextOutput(currentIndex: number, unusedIndexes: number[]): number {
        if (this._config.isRandom) {
            const nextIndex = Math.floor(Math.random() * unusedIndexes.length);
            return unusedIndexes[nextIndex];
        } else {
            return currentIndex + 1;
        }
    }

    public _execute(context: FlowGraphContext, callingSignal: FlowGraphSignalConnection): void {
        const currentIndex = context._getExecutionVariable(this, "currentIndex") ?? this._config.startIndex! - 1;
        let unusedIndexes = this._getUnusedIndexes(context);

        let nextIndex: number;
        if (callingSignal === this.reset) {
            nextIndex = this._config.startIndex!;
        } else {
            nextIndex = this._getNextOutput(currentIndex, unusedIndexes);
            if (nextIndex >= this._config.numberOutputFlows && this._config.loop) {
                nextIndex = 0;
            } else if (nextIndex >= this._config.numberOutputFlows && !this._config.loop) {
                return;
            }
        }
        unusedIndexes = unusedIndexes.filter((i) => i !== nextIndex);
        if (unusedIndexes.length === 0) {
            for (let i = 0; i < this._config.numberOutputFlows; i++) {
                unusedIndexes.push(i);
            }
        }
        context._setExecutionVariable(this, "unusedIndexes", unusedIndexes);
        context._setExecutionVariable(this, "currentIndex", nextIndex);
        this.currentIndex.value = nextIndex;
        this.outFlows[nextIndex]._activateSignal(context);
    }
}
