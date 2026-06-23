/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRControllerPhysics.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRControllerPhysics.pure";

import { RegisterWebXRControllerPhysics } from "./WebXRControllerPhysics.pure";
RegisterWebXRControllerPhysics();
