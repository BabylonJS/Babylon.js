/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import chromaticAberrationPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./chromaticAberrationPostProcess.pure";

import { registerChromaticAberrationPostProcess } from "./chromaticAberrationPostProcess.pure";
registerChromaticAberrationPostProcess();
