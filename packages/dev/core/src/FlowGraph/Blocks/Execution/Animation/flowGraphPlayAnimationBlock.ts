/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphPlayAnimationBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPlayAnimationBlock.pure";

import { registerFlowGraphPlayAnimationBlock } from "./flowGraphPlayAnimationBlock.pure";
registerFlowGraphPlayAnimationBlock();
