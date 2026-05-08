/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import reflectionTextureBaseBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./reflectionTextureBaseBlock.pure";

import { registerReflectionTextureBaseBlock } from "./reflectionTextureBaseBlock.pure";
registerReflectionTextureBaseBlock();
