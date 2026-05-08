/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import freeCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./freeCamera.pure";

import { registerFreeCamera } from "./freeCamera.pure";
registerFreeCamera();
