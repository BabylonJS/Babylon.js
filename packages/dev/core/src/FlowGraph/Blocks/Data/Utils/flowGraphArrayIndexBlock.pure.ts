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
        // An undefined or unconnected input short-circuits to a null output rather than crashing
        // `getNumericValue` on a missing `.value` property.
        if (rawIndex === undefined || rawIndex === null) {
            this.value.setValue(null, context);
            return;
        }
        // A string index is an opaque reference whose format the host environment owns, so ask it
        // which element the reference denotes.
        let index: number;
        if (typeof rawIndex === "string") {
            const decoded = context.decodeIndexReference(rawIndex);
            if (decoded === undefined) {
                this.value.setValue(null, context);
                return;
            }
            index = decoded;
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
