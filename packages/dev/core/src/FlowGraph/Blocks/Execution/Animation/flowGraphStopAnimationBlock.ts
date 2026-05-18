/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphStopAnimationBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphStopAnimationBlock.pure";

import { RegisterFlowGraphStopAnimationBlock } from "./flowGraphStopAnimationBlock.pure";
RegisterFlowGraphStopAnimationBlock();
