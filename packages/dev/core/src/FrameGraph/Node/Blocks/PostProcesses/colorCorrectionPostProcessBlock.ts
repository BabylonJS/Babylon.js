/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import colorCorrectionPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./colorCorrectionPostProcessBlock.pure";

import { RegisterColorCorrectionPostProcessBlock } from "./colorCorrectionPostProcessBlock.pure";
RegisterColorCorrectionPostProcessBlock();
