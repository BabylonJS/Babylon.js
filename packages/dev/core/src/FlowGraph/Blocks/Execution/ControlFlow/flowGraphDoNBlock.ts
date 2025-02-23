import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeFlowGraphInteger } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { FlowGraphInteger } from "../../../CustomTypes/flowGraphInteger";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

/**
 * Configuration for the DoN block.
 */
export interface IFlowGraphDoNBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The start index for the counter.
     */
    startIndex?: FlowGraphInteger;
}
/**
 * A block that executes a branch a set number of times.
 */
export class FlowGraphDoNBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: Resets the counter
     */
    public readonly reset: FlowGraphSignalConnection;
    /**
     * Input connection: The maximum number of times the block can be executed.
     */
    public readonly maxExecutions: FlowGraphDataConnection<FlowGraphInteger>;
    /**
     * Output connection: The number of times the block has been executed.
     */
    public readonly executionCount: FlowGraphDataConnection<FlowGraphInteger>;

    constructor(
        /**
         * [Object] the configuration of the block
         */
        public override config: IFlowGraphDoNBlockConfiguration = {}
    ) {
        super(config);
        this.config.startIndex = config.startIndex ?? new FlowGraphInteger(0);
        this.reset = this._registerSignalInput("reset");
        this.maxExecutions = this.registerDataInput("maxExecutions", RichTypeFlowGraphInteger);
        this.executionCount = this.registerDataOutput("executionCount", RichTypeFlowGraphInteger, new FlowGraphInteger(0));
    }

    public _execute(context: FlowGraphContext, callingSignal: FlowGraphSignalConnection): void {
        if (callingSignal === this.reset) {
            this.executionCount.setValue(this.config.startIndex!, context);
        } else {
            const currentCountValue = this.executionCount.getValue(context);
            if (currentCountValue.value < this.maxExecutions.getValue(context).value) {
                this.executionCount.setValue(new FlowGraphInteger(currentCountValue.value + 1), context);
                this.out._activateSignal(context);
            }
        }
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.DoN;
    }
}
RegisterClass(FlowGraphBlockNames.DoN, FlowGraphDoNBlock);
