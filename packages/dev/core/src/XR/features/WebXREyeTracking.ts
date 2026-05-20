/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXREyeTracking.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXREyeTracking.pure";

import { RegisterWebXREyeTracking } from "./WebXREyeTracking.pure";
RegisterWebXREyeTracking();
