/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import elbowBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./elbowBlock.pure";

import { registerMaterialsNodeBlocksElbowBlock } from "./elbowBlock.pure";
registerMaterialsNodeBlocksElbowBlock();
