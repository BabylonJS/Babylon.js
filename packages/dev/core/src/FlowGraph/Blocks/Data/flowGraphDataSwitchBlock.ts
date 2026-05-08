/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphDataSwitchBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphDataSwitchBlock.pure";

import { registerFlowGraphDataSwitchBlock } from "./flowGraphDataSwitchBlock.pure";
registerFlowGraphDataSwitchBlock();
