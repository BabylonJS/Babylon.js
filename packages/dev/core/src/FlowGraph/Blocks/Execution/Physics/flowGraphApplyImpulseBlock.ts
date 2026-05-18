/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphApplyImpulseBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphApplyImpulseBlock.pure";

import { RegisterFlowGraphApplyImpulseBlock } from "./flowGraphApplyImpulseBlock.pure";
RegisterFlowGraphApplyImpulseBlock();
