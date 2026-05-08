/** This file must only contain pure code and pure imports */

import { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { type FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection.pure";
import { getRichTypeFromValue } from "core/FlowGraph/flowGraphRichTypes.pure";
import { type IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { defaultValueSerializationFunction } from "core/FlowGraph/serialization";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RegisterClass } from "../../../Misc/typeStore";
/**
 * Configuration for a constant block.
 */
export interface IFlowGraphConstantBlockConfiguration<T> extends IFlowGraphBlockConfiguration {
    /**
     * The value of the constant.
     */
    value: T;
}
/**
 * Block that returns a constant value.
 */
export class FlowGraphConstantBlock<T> extends FlowGraphBlock {
    /**
     * Output connection: The constant value.
     */
    public readonly output: FlowGraphDataConnection<T>;

    constructor(
        /**
         * the configuration of the block
         */
        public override config: IFlowGraphConstantBlockConfiguration<T>
    ) {
        super(config);

        this.output = this.registerDataOutput("output", getRichTypeFromValue(config.value));
    }

    public override _updateOutputs(context: FlowGraphContext): void {
        this.output.setValue(this.config.value, context);
    }

    /**
     * Gets the class name of this block
     * @returns the class name
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.Constant;
    }

    /**
     * Serializes this block
     * @param serializationObject the object to serialize to
     * @param valueSerializeFunction the function to use to serialize the value
     */
    public override serialize(
        serializationObject: any = {},
        valueSerializeFunction: (key: string, value: any, serializationObject: any) => any = defaultValueSerializationFunction
    ) {
        super.serialize(serializationObject);
        valueSerializeFunction("value", this.config.value, serializationObject.config);
    }
}

let _registered = false;
export function registerFlowGraphConstantBlock(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    RegisterClass(FlowGraphBlockNames.Constant, FlowGraphConstantBlock);
}
