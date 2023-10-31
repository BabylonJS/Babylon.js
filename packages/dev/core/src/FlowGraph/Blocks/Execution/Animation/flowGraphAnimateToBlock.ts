/*import { IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphSignalConnection } from "core/FlowGraph/flowGraphSignalConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "core/FlowGraph/flowGraphWithOnDoneExecutionBlock";
import { RegisterClass } from "core/Misc";
import { Animation } from "core/Animations";

export interface IFlowGraphAnimateToBlockConfiguration<TargetT> extends IFlowGraphBlockConfiguration {
    target: TargetT;
    path: string;
    easingType: string;
    easingDuration: number;
}

export class FlowGraphAnimateToBlock<TargetT, ValueT> extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * The value to animate to
     */
/*public readonly a: FlowGraphDataConnection<ValueT>;

    public constructor(public config: IFlowGraphAnimateToBlockConfiguration<TargetT>) {
        super(config);

        this.a = this._registerDataInput("a", RichTypeAny);
    }

    public _execute(context: FlowGraphContext): void {
        const target = this.config.target;
        const path = this.config.path;
        const a = this.a.getValue(context);
        const easingType = this.config.easingType;
        const easingDuration = this.config.easingDuration;

        if (target !== undefined && path !== undefined) {
            const scene = context.configuration.scene;
            Animation.CreateAndStartAnimation("flowGraphAnimateToBlock", target, path, 60, easingDuration * 60, 0, easingDuration * 60, 0);
        } else {
            throw new Error("Invalid target or path.");
        }
    }

    public getClassName(): string {
        return FlowGraphAnimateToBlock.ClassName;
    }

    public static ClassName = "FGAnimateToBlock";
}
RegisterClass(FlowGraphAnimateToBlock.ClassName, FlowGraphAnimateToBlock);*/
