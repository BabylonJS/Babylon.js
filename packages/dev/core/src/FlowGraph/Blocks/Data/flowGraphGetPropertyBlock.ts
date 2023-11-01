import { RegisterClass } from "core/Misc";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphContext } from "../../flowGraphContext";
import { RichTypeAny, RichTypeNumber } from "../../flowGraphRichTypes";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";

export interface IFlowGraphGetPropertyBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The path of the entity whose property will be set. Needs a corresponding
     * entity on the context.pathMap variable.
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

    private _getTargetFromPath(context: FlowGraphContext) {
        const path = this.config.path;
        let finalPath = path;
        if (this.config.subString && path.indexOf(this.config.subString) !== -1) {
            const nodeSub = this.getDataInput(this.config.subString);
            if (!nodeSub) {
                throw new Error("Invalid substitution input");
            }
            const nodeIndex = Math.floor(nodeSub.getValue(context));
            finalPath = path.replace(this.config.subString, nodeIndex.toString());
        }
        return context.pathMap.get(finalPath);
    }

    public _updateOutputs(context: FlowGraphContext) {
        const target = this._getTargetFromPath(context);
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
