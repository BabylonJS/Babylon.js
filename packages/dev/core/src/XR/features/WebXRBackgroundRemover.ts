/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRBackgroundRemover.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRBackgroundRemover.pure";

import { registerWebXRBackgroundRemover } from "./WebXRBackgroundRemover.pure";
registerWebXRBackgroundRemover();
