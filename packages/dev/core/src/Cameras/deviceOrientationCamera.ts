/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import deviceOrientationCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./deviceOrientationCamera.pure";

import { registerDeviceOrientationCamera } from "./deviceOrientationCamera.pure";
registerDeviceOrientationCamera();
