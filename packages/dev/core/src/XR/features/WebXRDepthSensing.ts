/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRDepthSensing.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRDepthSensing.pure";

import { RegisterWebXRDepthSensing } from "./WebXRDepthSensing.pure";
RegisterWebXRDepthSensing();
