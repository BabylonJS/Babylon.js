import { RegisterClass } from "../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphContext } from "../../flowGraphContext";
import { RichTypeAny } from "../../flowGraphRichTypes";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphPathComponent } from "../../flowGraphPathComponent";
import type { FlowGraphPath } from "../../flowGraphPath";

/**
 * @experimental
 */
export interface IFlowGraphGetPropertyBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The variable path of the entity whose property will be set. Needs a corresponding
     * entity on the context variables with that variable name.
     */
    path: FlowGraphPath;
}

export class FlowGraphGetPropertyBlock extends FlowGraphBlock {
    public readonly value: FlowGraphDataConnection<any>;
    public readonly templateComponent: FlowGraphPathComponent;

    public constructor(public config: IFlowGraphGetPropertyBlockConfiguration) {
        super(config);
        this.value = this.registerDataOutput("value", RichTypeAny);
        this.templateComponent = new FlowGraphPathComponent(config.path, this);
    }

    public _updateOutputs(context: FlowGraphContext) {
        const value = this.templateComponent.getProperty(context);
        this.value.setValue(value, context);
    }

    public getClassName(): string {
        return FlowGraphGetPropertyBlock.ClassName;
    }

    public static ClassName = "FGGetPropertyBlock";
}
RegisterClass(FlowGraphGetPropertyBlock.ClassName, FlowGraphGetPropertyBlock);
