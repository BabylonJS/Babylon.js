/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphInterpolationBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphInterpolationBlock.pure";

import { registerFlowGraphInterpolationBlock } from "./flowGraphInterpolationBlock.pure";
registerFlowGraphInterpolationBlock();
