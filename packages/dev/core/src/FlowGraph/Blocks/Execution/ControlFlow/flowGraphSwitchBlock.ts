/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSwitchBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSwitchBlock.pure";

import { registerFlowGraphSwitchBlock } from "./flowGraphSwitchBlock.pure";
registerFlowGraphSwitchBlock();
