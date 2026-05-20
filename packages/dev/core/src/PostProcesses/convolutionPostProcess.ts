/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import convolutionPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./convolutionPostProcess.pure";

import { RegisterConvolutionPostProcess } from "./convolutionPostProcess.pure";
RegisterConvolutionPostProcess();
