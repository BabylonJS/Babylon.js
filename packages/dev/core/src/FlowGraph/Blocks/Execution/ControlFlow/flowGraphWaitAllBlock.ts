import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphSignalConnection } from "core/FlowGraph/flowGraphSignalConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "core/FlowGraph/flowGraphWithOnDoneExecutionBlock";

export interface IFlowGraphWaitAllBlockConfiguration {
    numberInputFlows: number;
}

export class FlowGraphWaitAllBlock extends FlowGraphWithOnDoneExecutionBlock {
    public reset: FlowGraphSignalConnection;
    public readonly inFlows: FlowGraphSignalConnection[] = [];

    constructor(private _config: IFlowGraphWaitAllBlockConfiguration) {
        super();

        this.reset = this._registerSignalInput("reset");

        // The first inFlow is the default input signal all execution blocks have
        for (let i = 1; i < this._config.numberInputFlows; i++) {
            this.inFlows.push(this._registerSignalInput(`in${i}`));
        }
    }

    private _getCurrentActivationState(context: FlowGraphContext) {
        let activationState = [];
        if (!context._hasExecutionVariable(this, "activationState")) {
            for (let i = 0; i < this._config.numberInputFlows; i++) {
                activationState.push(false);
            }
        } else {
            activationState = context._getExecutionVariable(this, "activationState");
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

        context._setExecutionVariable(this, "activationState", activationState);

        if (activationState.every((value: boolean) => value)) {
            this.onDone._activateSignal(context);
            for (let i = 0; i < this._config.numberInputFlows; i++) {
                activationState[i] = false;
            }
        }
    }
}
