/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphGetAngularVelocityBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphGetAngularVelocityBlock.pure";

import { RegisterFlowGraphGetAngularVelocityBlock } from "./flowGraphGetAngularVelocityBlock.pure";
RegisterFlowGraphGetAngularVelocityBlock();
