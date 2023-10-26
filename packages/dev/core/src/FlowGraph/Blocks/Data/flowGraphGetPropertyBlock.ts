import { RegisterClass } from "core/Misc";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphContext } from "../../flowGraphContext";
import { RichTypeAny } from "../../flowGraphRichTypes";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";

export interface IFlowGraphGetPropertyBlockConfiguration extends IFlowGraphBlockConfiguration {
    path: string;
    target: any;
}

export class FlowGraphGetPropertyBlock extends FlowGraphBlock {
    public readonly value: FlowGraphDataConnection<any>;
    public constructor(public config: IFlowGraphGetPropertyBlockConfiguration) {
        super(config);
        this.value = this._registerDataOutput("value", RichTypeAny);
    }

    public _updateOutputs(context: FlowGraphContext) {
        const path = this.config.path;
        const target = this.config.target;
        const value = target[path];
        this.value.setValue(context, value);
    }

    public getClassName(): string {
        return FlowGraphGetPropertyBlock.ClassName;
    }

    public static ClassName = "FGGetPropertyBlock";
}
RegisterClass(FlowGraphGetPropertyBlock.ClassName, FlowGraphGetPropertyBlock);
