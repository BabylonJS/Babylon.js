/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRControllerPointerSelection.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRControllerPointerSelection.pure";

import { RegisterWebXRControllerPointerSelection } from "./WebXRControllerPointerSelection.pure";
RegisterWebXRControllerPointerSelection();
