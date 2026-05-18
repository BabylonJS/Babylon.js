/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import motionBlurPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./motionBlurPostProcess.pure";

import { RegisterMotionBlurPostProcess } from "./motionBlurPostProcess.pure";
RegisterMotionBlurPostProcess();
