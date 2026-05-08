/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSendCustomEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSendCustomEventBlock.pure";

import { registerFlowGraphSendCustomEventBlock } from "./flowGraphSendCustomEventBlock.pure";
registerFlowGraphSendCustomEventBlock();
