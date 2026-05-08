/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphArrayIndexBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphArrayIndexBlock.pure";

import { registerFlowGraphArrayIndexBlock } from "./flowGraphArrayIndexBlock.pure";
registerFlowGraphArrayIndexBlock();
