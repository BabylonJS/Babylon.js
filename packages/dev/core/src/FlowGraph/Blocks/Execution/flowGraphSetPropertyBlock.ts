import { RichTypeAny } from "../../flowGraphRichTypes";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../flowGraphWithOnDoneExecutionBlock";
import { RegisterClass } from "../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import type { FlowGraphPath } from "../../flowGraphPath";
import { FlowGraphPathComponent } from "../../flowGraphPathComponent";

/**
 * @experimental
 * Configuration for the set property block.
 */
export interface IFlowGraphSetPropertyBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The path of the entity whose property will be set. Needs a corresponding
     * entity on the context variables.
     */
    path: FlowGraphPath;
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
    public readonly templateComponent: FlowGraphPathComponent;

    public constructor(public config: IFlowGraphSetPropertyBlockConfiguration) {
        super(config);

        this.a = this.registerDataInput("a", RichTypeAny);
        this.templateComponent = new FlowGraphPathComponent(config.path, this);
    }

    public _execute(context: FlowGraphContext): void {
        const value = this.a.getValue(context);
        this.templateComponent.setProperty(context, value);

        this.out._activateSignal(context);
    }

    public serialize(serializationObject: any = {}) {
        super.serialize(serializationObject);
        serializationObject.config.path = this.config.path.serialize();
    }

    public getClassName(): string {
        return FlowGraphSetPropertyBlock.ClassName;
    }

    public static ClassName = "FGSetPropertyBlock";
}
RegisterClass("FGSetPropertyBlock", FlowGraphSetPropertyBlock);
