import { RegisterClass } from "../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphContext } from "../../flowGraphContext";
import { RichTypeAny, RichTypeNumber } from "../../flowGraphRichTypes";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";

/**
 * @experimental
 */
export interface IFlowGraphGetPropertyBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The variable path of the entity whose property will be set. Needs a corresponding
     * entity on the context variables with that variable name.
     */
    path: string;
    /**
     * The property to set on the target object.
     */
    property: string;
    /**
     * A string that will be substituted by a node with the same name.
     */
    subString: string;
}

export class FlowGraphGetPropertyBlock extends FlowGraphBlock {
    public readonly value: FlowGraphDataConnection<any>;
    public constructor(public config: IFlowGraphGetPropertyBlockConfiguration) {
        super(config);
        this.value = this._registerDataOutput("value", RichTypeAny);
        this._registerDataInput(config.subString, RichTypeNumber);
    }

    public _updateOutputs(context: FlowGraphContext) {
        const target = context._getTargetFromPath(this.config.path, this.config.subString, this);
        const property = this.config.property;
        const value = target[property];
        this.value.setValue(value, context);
    }

    public getClassName(): string {
        return FlowGraphGetPropertyBlock.ClassName;
    }

    public static ClassName = "FGGetPropertyBlock";
}
RegisterClass(FlowGraphGetPropertyBlock.ClassName, FlowGraphGetPropertyBlock);
