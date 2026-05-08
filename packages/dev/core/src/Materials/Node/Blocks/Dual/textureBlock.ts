/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import textureBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./textureBlock.pure";

import { registerTextureBlock } from "./textureBlock.pure";
registerTextureBlock();
