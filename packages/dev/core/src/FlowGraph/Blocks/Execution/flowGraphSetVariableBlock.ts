import { RegisterClass } from "core/Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../flowGraphExecutionBlockWithOutSignal";
import type { FlowGraphSignalConnection } from "../../flowGraphSignalConnection";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";

/**
 * The configuration of the FlowGraphGetVariableBlock.
 */
export interface IFlowGraphSetVariableBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The name of the variable to set.
     */
    variable: string;
}

/**
 * This block will set a variable on the context.
 */
export class FlowGraphSetVariableBlock<T> extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The value to set.
     */
    public readonly value: FlowGraphDataConnection<T>;

    constructor(config: IFlowGraphSetVariableBlockConfiguration) {
        super(config);

        this.value = this.registerDataInput("value", RichTypeAny);
    }

    public override _execute(context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        // check if there is an animation(group) running on this variable. If there is, stop the animation - a value was force-set.
        const currentlyRunningAnimationGroups = context._getGlobalContextVariable("currentlyRunningAnimationGroups", []) as number[];
        for (const animationUniqueId of currentlyRunningAnimationGroups) {
            const animation = context.assetsContext.animationGroups[animationUniqueId];
            // check if there is a target animation that has the target set to be the context
            for (const targetAnimation of animation.targetedAnimations) {
                if (targetAnimation.target === context) {
                    // check if the target property is the variable we are setting
                    if (targetAnimation.target === context) {
                        // check the variable name
                        if (targetAnimation.animation.targetProperty === this.config?.variable) {
                            // stop the animation
                            animation.stop();
                            // remove the animation from the currently running animations
                            const index = currentlyRunningAnimationGroups.indexOf(animationUniqueId);
                            if (index > -1) {
                                currentlyRunningAnimationGroups.splice(index, 1);
                            }
                            context._setGlobalContextVariable("currentlyRunningAnimationGroups", currentlyRunningAnimationGroups);
                            break;
                        }
                    }
                }
            }
        }
        context.setVariable(this.config?.variable, this.value.getValue(context));
        this.out._activateSignal(context);
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.SetVariable;
    }

    public override serialize(serializationObject?: any): void {
        super.serialize(serializationObject);
        serializationObject.config.variable = this.config?.variable;
    }
}

RegisterClass(FlowGraphBlockNames.SetVariable, FlowGraphSetVariableBlock);
