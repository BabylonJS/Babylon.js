/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import debugBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./debugBlock.pure";

import { registerMaterialsNodeBlocksDebugBlock } from "./debugBlock.pure";
registerMaterialsNodeBlocksDebugBlock();
