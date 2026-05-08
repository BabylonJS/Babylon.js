/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphWhileLoopBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphWhileLoopBlock.pure";

import { registerFlowGraphWhileLoopBlock } from "./flowGraphWhileLoopBlock.pure";
registerFlowGraphWhileLoopBlock();
