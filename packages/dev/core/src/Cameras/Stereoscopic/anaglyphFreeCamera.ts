/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import anaglyphFreeCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./anaglyphFreeCamera.pure";

import { registerAnaglyphFreeCamera } from "./anaglyphFreeCamera.pure";
registerAnaglyphFreeCamera();
