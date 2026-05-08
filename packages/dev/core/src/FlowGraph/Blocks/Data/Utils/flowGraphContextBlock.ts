/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphContextBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphContextBlock.pure";

import { registerFlowGraphContextBlock } from "./flowGraphContextBlock.pure";
registerFlowGraphContextBlock();
