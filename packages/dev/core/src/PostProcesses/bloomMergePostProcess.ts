/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import bloomMergePostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./bloomMergePostProcess.pure";

import { registerBloomMergePostProcess } from "./bloomMergePostProcess.pure";
registerBloomMergePostProcess();
