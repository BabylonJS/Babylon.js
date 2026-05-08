/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import tonemapPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./tonemapPostProcess.pure";

import { registerTonemapPostProcess } from "./tonemapPostProcess.pure";
registerTonemapPostProcess();
