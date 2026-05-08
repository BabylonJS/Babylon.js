/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import depthOfFieldBlurPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./depthOfFieldBlurPostProcess.pure";

import { registerDepthOfFieldBlurPostProcess } from "./depthOfFieldBlurPostProcess.pure";
registerDepthOfFieldBlurPostProcess();
