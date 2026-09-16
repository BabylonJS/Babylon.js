/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphKeyDownEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphKeyDownEventBlock.pure";

import { RegisterFlowGraphKeyDownEventBlock } from "./flowGraphKeyDownEventBlock.pure";
RegisterFlowGraphKeyDownEventBlock();
