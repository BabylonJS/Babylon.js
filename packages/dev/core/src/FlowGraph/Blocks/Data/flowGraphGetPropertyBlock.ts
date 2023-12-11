import { RegisterClass } from "../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphContext } from "../../flowGraphContext";
import { RichTypeAny } from "../../flowGraphRichTypes";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import type { IPathToObjectConverter } from "../../../ObjectModel/objectModelInterfaces";
import { FlowGraphPathConverterComponent } from "../../flowGraphPathConverterComponent";

/**
 * @experimental
 */
export interface IFlowGraphGetPropertyBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The variable path of the entity whose property will be set. Needs a corresponding
     * entity on the context variables with that variable name.
     */
    path: string;
    pathAccessor: IPathToObjectConverter;
}

export class FlowGraphGetPropertyBlock extends FlowGraphBlock {
    public readonly value: FlowGraphDataConnection<any>;
    public readonly templateComponent: FlowGraphPathConverterComponent;

    public constructor(public config: IFlowGraphGetPropertyBlockConfiguration) {
        super(config);
        this.value = this.registerDataOutput("value", RichTypeAny);
        this.templateComponent = new FlowGraphPathConverterComponent(config.pathAccessor, config.path, this);
    }

    public _updateOutputs(context: FlowGraphContext) {
        const accessorContainer = this.templateComponent.getAccessor(context);
        if (!accessorContainer) {
            throw new Error("Get property block requires a valid path");
        }
        const value = accessorContainer.accessor.get(accessorContainer.object);
        this.value.setValue(value, context);
    }

    public getClassName(): string {
        return FlowGraphGetPropertyBlock.ClassName;
    }

    public static ClassName = "FGGetPropertyBlock";
}
RegisterClass(FlowGraphGetPropertyBlock.ClassName, FlowGraphGetPropertyBlock);
