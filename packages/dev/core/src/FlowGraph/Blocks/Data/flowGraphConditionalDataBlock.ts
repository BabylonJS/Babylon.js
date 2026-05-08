/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphConditionalDataBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphConditionalDataBlock.pure";

import { registerFlowGraphConditionalDataBlock } from "./flowGraphConditionalDataBlock.pure";
registerFlowGraphConditionalDataBlock();
