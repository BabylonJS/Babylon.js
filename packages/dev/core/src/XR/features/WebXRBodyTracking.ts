/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRBodyTracking.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRBodyTracking.pure";

import { RegisterWebXRBodyTracking } from "./WebXRBodyTracking.pure";
RegisterWebXRBodyTracking();
