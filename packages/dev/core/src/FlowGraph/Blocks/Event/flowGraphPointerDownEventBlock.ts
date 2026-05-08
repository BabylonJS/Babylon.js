/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphPointerDownEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPointerDownEventBlock.pure";

import { registerFlowGraphPointerDownEventBlock } from "./flowGraphPointerDownEventBlock.pure";
registerFlowGraphPointerDownEventBlock();
