export * from "./freeCameraVirtualJoystickInput.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import freeCameraVirtualJoystickInput.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./freeCameraVirtualJoystickInput.pure";

import { RegisterFreeCameraVirtualJoystickInput } from "./freeCameraVirtualJoystickInput.pure";
RegisterFreeCameraVirtualJoystickInput();
