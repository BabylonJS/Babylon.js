/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphPointerOverEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPointerOverEventBlock.pure";

import { registerFlowGraphPointerOverEventBlock } from "./flowGraphPointerOverEventBlock.pure";
registerFlowGraphPointerOverEventBlock();
