import { FlowGraphValueType } from "core/FlowGraph/flowGraphTypes";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";

/**
 * @experimental
 * Block that sets a property on a target object.
 * TODO: Add support for animating the property.
 */
export class FlowGraphSetPropertyBlock extends FlowGraphWithOnDoneExecutionBlock {
    public readonly target: FlowGraphDataConnection;
    public readonly property: FlowGraphDataConnection;
    public readonly value: FlowGraphDataConnection;

    public readonly outTarget: FlowGraphDataConnection;

    public constructor() {
        super();

        this.target = this._registerDataInput("target", FlowGraphValueType.Any);
        this.property = this._registerDataInput("property", FlowGraphValueType.String);
        this.value = this._registerDataInput("value", FlowGraphValueType.Any);

        this.outTarget = this._registerDataOutput("outTarget", FlowGraphValueType.Any);
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
}
