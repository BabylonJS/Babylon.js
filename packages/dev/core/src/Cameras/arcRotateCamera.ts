/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import arcRotateCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./arcRotateCamera.pure";

import { registerArcRotateCamera } from "./arcRotateCamera.pure";
registerArcRotateCamera();
