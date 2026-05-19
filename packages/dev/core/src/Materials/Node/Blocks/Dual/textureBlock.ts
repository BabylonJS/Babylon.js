/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import textureBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./textureBlock.pure";

import { RegisterTextureBlock } from "./textureBlock.pure";
RegisterTextureBlock();
