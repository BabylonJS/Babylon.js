/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import prePassTextureBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./prePassTextureBlock.pure";

import { RegisterPrePassTextureBlock } from "./prePassTextureBlock.pure";
RegisterPrePassTextureBlock();
