/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphApplyForceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphApplyForceBlock.pure";

import { registerFlowGraphApplyForceBlock } from "./flowGraphApplyForceBlock.pure";
registerFlowGraphApplyForceBlock();
