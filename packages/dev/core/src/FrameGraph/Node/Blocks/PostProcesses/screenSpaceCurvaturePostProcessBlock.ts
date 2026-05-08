/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import screenSpaceCurvaturePostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./screenSpaceCurvaturePostProcessBlock.pure";

import { registerScreenSpaceCurvaturePostProcessBlock } from "./screenSpaceCurvaturePostProcessBlock.pure";
registerScreenSpaceCurvaturePostProcessBlock();
