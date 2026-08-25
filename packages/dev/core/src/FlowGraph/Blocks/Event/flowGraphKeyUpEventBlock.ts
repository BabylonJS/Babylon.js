/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphKeyUpEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphKeyUpEventBlock.pure";

import { RegisterFlowGraphKeyUpEventBlock } from "./flowGraphKeyUpEventBlock.pure";
RegisterFlowGraphKeyUpEventBlock();
