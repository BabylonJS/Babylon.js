/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRRawCameraAccess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRRawCameraAccess.pure";

import { registerWebXRRawCameraAccess } from "./WebXRRawCameraAccess.pure";
registerWebXRRawCameraAccess();
