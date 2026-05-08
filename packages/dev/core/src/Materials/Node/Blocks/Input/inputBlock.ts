/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import inputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./inputBlock.pure";

import { registerMaterialsNodeBlocksInputInputBlock } from "./inputBlock.pure";
registerMaterialsNodeBlocksInputInputBlock();
