import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import type { FlowGraphContext } from "../../../flowGraphContext";
import { FlowGraphExecutionBlock } from "../../../flowGraphExecutionBlock";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";

/**
 * Configuration for the sequence block.
 */
export interface IFlowGraphSequenceBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The number of output signals. Defaults to 1.
     */
    outputSignalCount?: number;
}

/**
 * A block that executes its output flows in sequence.
 */
export class FlowGraphSequenceBlock extends FlowGraphExecutionBlock {
    /**
     * The output flows.
     */
    public executionSignals: FlowGraphSignalConnection[] = [];

    constructor(
        /**
         * the configuration of the block
         */
        public override config: IFlowGraphSequenceBlockConfiguration
    ) {
        super(config);
        this.setNumberOfOutputSignals(this.config.outputSignalCount);
    }

    public _execute(context: FlowGraphContext) {
        for (let i = 0; i < this.executionSignals.length; i++) {
            this.executionSignals[i]._activateSignal(context);
        }
    }

    /**
     * Sets the block's output flows. Would usually be passed from the constructor but can be changed afterwards.
     * @param outputSignalCount the number of output flows
     */
    public setNumberOfOutputSignals(outputSignalCount: number = 1) {
        // check the size of the outFlow Array, see if it is not larger than needed
        while (this.executionSignals.length > outputSignalCount) {
            const flow = this.executionSignals.pop();
            if (flow) {
                flow.disconnectFromAll();
                this._unregisterSignalOutput(flow.name);
            }
        }

        while (this.executionSignals.length < outputSignalCount) {
            this.executionSignals.push(this._registerSignalOutput(`out_${this.executionSignals.length}`));
        }
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.Sequence;
    }
}

RegisterClass(FlowGraphBlockNames.Sequence, FlowGraphSequenceBlock);
