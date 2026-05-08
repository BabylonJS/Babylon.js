/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphIndexOfBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphIndexOfBlock.pure";

import { registerFlowGraphIndexOfBlock } from "./flowGraphIndexOfBlock.pure";
registerFlowGraphIndexOfBlock();
