/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import iblShadowsRendererBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./iblShadowsRendererBlock.pure";

import { registerIblShadowsRendererBlock } from "./iblShadowsRendererBlock.pure";
registerIblShadowsRendererBlock();
