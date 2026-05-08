/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import reflectionTextureBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./reflectionTextureBlock.pure";

import { registerReflectionTextureBlock } from "./reflectionTextureBlock.pure";
registerReflectionTextureBlock();
