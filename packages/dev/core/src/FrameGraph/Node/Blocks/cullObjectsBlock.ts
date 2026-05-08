/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import cullObjectsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./cullObjectsBlock.pure";

import { registerCullObjectsBlock } from "./cullObjectsBlock.pure";
registerCullObjectsBlock();
