/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphPointerOutEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPointerOutEventBlock.pure";

import { registerFlowGraphPointerOutEventBlock } from "./flowGraphPointerOutEventBlock.pure";
registerFlowGraphPointerOutEventBlock();
