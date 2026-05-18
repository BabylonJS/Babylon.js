/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphArrayIndexBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphArrayIndexBlock.pure";

import { RegisterFlowGraphArrayIndexBlock } from "./flowGraphArrayIndexBlock.pure";
RegisterFlowGraphArrayIndexBlock();
