/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphWaitAllBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphWaitAllBlock.pure";

import { registerFlowGraphWaitAllBlock } from "./flowGraphWaitAllBlock.pure";
registerFlowGraphWaitAllBlock();
