import type { IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import type { FlowGraphNumber } from "core/FlowGraph/utils";
import { getNumericValue } from "core/FlowGraph/utils";
import type { Nullable } from "core/types";

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
        const index = getNumericValue(this.index.getValue(context));
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
