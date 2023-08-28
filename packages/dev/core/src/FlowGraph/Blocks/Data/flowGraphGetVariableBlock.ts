import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphValueType } from "core/FlowGraph/flowGraphTypes";

/**
 * @experimental
 */
export class FlowGraphGetVariableBlock extends FlowGraphBlock {
    public readonly variableName: FlowGraphDataConnection;
    public readonly output: FlowGraphDataConnection;

    constructor() {
        super();

        this.variableName = this._registerDataInput("variableName", FlowGraphValueType.String);
        this.output = this._registerDataOutput("output", FlowGraphValueType.Any);
    }

    /**
     * @internal
     */
    public _updateOutputs(context: FlowGraphContext): void {
        const variableNameValue = this.variableName.getValue(context);
        if (context.hasVariable(variableNameValue)) {
            this.output.value = context.getVariable(variableNameValue);
        }
    }
}
