/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import cullObjectsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./cullObjectsBlock.pure";

import { RegisterCullObjectsBlock } from "./cullObjectsBlock.pure";
RegisterCullObjectsBlock();
