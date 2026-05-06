import { type IFlowGraphBlockConfiguration, FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { type FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import { type FlowGraphNumber, getNumericValue } from "core/FlowGraph/utils";
import { type Nullable } from "core/types";

/**
 * This simple Util block takes an array as input and selects a single element from it.
 */
export class FlowGraphArrayIndexBlock<T = any> extends FlowGraphBlock {
    /**
     * Input connection: The array to select from.
     */
    public readonly array: FlowGraphDataConnection<T[]>;

    /**
     * Input connection: The index to select.
     */
    public readonly index: FlowGraphDataConnection<FlowGraphNumber>;

    /**
     * Output connection: The selected element.
     */
    public readonly value: FlowGraphDataConnection<Nullable<T>>;

    /**
     * Construct a FlowGraphArrayIndexBlock.
     * @param config construction parameters
     */
    constructor(public override config: IFlowGraphBlockConfiguration) {
        super(config);

        this.array = this.registerDataInput("array", RichTypeAny);
        this.index = this.registerDataInput("index", RichTypeAny, new FlowGraphInteger(-1));
        this.value = this.registerDataOutput("value", RichTypeAny);
    }

    /**
     * @internal
     */
    public override _updateOutputs(context: FlowGraphContext): void {
        const array = this.array.getValue(context);
        const rawIndex = this.index.getValue(context);
        // KHR_interactivity opaque-reference values feed in here as JSON-Pointer
        // ref strings (e.g. "/animations/0/") instead of plain integers. Extract
        // the trailing numeric segment as the index in that case. Undefined /
        // unconnected inputs short-circuit to a null output instead of crashing
        // ``getNumericValue`` on a missing ``.value`` property.
        let index: number;
        if (rawIndex === undefined || rawIndex === null) {
            this.value.setValue(null, context);
            return;
        }
        if (typeof rawIndex === "string") {
            const parsed = _ParseRefIndex(rawIndex);
            if (parsed === undefined) {
                this.value.setValue(null, context);
                return;
            }
            index = parsed;
        } else {
            index = getNumericValue(rawIndex);
        }
        if (array && index >= 0 && index < array.length) {
            this.value.setValue(array[index], context);
        } else {
            this.value.setValue(null, context);
        }
    }

    /**
     * Serializes this block
     * @param serializationObject the object to serialize to
     */
    public override serialize(serializationObject?: any): void {
        super.serialize(serializationObject);
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.ArrayIndex;
    }
}

RegisterClass(FlowGraphBlockNames.ArrayIndex, FlowGraphArrayIndexBlock);

/**
 * Extract the trailing numeric segment from a JSON-Pointer-shaped ref string,
 * e.g. ``/animations/0/`` → 0, ``/nodes/12`` → 12. Returns ``undefined`` if the
 * string does not match the expected ``/<container>/<index>(/?)`` shape.
 * @param ref the ref string to parse.
 * @returns the trailing integer segment, or ``undefined`` when the input is
 *          not a JSON-Pointer-shaped ref ending in an integer.
 */
function _ParseRefIndex(ref: string): number | undefined {
    if (ref.length === 0 || ref[0] !== "/") {
        return undefined;
    }
    const trimmed = ref.endsWith("/") ? ref.slice(0, -1) : ref;
    const lastSlash = trimmed.lastIndexOf("/");
    if (lastSlash < 0) {
        return undefined;
    }
    const tail = trimmed.substring(lastSlash + 1);
    if (tail.length === 0) {
        return undefined;
    }
    const parsed = Number(tail);
    return Number.isFinite(parsed) && Number.isInteger(parsed) ? parsed : undefined;
}
