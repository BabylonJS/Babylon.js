/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import grainPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./grainPostProcess.pure";

import { registerGrainPostProcess } from "./grainPostProcess.pure";
registerGrainPostProcess();
