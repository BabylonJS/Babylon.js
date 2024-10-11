import type { FlowGraphBlock } from "../flowGraphBlock";
import { FlowGraphBlockNames } from "./flowGraphBlockNames";

export function blockFactory(name: FlowGraphBlockNames): () => Promise<typeof FlowGraphBlock> {
    switch (name) {
        case FlowGraphBlockNames.PlayAnimation:
            return async () => (await import("./Execution/Animation/flowGraphPlayAnimationBlock")).FlowGraphPlayAnimationBlock;
        case FlowGraphBlockNames.StopAnimation:
            return async () => (await import("./Execution/Animation/flowGraphStopAnimationBlock")).FlowGraphStopAnimationBlock;
        case FlowGraphBlockNames.PauseAnimation:
            return async () => (await import("./Execution/Animation/flowGraphPauseAnimationBlock")).FlowGraphPauseAnimationBlock;
        case FlowGraphBlockNames.ValueInterpolation:
            return async () => (await import("./Execution/Animation/flowGraphInterpolationBlock")).FlowGraphInterpolationBlock;
        default:
            throw new Error(`Unknown block name: ${name}`);
    }
}
