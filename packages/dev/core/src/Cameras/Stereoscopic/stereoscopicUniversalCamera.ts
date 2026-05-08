/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import stereoscopicUniversalCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./stereoscopicUniversalCamera.pure";

import { RegisterStereoscopicUniversalCamera } from "./stereoscopicUniversalCamera.pure";
RegisterStereoscopicUniversalCamera();
