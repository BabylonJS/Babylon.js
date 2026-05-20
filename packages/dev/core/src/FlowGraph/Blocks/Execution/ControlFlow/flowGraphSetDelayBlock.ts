/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSetDelayBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSetDelayBlock.pure";

import { RegisterFlowGraphSetDelayBlock } from "./flowGraphSetDelayBlock.pure";
RegisterFlowGraphSetDelayBlock();
