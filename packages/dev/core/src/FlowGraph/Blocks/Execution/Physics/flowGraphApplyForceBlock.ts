/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphApplyForceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphApplyForceBlock.pure";

import { RegisterFlowGraphApplyForceBlock } from "./flowGraphApplyForceBlock.pure";
RegisterFlowGraphApplyForceBlock();
