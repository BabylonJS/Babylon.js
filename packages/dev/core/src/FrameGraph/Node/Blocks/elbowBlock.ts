/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import elbowBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./elbowBlock.pure";

import { registerFrameGraphNodeBlocksElbowBlock } from "./elbowBlock.pure";
registerFrameGraphNodeBlocksElbowBlock();
