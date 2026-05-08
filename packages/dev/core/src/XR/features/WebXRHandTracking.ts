/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRHandTracking.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRHandTracking.pure";

import { registerWebXRHandTracking } from "./WebXRHandTracking.pure";
registerWebXRHandTracking();
