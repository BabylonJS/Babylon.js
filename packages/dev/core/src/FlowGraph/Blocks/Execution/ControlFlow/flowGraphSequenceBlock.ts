import { RegisterClass } from "../../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import type { FlowGraphContext } from "../../../flowGraphContext";
import { FlowGraphExecutionBlock } from "../../../flowGraphExecutionBlock";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";

/**
 * @experimental
 * Configuration for the sequence block.
 */
export interface IFlowGraphSequenceBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The number of output flows.
     */
    numberOutputFlows: number;
}

/**
 * @experimental
 * A block that executes its output flows in sequence.
 */
export class FlowGraphSequenceBlock extends FlowGraphExecutionBlock {
    /**
     * The output flows.
     */
    public outFlows: FlowGraphSignalConnection[];

    constructor(
        /**
         * the configuration of the block
         */
        public config: IFlowGraphSequenceBlockConfiguration
    ) {
        super(config);
        this.outFlows = [];
        for (let i = 0; i < this.config.numberOutputFlows; i++) {
            this.outFlows.push(this._registerSignalOutput(`${i}`));
        }
    }

    public _execute(context: FlowGraphContext) {
        for (let i = 0; i < this.config.numberOutputFlows; i++) {
            this.outFlows[i]._activateSignal(context);
        }
    }

    /**
     * @returns class name of the block.
     */
    public getClassName(): string {
        return FlowGraphSequenceBlock.ClassName;
    }

    /**
     * the class name of the block.
     */
    public static ClassName = "FGSequenceBlock";
}
RegisterClass(FlowGraphSequenceBlock.ClassName, FlowGraphSequenceBlock);
