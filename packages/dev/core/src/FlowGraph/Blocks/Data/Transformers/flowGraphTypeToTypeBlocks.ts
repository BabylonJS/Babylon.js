/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphTypeToTypeBlocks.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphTypeToTypeBlocks.pure";

import { registerFlowGraphTypeToTypeBlocks } from "./flowGraphTypeToTypeBlocks.pure";
registerFlowGraphTypeToTypeBlocks();
