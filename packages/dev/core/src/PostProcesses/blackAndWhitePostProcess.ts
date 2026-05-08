/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import blackAndWhitePostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./blackAndWhitePostProcess.pure";

import { registerBlackAndWhitePostProcess } from "./blackAndWhitePostProcess.pure";
registerBlackAndWhitePostProcess();
