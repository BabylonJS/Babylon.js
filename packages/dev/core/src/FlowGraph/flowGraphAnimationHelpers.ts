import { type AnimationGroup } from "../Animations/animationGroup.pure";
import { type Observer } from "../Misc/observable.pure";
import { type FlowGraphContext } from "./flowGraphContext";
import { type FlowGraphPlayAnimationBlock } from "./Blocks/Execution/Animation/flowGraphPlayAnimationBlock.pure";

/** Observer ownership for animation groups started by FlowGraph. */
export interface IFlowGraphAnimationObserverSet {
    /** Block that owns the animation group. */
    block: FlowGraphPlayAnimationBlock;
    /** Group completion observer. */
    groupEnd: Observer<AnimationGroup>;
    /** Animation completion observer. */
    animationEnd: Observer<any>;
    /** Animation loop observer. */
    animationLoop: Observer<any>;
    /** Group loop observer. */
    groupLoop: Observer<AnimationGroup>;
}

/**
 * Removes observers owned by the play block that started an animation group.
 * @param context active FlowGraph context
 * @param animationGroup animation group being replaced or stopped
 * @returns the owning play block, when one was registered
 */
export function RemoveFlowGraphAnimationGroupObservers(context: FlowGraphContext, animationGroup: AnimationGroup): FlowGraphPlayAnimationBlock | undefined {
    const observerSets = context._getGlobalContextVariable("animationGroupObserverSets", new Map<number, IFlowGraphAnimationObserverSet>());
    const observers = observerSets.get(animationGroup.uniqueId);
    if (!observers) {
        return undefined;
    }
    animationGroup.onAnimationGroupEndObservable.remove(observers.groupEnd);
    animationGroup.onAnimationEndObservable.remove(observers.animationEnd);
    animationGroup.onAnimationLoopObservable.remove(observers.animationLoop);
    animationGroup.onAnimationGroupLoopObservable.remove(observers.groupLoop);
    observerSets.delete(animationGroup.uniqueId);
    context._setGlobalContextVariable("animationGroupObserverSets", observerSets);
    return observers.block;
}
