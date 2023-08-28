import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraph } from "../../flowGraph";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";

/**
 * @experimental
 * Block that sets a property on a target object.
 * TODO: Add support for animating the property.
 */
export class FlowGraphSetPropertyBlock<PropT> extends FlowGraphWithOnDoneExecutionBlock {
    public readonly target: FlowGraphDataConnection<any>;
    public readonly property: FlowGraphDataConnection<string>;
    public readonly value: FlowGraphDataConnection<PropT>;

    public readonly outTarget: FlowGraphDataConnection<any>;

    public constructor(graph: FlowGraph) {
        super(graph);

        this.target = this._registerDataInput("target", undefined);
        this.property = this._registerDataInput<string>("property", undefined);
        this.value = this._registerDataInput<PropT>("value", undefined);

        this.outTarget = this._registerDataOutput("outTarget", this.target);
    }

    private _setProperty(target: any, property: string, value: PropT): void {
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
        }

        this.onDone._activateSignal(context);
    }
}
