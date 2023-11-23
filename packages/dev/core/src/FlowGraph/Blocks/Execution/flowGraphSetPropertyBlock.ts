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
    public readonly a: FlowGraphDataConnection<ValueT>;
    /**
     * Input connection: The template strings to substitute in the path.
     */
    public readonly templateStringInputs: FlowGraphDataConnection<number>[] = [];

    public constructor(public config: IFlowGraphSetPropertyBlockConfiguration) {
        super(config);

        this.a = this._registerDataInput("value", RichTypeAny);
        for (const templateString of config.path.getTemplateStrings()) {
            this.templateStringInputs.push(this._registerDataInput(templateString, RichTypeNumber));
        }
    }

    public _execute(context: FlowGraphContext): void {
        for (const templateStringInput of this.templateStringInputs) {
            const templateStringValue = templateStringInput.getValue(context);
            const templateString = templateStringInput.name;
            this.config.path.setTemplateSubstitution(templateString, templateStringValue);
        }
        const value = this.a.getValue(context);
        this.config.path.setProperty(context, value);

        this.out._activateSignal(context);
    }

    public getClassName(): string {
        return FlowGraphSetPropertyBlock.ClassName;
    }

    public static ClassName = "FGSetPropertyBlock";
}
RegisterClass("FGSetPropertyBlock", FlowGraphSetPropertyBlock);
