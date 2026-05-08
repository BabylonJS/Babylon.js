/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphPointerUpEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPointerUpEventBlock.pure";

import { RegisterFlowGraphPointerUpEventBlock } from "./flowGraphPointerUpEventBlock.pure";
RegisterFlowGraphPointerUpEventBlock();
