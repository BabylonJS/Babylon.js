/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphCancelDelayBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphCancelDelayBlock.pure";

import { registerFlowGraphCancelDelayBlock } from "./flowGraphCancelDelayBlock.pure";
registerFlowGraphCancelDelayBlock();
