import { RegisterClass } from "../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphContext } from "../../flowGraphContext";
import { RichTypeAny, RichTypeBoolean } from "../../flowGraphRichTypes";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import type { IPathToObjectConverter } from "../../../ObjectModel/objectModelInterfaces";
import { FlowGraphPathConverterComponent } from "../../flowGraphPathConverterComponent";
import type { IObjectAccessor } from "../../typeDefinitions";

/**
 * @experimental
 */
export interface IFlowGraphGetPropertyBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The complete path to the property that will be set
     */
    path: string;
    /**
     * The path converter to use to convert the path to an object accessor.
     */
    pathConverter: IPathToObjectConverter<IObjectAccessor>;
}

/**
 * @experimental
 */
export class FlowGraphGetPointerBlock extends FlowGraphBlock {
    /**
     * Output connection: The value of the property.
     */
    public readonly value: FlowGraphDataConnection<any>;

    /**
     * Output connection: Whether the value is valid.
     */
    public readonly isValid: FlowGraphDataConnection<boolean>;
    /**
     * The component with the templated inputs for the provided path.
     */
    public readonly templateComponent: FlowGraphPathConverterComponent;

    public constructor(
        /**
         * the configuration of the block
         */
        public override config: IFlowGraphGetPropertyBlockConfiguration
    ) {
        super(config);
        this.value = this.registerDataOutput("value", RichTypeAny);
        this.isValid = this.registerDataOutput("isValid", RichTypeBoolean);
        this.templateComponent = new FlowGraphPathConverterComponent(config.path, this);
    }

    public override _updateOutputs(context: FlowGraphContext) {
        try {
            const accessorContainer = this.templateComponent.getAccessor(this.config.pathConverter, context);
            const value = accessorContainer.info.get(accessorContainer.object);
            if (value === undefined) {
                this.isValid.setValue(false, context);
            } else {
                this.value.setValue(value, context);
                this.isValid.setValue(true, context);
            }
        } catch (e) {
            this.value.resetToDefaultValue(context);
            this.isValid.setValue(false, context);
            return;
        }
    }

    /**
     * Gets the class name of this block
     * @returns the class name
     */
    public override getClassName(): string {
        return FlowGraphGetPointerBlock.ClassName;
    }

    /**
     * Serializes this block
     * @param serializationObject the object to serialize to
     */
    public override serialize(serializationObject: any = {}) {
        super.serialize(serializationObject);
        serializationObject.config.path = this.config.path;
    }

    /**
     * Class name of the block.
     */
    public static ClassName = "FGGetPropertyBlock";
}
RegisterClass(FlowGraphGetPointerBlock.ClassName, FlowGraphGetPointerBlock);
