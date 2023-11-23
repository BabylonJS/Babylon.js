import { RichTypeAny, RichTypeNumber } from "../../flowGraphRichTypes";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";
import { RegisterClass } from "../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import type { FlowGraphPath } from "../../flowGraphPath";

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
export class FlowGraphSetPropertyBlock<ValueT> extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * Input connection: The value to set on the property.
     */
    public readonly value: FlowGraphDataConnection<ValueT>;
    public readonly templateStringInputs: FlowGraphDataConnection<number>[] = [];

    public constructor(public config: IFlowGraphSetPropertyBlockConfiguration) {
        super(config);

        this.value = this._registerDataInput("value", RichTypeAny);
        for (const templateString in config.path.templateSubstitutions) {
            this.templateStringInputs.push(this._registerDataInput(templateString, RichTypeNumber));
        }
    }

    public _execute(context: FlowGraphContext): void {
        for (const templateStringInput of this.templateStringInputs) {
            const templateStringValue = templateStringInput.getValue(context);
            const templateString = templateStringInput.name;
            this.config.path.addTemplateSubstitution(templateString, templateStringValue);
        }
        const value = this.value.getValue(context);
        this.config.path.setProperty(context, value);

        this.onDone._activateSignal(context);
    }

    public getClassName(): string {
        return "FGSetPropertyBlock";
    }
}
RegisterClass("FGSetPropertyBlock", FlowGraphSetPropertyBlock);
