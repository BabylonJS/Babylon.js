/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRLightEstimation.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRLightEstimation.pure";

import { RegisterWebXRLightEstimation } from "./WebXRLightEstimation.pure";
RegisterWebXRLightEstimation();
