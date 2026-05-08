/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSequenceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSequenceBlock.pure";

import { registerFlowGraphSequenceBlock } from "./flowGraphSequenceBlock.pure";
registerFlowGraphSequenceBlock();
