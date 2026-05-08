/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import stereoscopicGamepadCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./stereoscopicGamepadCamera.pure";

import { registerStereoscopicGamepadCamera } from "./stereoscopicGamepadCamera.pure";
registerStereoscopicGamepadCamera();
