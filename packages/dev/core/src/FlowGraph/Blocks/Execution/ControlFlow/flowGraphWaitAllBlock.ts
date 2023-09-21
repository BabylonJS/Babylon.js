import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../../flowGraphWithOnDoneExecutionBlock";

/**
 * @experimental
 * Configuration for the wait all block.
 */
export interface IFlowGraphWaitAllBlockConfiguration {
    numberInputFlows: number;
}

/**
 * @experimental
 * A block that waits for all input flows to be activated before activating its output flow.
 */
export class FlowGraphWaitAllBlock extends FlowGraphWithOnDoneExecutionBlock {
    public reset: FlowGraphSignalConnection;
    public readonly inFlows: FlowGraphSignalConnection[] = [];
    private _cachedActivationState: boolean[] = [];

    constructor(private _config: IFlowGraphWaitAllBlockConfiguration) {
        super();

        this.reset = this._registerSignalInput("reset");

        // The first inFlow is the default input signal all execution blocks have
        for (let i = 1; i < this._config.numberInputFlows; i++) {
            this.inFlows.push(this._registerSignalInput(`in${i}`));
        }
    }

    private _getCurrentActivationState(context: FlowGraphContext) {
        const activationState = this._cachedActivationState;
        activationState.length = 0;
        if (!context._hasExecutionVariable(this, "activationState")) {
            for (let i = 0; i < this._config.numberInputFlows; i++) {
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
            for (let i = 0; i < this._config.numberInputFlows; i++) {
                activationState[i] = false;
            }
        } else if (callingSignal === this.onStart) {
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
            for (let i = 0; i < this._config.numberInputFlows; i++) {
                activationState[i] = false;
            }
        }
    }
}
