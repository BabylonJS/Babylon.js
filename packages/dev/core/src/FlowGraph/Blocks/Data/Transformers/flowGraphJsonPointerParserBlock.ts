import type { FlowGraphAssetType } from "core/FlowGraph/flowGraphAssetsContext";
import type { IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { FlowGraphPathConverterComponent } from "core/FlowGraph/flowGraphPathConverterComponent";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";
import type { IObjectAccessor } from "core/FlowGraph/typeDefinitions";
import type { IPathToObjectConverter } from "core/ObjectModel/objectModelInterfaces";

export interface IFlowGraphJsonPointerParserBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The JSON pointer to parse.
     */
    jsonPointer: string;
    /**
     * The path converter to use to convert the path to an object accessor.
     */
    pathConverter: IPathToObjectConverter<IObjectAccessor>;
    /**
     * Whether to output the value of the property.
     */
    outputValue?: boolean;
}

/**
 * This block will take a JSON pointer and parse it to get the value from the JSON object.
 * The output is an object and a property name.
 * Optionally, the block can also output the value of the property. This is configurable.
 */

export class FlowGraphJsonPointerParserBlock<P extends any, O extends FlowGraphAssetType> extends FlowGraphBlock {
    /**
     * Output connection: The object that contains the property.
     */
    public readonly object: FlowGraphDataConnection<O>;

    /**
     * Output connection: The property name.
     */
    public readonly propertyName: FlowGraphDataConnection<string>;

    /**
     * Output connection: The value of the property.
     */
    public readonly value: FlowGraphDataConnection<P>;

    /**
     * Output connection: Whether the value is valid.
     */
    public readonly isValid: FlowGraphDataConnection<boolean>;

    /**
     * The component with the templated inputs for the provided path.
     */
    public readonly templateComponent: FlowGraphPathConverterComponent;

    constructor(
        /**
         * the configuration of the block
         */
        public override config: IFlowGraphJsonPointerParserBlockConfiguration
    ) {
        super(config);
        this.object = this.registerDataOutput("object", RichTypeAny);
        this.propertyName = this.registerDataOutput("propertyName", RichTypeAny);
        this.isValid = this.registerDataOutput("isValid", RichTypeAny);
        if (config.outputValue) {
            this.value = this.registerDataOutput("value", RichTypeAny);
        }
        this.templateComponent = new FlowGraphPathConverterComponent(config.path, this);
    }

    public override _updateOutputs(context: FlowGraphContext) {
        try {
            const accessorContainer = this.templateComponent.getAccessor(this.config.pathConverter, context);
            const value = accessorContainer.info.get(accessorContainer.object);
            const object = accessorContainer.info.getObject(accessorContainer.object);
            const propertyName = accessorContainer.info.getPropertyName(accessorContainer.object);
            if (!object || !propertyName) {
                this.isValid.setValue(false, context);
                return;
            } else {
                this.object.setValue(object, context);
                this.propertyName.setValue(propertyName, context);
                this.isValid.setValue(true, context);
            }
            if (this.config.outputValue) {
                if (value === undefined) {
                    this.isValid.setValue(false, context);
                } else {
                    this.value.setValue(value, context);
                    this.isValid.setValue(true, context);
                }
            }
        } catch (e) {
            this.isValid.setValue(false, context);
            return;
        }
    }

    /**
     * Gets the class name of this block
     * @returns the class name
     */
    public override getClassName(): string {
        return FlowGraphJsonPointerParserBlock.ClassName;
    }

    /**
     * The name of the class
     */
    public static ClassName = "FlowGraphJsonPointerParserBlock";
}
