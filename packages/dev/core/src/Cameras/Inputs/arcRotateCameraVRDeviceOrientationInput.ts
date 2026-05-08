/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import arcRotateCameraVRDeviceOrientationInput.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./arcRotateCameraVRDeviceOrientationInput.pure";

import { registerArcRotateCameraVRDeviceOrientationInput } from "./arcRotateCameraVRDeviceOrientationInput.pure";
registerArcRotateCameraVRDeviceOrientationInput();
