/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRBodyTracking.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRBodyTracking.pure";

import { registerWebXRBodyTracking } from "./WebXRBodyTracking.pure";
registerWebXRBodyTracking();
