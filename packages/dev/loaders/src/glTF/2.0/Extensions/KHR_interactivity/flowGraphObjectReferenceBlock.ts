import { FlowGraphBlock, type IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { type FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection.pure";
import { RichTypeAny, RichTypeString } from "core/FlowGraph/flowGraphRichTypes.pure";

/**
 * Converts a runtime object into the opaque reference used by KHR_interactivity.
 */
export class FlowGraphObjectReferenceBlock extends FlowGraphBlock {
    /** Runtime object to encode. */
    public readonly object: FlowGraphDataConnection<object | undefined>;
    /** Opaque KHR_interactivity reference. */
    public readonly value: FlowGraphDataConnection<string>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.object = this.registerDataInput("object", RichTypeAny);
        this.value = this.registerDataOutput("value", RichTypeString, "");
    }

    /** @internal */
    public override _updateOutputs(context: FlowGraphContext): void {
        const object = this.object.getValue(context);
        this.value.setValue(object ? (context.getObjectReference(object, "nodes") ?? "") : "", context);
    }

    /** @returns the serialized class name */
    public override getClassName(): string {
        return "FlowGraphObjectReferenceBlock";
    }
}
