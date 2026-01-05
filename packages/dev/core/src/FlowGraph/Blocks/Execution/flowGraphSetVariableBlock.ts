import { RegisterClass } from "core/Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import type { FlowGraphContext } from "../../flowGraphContext";
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
    variable?: string;

    /**
     * The name of the variables to set.
     */
    variables?: string[];
}

/**
 * This block will set a variable on the context.
 */
export class FlowGraphSetVariableBlock<T> extends FlowGraphExecutionBlockWithOutSignal {
    constructor(config: IFlowGraphSetVariableBlockConfiguration) {
        super(config);
        // check if the variable is defined
        if (!config.variable && !config.variables) {
            throw new Error("FlowGraphSetVariableBlock: variable/variables is not defined");
        }
        // check if the variable is an array
        if (config.variables && config.variable) {
            throw new Error("FlowGraphSetVariableBlock: variable and variables are both defined");
        }
        // check if we have either a variable or variables. If we have variables, set the inputs correctly
        if (config.variables) {
            for (const variable of config.variables) {
                this.registerDataInput(variable, RichTypeAny);
            }
        } else {
            this.registerDataInput("value", RichTypeAny);
        }
    }

    public override _execute(context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        if (this.config?.variables) {
            for (const variable of this.config.variables) {
                this._saveVariable(context, variable);
            }
        } else {
            this._saveVariable(context, this.config?.variable, "value");
        }
        this.out._activateSignal(context);
    }

    private _saveVariable(context: FlowGraphContext, variableName: string, inputName?: string): void {
        // check if there is an animation(group) running on this variable. If there is, stop the animation - a value was force-set.
        const currentlyRunningAnimationGroups = context._getGlobalContextVariable("currentlyRunningAnimationGroups", []) as number[];
        for (const animationUniqueId of currentlyRunningAnimationGroups) {
            const animationGroup = context.assetsContext.animationGroups.find((animationGroup) => animationGroup.uniqueId == animationUniqueId);
            if (animationGroup) {
                // check if there is a target animation that has the target set to be the context
                for (const targetAnimation of animationGroup.targetedAnimations) {
                    // check if the target property is the variable we are setting
                    if (targetAnimation.target === context) {
                        // check the variable name
                        if (targetAnimation.animation.targetProperty === variableName) {
                            // stop the animation
                            animationGroup.stop();
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
        const value = this.getDataInput(inputName || variableName)?.getValue(context);
        context.setVariable(variableName, value);
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
