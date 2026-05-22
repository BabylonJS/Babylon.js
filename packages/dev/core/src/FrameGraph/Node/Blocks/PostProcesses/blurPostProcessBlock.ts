/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import blurPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./blurPostProcessBlock.pure";

import { RegisterBlurPostProcessBlock } from "./blurPostProcessBlock.pure";
RegisterBlurPostProcessBlock();
