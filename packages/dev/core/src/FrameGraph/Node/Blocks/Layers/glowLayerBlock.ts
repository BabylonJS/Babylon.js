/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import glowLayerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./glowLayerBlock.pure";

import { registerGlowLayerBlock } from "./glowLayerBlock.pure";
registerGlowLayerBlock();
