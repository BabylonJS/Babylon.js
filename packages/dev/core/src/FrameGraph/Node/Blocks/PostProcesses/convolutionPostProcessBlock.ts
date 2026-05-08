/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import convolutionPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./convolutionPostProcessBlock.pure";

import { RegisterConvolutionPostProcessBlock } from "./convolutionPostProcessBlock.pure";
RegisterConvolutionPostProcessBlock();
