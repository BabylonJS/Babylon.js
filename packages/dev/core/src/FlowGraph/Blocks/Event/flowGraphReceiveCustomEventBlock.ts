/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphReceiveCustomEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphReceiveCustomEventBlock.pure";

import { registerFlowGraphReceiveCustomEventBlock } from "./flowGraphReceiveCustomEventBlock.pure";
registerFlowGraphReceiveCustomEventBlock();
