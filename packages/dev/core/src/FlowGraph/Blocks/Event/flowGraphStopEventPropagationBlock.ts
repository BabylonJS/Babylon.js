/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphStopEventPropagationBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphStopEventPropagationBlock.pure";

import { RegisterFlowGraphStopEventPropagationBlock } from "./flowGraphStopEventPropagationBlock.pure";
RegisterFlowGraphStopEventPropagationBlock();
