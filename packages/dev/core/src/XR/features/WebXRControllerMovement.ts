/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRControllerMovement.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRControllerMovement.pure";

import { registerWebXRControllerMovement } from "./WebXRControllerMovement.pure";
registerWebXRControllerMovement();
