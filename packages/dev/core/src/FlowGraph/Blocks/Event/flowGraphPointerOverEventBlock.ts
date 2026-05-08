/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphPointerOverEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPointerOverEventBlock.pure";

import { RegisterFlowGraphPointerOverEventBlock } from "./flowGraphPointerOverEventBlock.pure";
RegisterFlowGraphPointerOverEventBlock();
