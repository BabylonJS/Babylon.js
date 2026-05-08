/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphGetVariableBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphGetVariableBlock.pure";

import { registerFlowGraphGetVariableBlock } from "./flowGraphGetVariableBlock.pure";
registerFlowGraphGetVariableBlock();
