/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import depthOfFieldBlurPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./depthOfFieldBlurPostProcess.pure";

import { RegisterDepthOfFieldBlurPostProcess } from "./depthOfFieldBlurPostProcess.pure";
RegisterDepthOfFieldBlurPostProcess();
