/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import anaglyphArcRotateCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./anaglyphArcRotateCamera.pure";

import { registerAnaglyphArcRotateCamera } from "./anaglyphArcRotateCamera.pure";
registerAnaglyphArcRotateCamera();
