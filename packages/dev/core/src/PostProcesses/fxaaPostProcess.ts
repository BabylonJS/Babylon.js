/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fxaaPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fxaaPostProcess.pure";

import { RegisterFxaaPostProcess } from "./fxaaPostProcess.pure";
RegisterFxaaPostProcess();
