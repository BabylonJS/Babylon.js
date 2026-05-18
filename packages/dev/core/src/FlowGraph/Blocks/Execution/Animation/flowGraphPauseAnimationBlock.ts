/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphPauseAnimationBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPauseAnimationBlock.pure";

import { RegisterFlowGraphPauseAnimationBlock } from "./flowGraphPauseAnimationBlock.pure";
RegisterFlowGraphPauseAnimationBlock();
