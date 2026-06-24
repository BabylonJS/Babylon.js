/** This file must only contain pure code and pure imports */

import { type IFlowGraphBlockConfiguration, FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { type FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection.pure";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger.pure";
import { type FlowGraphNumber, getNumericValue } from "core/FlowGraph/utils";
import { type Nullable } from "core/types";
import { RegisterClass } from "core/Misc/typeStore";

/**
 * Configuration for the array index block.
 */
export interface IFlowGraphArrayIndexBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The index to select. Normally supplied by the `index` data input, but it can
     * also be set here so the glTF importer can route a static configuration value
     * (e.g. the `nodeIndex` of a KHR_node_selectability `event/onSelect`) into the block.
     */
    index?: FlowGraphNumber;
}

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
    constructor(public override config?: IFlowGraphArrayIndexBlockConfiguration) {
        super(config);

        this.array = this.registerDataInput("array", RichTypeAny);
        const defaultIndex = config?.index !== undefined ? new FlowGraphInteger(getNumericValue(config.index)) : new FlowGraphInteger(-1);
        this.index = this.registerDataInput("index", RichTypeAny, defaultIndex);
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

let _Registered = false;
/**
 * Register side effects for flowGraphArrayIndexBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphArrayIndexBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass(FlowGraphBlockNames.ArrayIndex, FlowGraphArrayIndexBlock);
}

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
