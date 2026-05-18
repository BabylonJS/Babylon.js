/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRWalkingLocomotion.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRWalkingLocomotion.pure";

import { RegisterWebXRWalkingLocomotion } from "./WebXRWalkingLocomotion.pure";
RegisterWebXRWalkingLocomotion();
