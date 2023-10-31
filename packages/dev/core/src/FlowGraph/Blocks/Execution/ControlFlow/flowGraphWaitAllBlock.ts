import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../../flowGraphWithOnDoneExecutionBlock";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
/**
 * @experimental
 * Configuration for the wait all block.
 */
export interface IFlowGraphWaitAllBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The number of input flows. There will always be at least one input flow.
     */
    numberInputFlows: number;
}

/**
 * @experimental
 * A block that waits for all input flows to be activated before activating its output flow.
 */
export class FlowGraphWaitAllBlock extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * Input connection: Resets the block.
     */
    public reset: FlowGraphSignalConnection;
    /**
     * Input connection: The 2nd to nth input flows (the first is named onStart)
     */
    public readonly inFlows: FlowGraphSignalConnection[] = [];
    private _cachedActivationState: boolean[] = [];

    constructor(public config: IFlowGraphWaitAllBlockConfiguration) {
        super(config);

        this.reset = this._registerSignalInput("reset");
    }

    configure(): void {
        // The first inFlow is the default input signal all execution blocks have
        for (let i = 1; i < this.config.numberInputFlows; i++) {
            this.inFlows.push(this._registerSignalInput(`in${i}`));
        }
    }

    private _getCurrentActivationState(context: FlowGraphContext) {
        const activationState = this._cachedActivationState;
        activationState.length = 0;
        if (!context._hasExecutionVariable(this, "activationState")) {
            for (let i = 0; i < this.config.numberInputFlows; i++) {
                activationState.push(false);
            }
        } else {
            const contextActivationState = context._getExecutionVariable(this, "activationState");
            for (let i = 0; i < contextActivationState.length; i++) {
                activationState.push(contextActivationState[i]);
            }
        }
        return activationState;
    }

    public _execute(context: FlowGraphContext, callingSignal: FlowGraphSignalConnection): void {
        const activationState = this._getCurrentActivationState(context);
        if (callingSignal === this.reset) {
            for (let i = 0; i < this.config.numberInputFlows; i++) {
                activationState[i] = false;
            }
        } else if (callingSignal === this.in) {
            activationState[0] = true;
        } else {
            const index = this.inFlows.indexOf(callingSignal);
            if (index >= 0) {
                activationState[index + 1] = true;
            }
        }

        context._setExecutionVariable(this, "activationState", activationState.slice());

        if (activationState.every((value: boolean) => value)) {
            this.onDone._activateSignal(context);
            for (let i = 0; i < this.config.numberInputFlows; i++) {
                activationState[i] = false;
            }
        }
    }

    public getClassName(): string {
        return "FGWaitAllBlock";
    }
}
RegisterClass("FGWaitAllBlock", FlowGraphWaitAllBlock);
