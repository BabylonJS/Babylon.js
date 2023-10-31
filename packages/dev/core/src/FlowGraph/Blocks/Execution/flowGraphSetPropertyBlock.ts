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
     * entity on the context.pathMap variable.
     */
    path: string;
    /**
     * The property to set on the target object.
     */
    property: string;
}

const nodeIndexSubString = "{nodeIndex}";

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
     * Input connection: an index to use when setting the property. Will be substituted in any path
     * that contains a value of \{nodeIndex\}.
     */
    public readonly nodeIndex: FlowGraphDataConnection<number>;

    public constructor(public config: IFlowGraphSetPropertyBlockConfiguration) {
        super(config);

        this.a = this._registerDataInput("a", RichTypeAny);
        this.nodeIndex = this._registerDataInput("nodeIndex", RichTypeNumber);
    }

    private _setProperty(target: any, path: string, value: any): void {
        const splitProp = path.split(".");

        let currentTarget = target;
        for (let i = 0; i < splitProp.length - 1; i++) {
            currentTarget = currentTarget[splitProp[i]];
        }

        currentTarget[splitProp[splitProp.length - 1]] = value;
    }

    private _getTargetFromPath(context: FlowGraphContext) {
        const path = this.config.path;
        let finalPath = path;
        if (path.indexOf(nodeIndexSubString) !== -1) {
            const nodeIndex = Math.floor(this.nodeIndex.getValue(context));
            finalPath = path.replace(nodeIndexSubString, nodeIndex.toString());
        }
        return context.pathMap.get(finalPath);
    }

    public _execute(context: FlowGraphContext): void {
        const target = this._getTargetFromPath(context);
        const property = this.config.property;
        const value = this.a.getValue(context);

        if (target && property) {
            this._setProperty(target, property, value);
        } else {
            throw new Error("Invalid target or property");
        }

        this.onDone._activateSignal(context);
    }

    public getClassName(): string {
        return FlowGraphSetPropertyBlock.ClassName;
    }

    public static ClassName = "FGSetPropertyBlock";
}
RegisterClass("FGSetPropertyBlock", FlowGraphSetPropertyBlock);
