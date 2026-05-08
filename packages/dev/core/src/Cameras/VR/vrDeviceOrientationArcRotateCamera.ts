/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import vrDeviceOrientationArcRotateCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./vrDeviceOrientationArcRotateCamera.pure";

import { registerVrDeviceOrientationArcRotateCamera } from "./vrDeviceOrientationArcRotateCamera.pure";
registerVrDeviceOrientationArcRotateCamera();
