/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphPointerDownEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPointerDownEventBlock.pure";

import { RegisterFlowGraphPointerDownEventBlock } from "./flowGraphPointerDownEventBlock.pure";
RegisterFlowGraphPointerDownEventBlock();
