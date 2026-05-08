/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import sharpenPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sharpenPostProcess.pure";

import { RegisterSharpenPostProcess } from "./sharpenPostProcess.pure";
RegisterSharpenPostProcess();
