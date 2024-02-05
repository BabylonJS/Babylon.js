import { RichTypeAny } from "../../flowGraphRichTypes";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../flowGraphExecutionBlockWithOutSignal";
import { RegisterClass } from "../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphPathConverterComponent } from "../../flowGraphPathConverterComponent";
import type { IPathToObjectConverter } from "../../../ObjectModel/objectModelInterfaces";
import type { IObjectAccessor } from "../../typeDefinitions";

/**
 * @experimental
 * Configuration for the set property block.
 */
export interface IFlowGraphSetPropertyBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The path of the entity whose property will be set. Needs a corresponding
     * entity on the context variables.
     */
    path: string;
    /**
     * The path converter to use to convert the path to an object accessor.
     */
    pathConverter: IPathToObjectConverter<IObjectAccessor>;
}

/**
 * @experimental
 * Block that sets a property on a target object.
 */
export class FlowGraphSetPropertyBlock<ValueT> extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The value to set on the property.
     */
    public readonly a: FlowGraphDataConnection<ValueT>;
    /**
     * The component with the templated inputs for the provided path.
     */
    public readonly templateComponent: FlowGraphPathConverterComponent;

    public constructor(
        /**
         * the configuration of the block
         */
        public config: IFlowGraphSetPropertyBlockConfiguration
    ) {
        super(config);

        this.a = this.registerDataInput("a", RichTypeAny);
        this.templateComponent = new FlowGraphPathConverterComponent(config.path, this);
    }

    public _execute(context: FlowGraphContext): void {
        const value = this.a.getValue(context);
        const accessor = this.templateComponent.getAccessor(this.config.pathConverter, context);
        accessor.info.set(value, accessor.object);

        this.out._activateSignal(context);
    }

    /**
     * Serializes the block to a JSON object.
     * @param serializationObject the object to serialize to.
     */
    public serialize(serializationObject: any = {}) {
        super.serialize(serializationObject);
        serializationObject.config.path = this.config.path;
    }

    /**
     * @returns class name of the block.
     */
    public getClassName(): string {
        return FlowGraphSetPropertyBlock.ClassName;
    }

    /**
     * Class name of the block.
     */
    public static ClassName = "FGSetPropertyBlock";
}
RegisterClass("FGSetPropertyBlock", FlowGraphSetPropertyBlock);
