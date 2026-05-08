/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphWaitAllBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphWaitAllBlock.pure";

import { RegisterFlowGraphWaitAllBlock } from "./flowGraphWaitAllBlock.pure";
RegisterFlowGraphWaitAllBlock();
