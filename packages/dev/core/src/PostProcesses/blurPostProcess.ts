/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import blurPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./blurPostProcess.pure";

import { RegisterBlurPostProcess } from "./blurPostProcess.pure";
RegisterBlurPostProcess();
