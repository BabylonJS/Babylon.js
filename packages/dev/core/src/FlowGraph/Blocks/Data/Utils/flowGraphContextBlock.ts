import { FlowGraphBlock, type IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeAny, RichTypeNumber } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

/**
 * A block that outputs elements from the context
 */
export class FlowGraphContextBlock extends FlowGraphBlock {
    /**
     * Output connection: The user variables from the context
     */
    public readonly userVariables: FlowGraphDataConnection<FlowGraphContext["userVariables"]>;

    /**
     * Output connection: The execution id from the context
     */
    public readonly executionId: FlowGraphDataConnection<FlowGraphContext["executionId"]>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);

        this.userVariables = this.registerDataOutput("userVariables", RichTypeAny);
        this.executionId = this.registerDataOutput("executionId", RichTypeNumber);
    }

    public override _updateOutputs(context: FlowGraphContext): void {
        this.userVariables.setValue(context.userVariables, context);
        this.executionId.setValue(context.executionId, context);
    }

    public override serialize(serializationObject?: any): void {
        super.serialize(serializationObject);
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.Context;
    }
}

RegisterClass(FlowGraphBlockNames.Context, FlowGraphContextBlock);
