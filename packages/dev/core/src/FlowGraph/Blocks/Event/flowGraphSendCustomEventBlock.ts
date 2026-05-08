/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSendCustomEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSendCustomEventBlock.pure";

import { RegisterFlowGraphSendCustomEventBlock } from "./flowGraphSendCustomEventBlock.pure";
RegisterFlowGraphSendCustomEventBlock();
