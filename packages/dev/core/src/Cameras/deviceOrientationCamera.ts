/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import deviceOrientationCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./deviceOrientationCamera.pure";

import { RegisterDeviceOrientationCamera } from "./deviceOrientationCamera.pure";
RegisterDeviceOrientationCamera();
