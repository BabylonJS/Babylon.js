/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRImageTracking.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRImageTracking.pure";

import { registerWebXRImageTracking } from "./WebXRImageTracking.pure";
registerWebXRImageTracking();
