/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphGetLinearVelocityBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphGetLinearVelocityBlock.pure";

import { RegisterFlowGraphGetLinearVelocityBlock } from "./flowGraphGetLinearVelocityBlock.pure";
RegisterFlowGraphGetLinearVelocityBlock();
