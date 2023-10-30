import { RichTypeAny } from "../../flowGraphRichTypes";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";
import { RegisterClass } from "../../../Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";

export interface IFlowGraphSetPropertyBlockConfiguration<TargetT> extends IFlowGraphBlockConfiguration {
    target: TargetT;
    path: string;
}
/**
 * @experimental
 * Block that sets a property on a target object.
 * TODO: Add support for animating the property.
 */
export class FlowGraphSetPropertyBlock<TargetT, ValueT> extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * Input connection: The value to set on the property.
     */
    public readonly value: FlowGraphDataConnection<ValueT>;

    public constructor(public config: IFlowGraphSetPropertyBlockConfiguration<TargetT>) {
        super(config);

        this.value = this._registerDataInput("value", RichTypeAny);
    }

    private _setProperty(target: any, path: string, value: any): void {
        const splitProp = path.split(".");

        let currentTarget = target;
        for (let i = 0; i < splitProp.length - 1; i++) {
            currentTarget = currentTarget[splitProp[i]];
        }

        currentTarget[splitProp[splitProp.length - 1]] = value;
    }

    public _execute(context: FlowGraphContext): void {
        const target = this.config.target;
        const path = this.config.path;
        const value = this.value.getValue(context);

        if (target !== undefined && path !== undefined) {
            this._setProperty(target, path, value);
        } else {
            throw new Error("Invalid target or property.");
        }

        this.onDone._activateSignal(context);
    }

    public getClassName(): string {
        return FlowGraphSetPropertyBlock.ClassName;
    }

    public static ClassName = "FGSetPropertyBlock";
}
RegisterClass("FGSetPropertyBlock", FlowGraphSetPropertyBlock);
