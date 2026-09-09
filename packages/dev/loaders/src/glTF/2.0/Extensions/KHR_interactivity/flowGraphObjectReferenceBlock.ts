import { FlowGraphBlock, type IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { type FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection.pure";
import { RichTypeAny, RichTypeString } from "core/FlowGraph/flowGraphRichTypes.pure";

/**
 * Resolves a runtime object to its owning glTF node reference.
 * @param context active FlowGraph context
 * @param value runtime object, usually a picked primitive
 * @returns the owning node reference or the null reference
 */
export function GetInteractivityObjectReference(context: FlowGraphContext, value: object | undefined): string {
    let object = value as (object & { parent?: object }) | undefined;
    while (object) {
        const candidate = context.getObjectReference(object, "nodes");
        if (candidate?.startsWith("/nodes/")) {
            return candidate;
        }
        object = object.parent;
    }
    return "";
}

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
        this.value.setValue(GetInteractivityObjectReference(context, this.object.getValue(context)), context);
    }

    /** @returns the serialized class name */
    public override getClassName(): string {
        return "FlowGraphObjectReferenceBlock";
    }
}
