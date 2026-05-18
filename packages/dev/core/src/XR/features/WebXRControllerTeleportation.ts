/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRControllerTeleportation.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRControllerTeleportation.pure";

import { RegisterWebXRControllerTeleportation } from "./WebXRControllerTeleportation.pure";
RegisterWebXRControllerTeleportation();
