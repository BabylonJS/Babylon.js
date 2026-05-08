/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphConstantBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphConstantBlock.pure";

import { registerFlowGraphConstantBlock } from "./flowGraphConstantBlock.pure";
registerFlowGraphConstantBlock();
