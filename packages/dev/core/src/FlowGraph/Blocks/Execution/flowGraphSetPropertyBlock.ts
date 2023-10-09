import { RichTypeString, RichTypeAny } from "../../flowGraphRichTypes";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";
import { RegisterClass } from "../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";

/**
 * @experimental
 * Block that sets a property on a target object.
 * TODO: Add support for animating the property.
 */
export class FlowGraphSetPropertyBlock<TargetT, ValueT> extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * Input connection: The target object.
     */
    public readonly target: FlowGraphDataConnection<TargetT>;
    /**
     * Input connection: The property to set on the object.
     * Supports dot notation.
     */
    public readonly property: FlowGraphDataConnection<string>;
    /**
     * Input connection: The value to set on the property.
     */
    public readonly value: FlowGraphDataConnection<ValueT>;

    public constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);

        this.target = this._registerDataInput("target", RichTypeAny);
        this.property = this._registerDataInput("property", RichTypeString);
        this.value = this._registerDataInput("value", RichTypeAny);
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
        const target = this.target.getValue(context);
        const property = this.property.getValue(context);
        const value = this.value.getValue(context);

        if (target && property && value) {
            this._setProperty(target, property, value);
        } else {
            throw new Error("Invalid target, property or value.");
        }

        this.onDone._activateSignal(context);
    }

    public getClassName(): string {
        return "FGSetPropertyBlock";
    }
}
RegisterClass("FGSetPropertyBlock", FlowGraphSetPropertyBlock);
