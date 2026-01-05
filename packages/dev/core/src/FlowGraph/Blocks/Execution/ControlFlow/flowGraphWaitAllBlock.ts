import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeFlowGraphInteger } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
/**
 * Configuration for the wait all block.
 */
export interface IFlowGraphWaitAllBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The number of input signals. There will always be at least one input flow.
     * glTF interactivity has a max of 64 input flows.
     */
    inputSignalCount: number;
}

/**
 * A block that waits for all input flows to be activated before activating its output flow.
 */
export class FlowGraphWaitAllBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: Resets the block.
     */
    public reset: FlowGraphSignalConnection;

    /**
     * Output connection:When the last missing flow is activated
     */
    public completed: FlowGraphSignalConnection;

    /**
     * Output connection: The number of remaining inputs to be activated.
     */
    public remainingInputs: FlowGraphDataConnection<FlowGraphInteger>;
    /**
     * An array of input signals
     */
    public readonly inFlows: FlowGraphSignalConnection[] = [];
    private _cachedActivationState: boolean[] = [];

    constructor(
        /**
         * the configuration of the block
         */
        public override config: IFlowGraphWaitAllBlockConfiguration
    ) {
        super(config);

        this.reset = this._registerSignalInput("reset");
        this.completed = this._registerSignalOutput("completed");
        this.remainingInputs = this.registerDataOutput("remainingInputs", RichTypeFlowGraphInteger, new FlowGraphInteger(this.config.inputSignalCount || 0));
        // The first inFlow is the default input signal all execution blocks have
        for (let i = 0; i < this.config.inputSignalCount; i++) {
            this.inFlows.push(this._registerSignalInput(`in_${i}`));
        }
        // no need for in
        this._unregisterSignalInput("in");
    }

    private _getCurrentActivationState(context: FlowGraphContext) {
        const activationState = this._cachedActivationState;
        activationState.length = 0;
        if (!context._hasExecutionVariable(this, "activationState")) {
            for (let i = 0; i < this.config.inputSignalCount; i++) {
                activationState.push(false);
            }
        } else {
            const contextActivationState = context._getExecutionVariable(this, "activationState", [] as boolean[]);
            for (let i = 0; i < contextActivationState.length; i++) {
                activationState.push(contextActivationState[i]);
            }
        }
        return activationState;
    }

    public _execute(context: FlowGraphContext, callingSignal: FlowGraphSignalConnection): void {
        const activationState = this._getCurrentActivationState(context);
        if (callingSignal === this.reset) {
            for (let i = 0; i < this.config.inputSignalCount; i++) {
                activationState[i] = false;
            }
        } else {
            const index = this.inFlows.indexOf(callingSignal);
            if (index >= 0) {
                activationState[index] = true;
            }
        }
        this.remainingInputs.setValue(new FlowGraphInteger(activationState.filter((v) => !v).length), context);

        context._setExecutionVariable(this, "activationState", activationState.slice());

        if (!activationState.includes(false)) {
            this.completed._activateSignal(context);
            for (let i = 0; i < this.config.inputSignalCount; i++) {
                activationState[i] = false;
            }
        } else {
            callingSignal !== this.reset && this.out._activateSignal(context);
        }
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.WaitAll;
    }

    /**
     * Serializes this block into a object
     * @param serializationObject the object to serialize to
     */
    public override serialize(serializationObject?: any): void {
        super.serialize(serializationObject);
        serializationObject.config.inputFlows = this.config.inputSignalCount;
    }
}
RegisterClass(FlowGraphBlockNames.WaitAll, FlowGraphWaitAllBlock);
