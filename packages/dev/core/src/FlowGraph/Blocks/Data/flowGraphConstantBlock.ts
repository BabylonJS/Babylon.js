import { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { getRichTypeFromValue } from "core/FlowGraph/flowGraphRichTypes";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { RegisterClass } from "../../../Misc/typeStore";
import { defaultValueSerializationFunction } from "core/FlowGraph/serialization";
/**
 * @experimental
 * Configuration for a constant block.
 */
export interface IFlowGraphConstantBlockConfiguration<T> extends IFlowGraphBlockConfiguration {
    /**
     * The value of the constant.
     */
    value: T;
}
/**
 * @experimental
 * Block that returns a constant value.
 */
export class FlowGraphConstantBlock<T> extends FlowGraphBlock {
    /**
     * Output connection: The constant value.
     */
    public readonly output: FlowGraphDataConnection<T>;

    constructor(public config: IFlowGraphConstantBlockConfiguration<T>) {
        super(config);

        this.output = this.registerDataOutput("output", getRichTypeFromValue(config.value));
    }

    public _updateOutputs(context: FlowGraphContext): void {
        this.output.setValue(this.config.value, context);
    }

    public getClassName(): string {
        return "FGConstantBlock";
    }

    public serialize(serializationObject: any = {}, valueSerializeFunction: (key: string, value: any, serializationObject: any) => any = defaultValueSerializationFunction) {
        super.serialize(serializationObject);
        valueSerializeFunction("value", this.config.value, serializationObject.config);
    }
}
RegisterClass("FGConstantBlock", FlowGraphConstantBlock);
