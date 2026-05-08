/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import vrDeviceOrientationGamepadCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./vrDeviceOrientationGamepadCamera.pure";

import { RegisterVrDeviceOrientationGamepadCamera } from "./vrDeviceOrientationGamepadCamera.pure";
RegisterVrDeviceOrientationGamepadCamera();
