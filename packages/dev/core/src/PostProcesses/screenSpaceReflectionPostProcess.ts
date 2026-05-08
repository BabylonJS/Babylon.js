/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import screenSpaceReflectionPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./screenSpaceReflectionPostProcess.pure";

import { registerScreenSpaceReflectionPostProcess } from "./screenSpaceReflectionPostProcess.pure";
registerScreenSpaceReflectionPostProcess();
