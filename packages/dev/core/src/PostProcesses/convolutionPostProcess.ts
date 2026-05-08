/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import convolutionPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./convolutionPostProcess.pure";

import { registerConvolutionPostProcess } from "./convolutionPostProcess.pure";
registerConvolutionPostProcess();
