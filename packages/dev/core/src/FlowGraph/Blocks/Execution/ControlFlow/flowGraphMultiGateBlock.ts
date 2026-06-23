/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphMultiGateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphMultiGateBlock.pure";

import { RegisterFlowGraphMultiGateBlock } from "./flowGraphMultiGateBlock.pure";
RegisterFlowGraphMultiGateBlock();
