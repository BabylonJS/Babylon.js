/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphPointerOutEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPointerOutEventBlock.pure";

import { RegisterFlowGraphPointerOutEventBlock } from "./flowGraphPointerOutEventBlock.pure";
RegisterFlowGraphPointerOutEventBlock();
