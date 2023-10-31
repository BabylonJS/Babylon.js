import type { IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphWithOnDoneExecutionBlock } from "core/FlowGraph/flowGraphWithOnDoneExecutionBlock";
import { RegisterClass } from "core/Misc";
import { Animation, CircleEase } from "core/Animations";

export interface IFlowGraphAnimateToBlockConfiguration extends IFlowGraphBlockConfiguration {
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
    easingType: string;
    easingDuration: number;
}

export class FlowGraphAnimateToBlock<ValueT> extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * The value to animate to
     */
    public readonly a: FlowGraphDataConnection<ValueT>;

    public constructor(public config: IFlowGraphAnimateToBlockConfiguration) {
        super(config);

        this.a = this._registerDataInput("a", RichTypeAny);
    }

    private _getTargetFromPath(context: FlowGraphContext) {
        const path = this.config.path;
        let finalPath = path;
        if (path.indexOf(this.config.subString) !== -1) {
            const nodeSub = this.getDataInput(this.config.subString);
            if (!nodeSub) {
                throw new Error("Invalid substitution input");
            }
            const nodeIndex = Math.floor(nodeSub.getValue(context));
            finalPath = path.replace(this.config.subString, nodeIndex.toString());
        }
        return context.pathMap.get(finalPath);
    }

    public getEasingFunctionFromEasingType(easingType: string) {
        // todo fill the function
        return new CircleEase();
    }

    public _execute(context: FlowGraphContext): void {
        const target = this._getTargetFromPath(context);
        const path = this.config.path;
        const a = this.a.getValue(context);
        const easingType = this.config.easingType;
        const easingDuration = this.config.easingDuration;
        const fps = 60;
        const numFrames = easingDuration * fps;
        const easing = this.getEasingFunctionFromEasingType(easingType);

        if (target !== undefined && path !== undefined) {
            Animation.CreateAndStartAnimation("flowGraphAnimateToBlock", target, path, fps, numFrames, target[path], a, 0, easing);
        } else {
            throw new Error("Invalid target or path.");
        }
    }

    public getClassName(): string {
        return FlowGraphAnimateToBlock.ClassName;
    }

    public static ClassName = "FGAnimateToBlock";
}
RegisterClass(FlowGraphAnimateToBlock.ClassName, FlowGraphAnimateToBlock);
