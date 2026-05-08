/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import stereoscopicFreeCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./stereoscopicFreeCamera.pure";

import { RegisterStereoscopicFreeCamera } from "./stereoscopicFreeCamera.pure";
RegisterStereoscopicFreeCamera();
