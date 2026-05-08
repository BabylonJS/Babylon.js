/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphMultiGateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphMultiGateBlock.pure";

import { registerFlowGraphMultiGateBlock } from "./flowGraphMultiGateBlock.pure";
registerFlowGraphMultiGateBlock();
