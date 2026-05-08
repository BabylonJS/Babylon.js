/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import vrDeviceOrientationFreeCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./vrDeviceOrientationFreeCamera.pure";

import { registerVrDeviceOrientationFreeCamera } from "./vrDeviceOrientationFreeCamera.pure";
registerVrDeviceOrientationFreeCamera();
