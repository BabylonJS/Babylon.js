/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import glowLayerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./glowLayerBlock.pure";

import { RegisterGlowLayerBlock } from "./glowLayerBlock.pure";
RegisterGlowLayerBlock();
