/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphApplyImpulseBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphApplyImpulseBlock.pure";

import { registerFlowGraphApplyImpulseBlock } from "./flowGraphApplyImpulseBlock.pure";
registerFlowGraphApplyImpulseBlock();
