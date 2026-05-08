/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import blurPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./blurPostProcessBlock.pure";

import { registerBlurPostProcessBlock } from "./blurPostProcessBlock.pure";
registerBlurPostProcessBlock();
