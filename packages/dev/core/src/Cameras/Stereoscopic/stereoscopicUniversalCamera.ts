/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import stereoscopicUniversalCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./stereoscopicUniversalCamera.pure";

import { registerStereoscopicUniversalCamera } from "./stereoscopicUniversalCamera.pure";
registerStereoscopicUniversalCamera();
