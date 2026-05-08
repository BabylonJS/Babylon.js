/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphForLoopBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphForLoopBlock.pure";

import { registerFlowGraphForLoopBlock } from "./flowGraphForLoopBlock.pure";
registerFlowGraphForLoopBlock();
