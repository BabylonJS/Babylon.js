/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSetLinearVelocityBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSetLinearVelocityBlock.pure";

import { RegisterFlowGraphSetLinearVelocityBlock } from "./flowGraphSetLinearVelocityBlock.pure";
RegisterFlowGraphSetLinearVelocityBlock();
