/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import motionBlurPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./motionBlurPostProcessBlock.pure";

import { registerMotionBlurPostProcessBlock } from "./motionBlurPostProcessBlock.pure";
registerMotionBlurPostProcessBlock();
