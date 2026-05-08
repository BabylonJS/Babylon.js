/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSetVariableBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSetVariableBlock.pure";

import { registerFlowGraphSetVariableBlock } from "./flowGraphSetVariableBlock.pure";
registerFlowGraphSetVariableBlock();
