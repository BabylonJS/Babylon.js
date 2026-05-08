/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import elbowBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./elbowBlock.pure";

import { RegisterMaterialsNodeBlocksElbowBlock } from "./elbowBlock.pure";
RegisterMaterialsNodeBlocksElbowBlock();
