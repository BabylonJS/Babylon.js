import { FlowGraphBlock, type IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { type FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection.pure";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes.pure";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger.pure";
import { DelayReferencePrefix } from "./interactivityReferences";

/**
 * Configuration for adapting runtime delay indices to opaque references.
 */
export interface IFlowGraphDelayReferenceBlockConfiguration extends IFlowGraphBlockConfiguration {
    /** Whether to decode a reference into an index rather than encode an index. */
    decode?: boolean;
}

/**
 * Loader-local conversion between FlowGraph delay indices and KHR_interactivity references.
 */
export class FlowGraphDelayReferenceBlock extends FlowGraphBlock {
    /** Delay index or reference to convert. */
    public readonly input: FlowGraphDataConnection<unknown>;
    /** Converted reference or delay index; invalid references decode to -1. */
    public readonly value: FlowGraphDataConnection<string | FlowGraphInteger>;

    constructor(public override config: IFlowGraphDelayReferenceBlockConfiguration) {
        super(config);
        this.input = this.registerDataInput("input", RichTypeAny);
        this.value = this.registerDataOutput<string | FlowGraphInteger>("value", RichTypeAny, config.decode ? new FlowGraphInteger(-1) : "");
    }

    /** @internal */
    public override _updateOutputs(context: FlowGraphContext): void {
        const input = this.input.getValue(context);
        if (this.config.decode) {
            let index = -1;
            if (input instanceof FlowGraphInteger) {
                index = input.value;
            } else if (typeof input === "string" && input.startsWith(DelayReferencePrefix)) {
                const tail = input.substring(DelayReferencePrefix.length);
                if (/^(0|[1-9]\d*)$/.test(tail)) {
                    const parsed = Number(tail);
                    if (Number.isSafeInteger(parsed) && parsed <= 2147483647) {
                        index = parsed;
                    }
                }
            }
            this.value.setValue(new FlowGraphInteger(index), context);
        } else {
            const index = input instanceof FlowGraphInteger ? input.value : -1;
            this.value.setValue(index < 0 ? "" : DelayReferencePrefix + index, context);
        }
    }

    /** @returns the serialized class name */
    public override getClassName(): string {
        return "KHR_interactivity/FlowGraphDelayReferenceBlock";
    }
}
