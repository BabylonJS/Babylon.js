/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphBranchBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphBranchBlock.pure";

import { registerFlowGraphBranchBlock } from "./flowGraphBranchBlock.pure";
registerFlowGraphBranchBlock();
