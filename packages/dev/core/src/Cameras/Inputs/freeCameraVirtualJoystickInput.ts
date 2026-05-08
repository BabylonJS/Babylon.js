/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import freeCameraVirtualJoystickInput.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./freeCameraVirtualJoystickInput.pure";

import { registerFreeCameraVirtualJoystickInput } from "./freeCameraVirtualJoystickInput.pure";
registerFreeCameraVirtualJoystickInput();
