/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphIsSoundPlayingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphIsSoundPlayingBlock.pure";

import { registerFlowGraphIsSoundPlayingBlock } from "./flowGraphIsSoundPlayingBlock.pure";
registerFlowGraphIsSoundPlayingBlock();
