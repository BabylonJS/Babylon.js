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
     * The number of output flows.
     */
    numberOutputFlows?: number;
}

/**
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
        public override config: IFlowGraphSequenceBlockConfiguration
    ) {
        super(config);
        this.outFlows = [];
        this.setNumberOfOutputFlows(this.config.numberOutputFlows);
    }

    public _execute(context: FlowGraphContext) {
        for (let i = 0; i < this.outFlows.length; i++) {
            this.outFlows[i]._activateSignal(context);
        }
    }

    /**
     * Sets the block's output flows. Would usually be passed from the constructor but can be changed afterwards.
     * @param numberOutputFlows the number of output flows
     */
    public setNumberOfOutputFlows(numberOutputFlows: number = 1) {
        // check the size of the outFlow Array, see if it is not larger than needed
        while (this.outFlows.length > numberOutputFlows) {
            const flow = this.outFlows.pop();
            if (flow) {
                flow.disconnectFromAll();
                this._unregisterSignalOutput(flow.name);
            }
        }

        while (this.outFlows.length < numberOutputFlows) {
            this.outFlows.push(this._registerSignalOutput(`out_${this.outFlows.length}`));
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
