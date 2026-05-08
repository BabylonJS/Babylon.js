/** This file must only contain pure code and pure imports */

import { type IFlowGraphBlockConfiguration, FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { type FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection.pure";
import { RichTypeAny, RichTypeFlowGraphInteger } from "core/FlowGraph/flowGraphRichTypes.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger.pure";
import { RegisterClass } from "core/Misc/typeStore";

/**
 * This block takes an object as input and an array and returns the index of the object in the array.
 */
export class FlowGraphIndexOfBlock<T = any> extends FlowGraphBlock {
    /**
     * Input connection: The object to find in the array.
     */
    public readonly object: FlowGraphDataConnection<T>;

    /**
     * Input connection: The array to search in.
     */
    public readonly array: FlowGraphDataConnection<T[]>;

    /**
     * Output connection: The index of the object in the array.
     * -1 if not found!
     */
    public readonly index: FlowGraphDataConnection<FlowGraphInteger>;

    /**
     * Construct a FlowGraphIndexOfBlock.
     * @param config construction parameters
     */
    constructor(public override config: IFlowGraphBlockConfiguration) {
        super(config);

        this.object = this.registerDataInput("object", RichTypeAny);
        this.array = this.registerDataInput("array", RichTypeAny);
        this.index = this.registerDataOutput("index", RichTypeFlowGraphInteger, new FlowGraphInteger(-1));
    }

    /**
     * @internal
     */
    public override _updateOutputs(context: FlowGraphContext): void {
        const object = this.object.getValue(context);
        const array = this.array.getValue(context);
        if (array) {
            this.index.setValue(new FlowGraphInteger(array.indexOf(object)), context);
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
        return FlowGraphBlockNames.IndexOf;
    }
}

let _Registered = false;
/**
 * Register side effects for flowGraphIndexOfBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphIndexOfBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass(FlowGraphBlockNames.IndexOf, FlowGraphIndexOfBlock);
}
