/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import stereoscopicArcRotateCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./stereoscopicArcRotateCamera.pure";

import { registerStereoscopicArcRotateCamera } from "./stereoscopicArcRotateCamera.pure";
registerStereoscopicArcRotateCamera();
