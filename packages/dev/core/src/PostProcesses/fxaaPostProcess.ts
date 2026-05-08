/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fxaaPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fxaaPostProcess.pure";

import { registerFxaaPostProcess } from "./fxaaPostProcess.pure";
registerFxaaPostProcess();
