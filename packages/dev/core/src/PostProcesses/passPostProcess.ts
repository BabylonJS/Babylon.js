/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import passPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./passPostProcess.pure";

import { registerPassPostProcess } from "./passPostProcess.pure";
registerPassPostProcess();
