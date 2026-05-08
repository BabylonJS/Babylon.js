/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import filterPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./filterPostProcess.pure";

import { registerFilterPostProcess } from "./filterPostProcess.pure";
registerFilterPostProcess();
