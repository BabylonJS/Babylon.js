import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeFlowGraphInteger } from "../../../flowGraphRichTypes";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { FlowGraphInteger } from "../../../flowGraphInteger";

/**
 * @experimental
 */
export interface IFlowGraphDoNBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The start index for the counter.
     */
    startIndex: FlowGraphInteger;
}
/**
 * A block that executes a branch a set number of times.
 * @experimental
 */
export class FlowGraphDoNBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: Resets the counter
     */
    public readonly reset: FlowGraphSignalConnection;
    /**
     * Input connection: The maximum number of times the block can be executed.
     */
    public readonly n: FlowGraphDataConnection<FlowGraphInteger>;
    /**
     * Output connection: The number of times the block has been executed.
     */
    public readonly value: FlowGraphDataConnection<FlowGraphInteger>;

    constructor(
        /**
         * the configuration of the block
         */
        public config: IFlowGraphDoNBlockConfiguration = { startIndex: new FlowGraphInteger(0) }
    ) {
        super(config);
        this.reset = this._registerSignalInput("reset");
        this.n = this.registerDataInput("n", RichTypeFlowGraphInteger);
        this.value = this.registerDataOutput("value", RichTypeFlowGraphInteger);
    }

    public _execute(context: FlowGraphContext, callingSignal: FlowGraphSignalConnection): void {
        if (callingSignal === this.reset) {
            this.value.setValue(this.config.startIndex, context);
        } else {
            const currentCountValue = this.value.getValue(context);
            if (currentCountValue.value < this.n.getValue(context).value) {
                this.value.setValue(new FlowGraphInteger(currentCountValue.value + 1), context);
                this.out._activateSignal(context);
            }
        }
    }

    /**
     * @returns class name of the block.
     */
    public getClassName(): string {
        return FlowGraphDoNBlock.ClassName;
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGDoNBlock";
}
RegisterClass(FlowGraphDoNBlock.ClassName, FlowGraphDoNBlock);
