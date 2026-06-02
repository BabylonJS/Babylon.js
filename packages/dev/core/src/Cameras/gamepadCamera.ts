/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gamepadCamera.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gamepadCamera.pure";

import { RegisterGamepadCamera } from "./gamepadCamera.pure";
RegisterGamepadCamera();
