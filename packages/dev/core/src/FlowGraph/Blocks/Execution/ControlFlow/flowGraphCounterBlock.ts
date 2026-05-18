/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphCounterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphCounterBlock.pure";

import { RegisterFlowGraphCounterBlock } from "./flowGraphCounterBlock.pure";
RegisterFlowGraphCounterBlock();
