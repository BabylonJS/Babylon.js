/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSetAngularVelocityBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSetAngularVelocityBlock.pure";

import { RegisterFlowGraphSetAngularVelocityBlock } from "./flowGraphSetAngularVelocityBlock.pure";
RegisterFlowGraphSetAngularVelocityBlock();
