/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import targetCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./targetCamera.pure";

import { registerTargetCamera } from "./targetCamera.pure";
registerTargetCamera();
