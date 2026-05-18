/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphDoNBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphDoNBlock.pure";

import { RegisterFlowGraphDoNBlock } from "./flowGraphDoNBlock.pure";
RegisterFlowGraphDoNBlock();
