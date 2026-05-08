/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import screenSpaceCurvaturePostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./screenSpaceCurvaturePostProcess.pure";

import { registerScreenSpaceCurvaturePostProcess } from "./screenSpaceCurvaturePostProcess.pure";
registerScreenSpaceCurvaturePostProcess();
