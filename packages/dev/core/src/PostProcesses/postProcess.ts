/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import postProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./postProcess.pure";

import { registerPostProcess } from "./postProcess.pure";
registerPostProcess();
