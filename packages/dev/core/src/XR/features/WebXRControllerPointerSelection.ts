/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRControllerPointerSelection.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRControllerPointerSelection.pure";

import { registerWebXRControllerPointerSelection } from "./WebXRControllerPointerSelection.pure";
registerWebXRControllerPointerSelection();
