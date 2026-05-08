/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphCounterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphCounterBlock.pure";

import { registerFlowGraphCounterBlock } from "./flowGraphCounterBlock.pure";
registerFlowGraphCounterBlock();
