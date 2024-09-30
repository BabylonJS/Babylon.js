import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../flowGraphExecutionBlockWithOutSignal";
import type { FlowGraphSignalConnection } from "../../flowGraphSignalConnection";
import { FlowGraphPathConverterComponent } from "../../flowGraphPathConverterComponent";
import { RegisterClass } from "core/Misc/typeStore";

/**
 * @experimental
 */
export interface IFlowGraphSetPropertyBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The complete path to the property that will be set
     */
    path: string;
}

export class FlowGraphSetPropertyBlock<T> extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * The class name of this block.
     */
    public static readonly ClassName = "FGSetPointerBlock";

    /**
     * Input connection: The value of the property.
     */
    public readonly value: FlowGraphDataConnection<T>;

    /**
     * The component with the templated inputs for the provided path.
     */
    public readonly templateComponent: FlowGraphPathConverterComponent;

    constructor(public override config: IFlowGraphSetPropertyBlockConfiguration) {
        super(config);
        this.value = this.registerDataInput("value", config.type);
        this.templateComponent = new FlowGraphPathConverterComponent(config.path, this);
    }

    public override _execute(context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        try {
            const value = this.value.getValue(context);
            const accessorContainer = this.templateComponent.getAccessor(this.config.pathConverter, context);
            accessorContainer.info.set(value, accessorContainer.object);
        } catch (e) {
            this.error._activateSignal(context);
        }
        this.out._activateSignal(context);
    }

    public override getClassName(): string {
        return FlowGraphSetPropertyBlock.ClassName;
    }

    public override serialize(serializationObject?: any): void {
        super.serialize(serializationObject);
        serializationObject.config.variable = this.config.variable;
    }
}

RegisterClass("FGSetPropertyBlock", FlowGraphSetPropertyBlock);
