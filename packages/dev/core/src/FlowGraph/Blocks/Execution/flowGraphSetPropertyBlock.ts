import { RichTypeAny, RichTypeNumber } from "../../flowGraphRichTypes";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";
import { RegisterClass } from "../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";

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
     * The property to set on the target object.
     */
    property: string;
    /**
     * A string that will be substituted by a node with the same name, if encountered enclosed by \{\}.
     * It will create an input data node which expects a number. The value of the node will be used
     * to substitute the string.
     */
    subString: string;
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

    public constructor(public config: IFlowGraphSetPropertyBlockConfiguration) {
        super(config);

        this.value = this._registerDataInput("value", RichTypeAny);
        this._registerDataInput(config.subString, RichTypeNumber);
    }

    private _setProperty(target: any, property: string, value: any): void {
        const splitProp = property.split(".");

        let currentTarget = target;
        for (let i = 0; i < splitProp.length - 1; i++) {
            currentTarget = currentTarget[splitProp[i]];
        }

        currentTarget[splitProp[splitProp.length - 1]] = value;
    }

    public _execute(context: FlowGraphContext): void {
        const target = context._getTargetFromPath(this.config.path, this.config.subString, this);
        const property = this.config.property;
        const value = this.value.getValue(context);

        if (target && property) {
            this._setProperty(target, property, value);
        } else {
            throw new Error("Invalid target or property");
        }

        this.onDone._activateSignal(context);
    }

    public getClassName(): string {
        return "FGSetPropertyBlock";
    }
}
RegisterClass("FGSetPropertyBlock", FlowGraphSetPropertyBlock);
