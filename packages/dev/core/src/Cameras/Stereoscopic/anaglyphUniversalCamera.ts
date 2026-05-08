/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import anaglyphUniversalCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./anaglyphUniversalCamera.pure";

import { registerAnaglyphUniversalCamera } from "./anaglyphUniversalCamera.pure";
registerAnaglyphUniversalCamera();
