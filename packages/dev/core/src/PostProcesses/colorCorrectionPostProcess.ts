/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import colorCorrectionPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./colorCorrectionPostProcess.pure";

import { RegisterColorCorrectionPostProcess } from "./colorCorrectionPostProcess.pure";
RegisterColorCorrectionPostProcess();
