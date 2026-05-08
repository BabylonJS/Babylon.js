/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphPointerMoveEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPointerMoveEventBlock.pure";

import { registerFlowGraphPointerMoveEventBlock } from "./flowGraphPointerMoveEventBlock.pure";
registerFlowGraphPointerMoveEventBlock();
