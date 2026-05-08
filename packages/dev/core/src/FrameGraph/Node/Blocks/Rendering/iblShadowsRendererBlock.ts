/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import iblShadowsRendererBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./iblShadowsRendererBlock.pure";

import { RegisterIblShadowsRendererBlock } from "./iblShadowsRendererBlock.pure";
RegisterIblShadowsRendererBlock();
