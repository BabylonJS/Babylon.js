export * from "./gamepadSceneComponent.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gamepadSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gamepadSceneComponent.pure";

import { GamepadManager } from "./gamepadManager";
import { RegisterGamepadSceneComponent } from "./gamepadSceneComponent.pure";
RegisterGamepadSceneComponent(GamepadManager);
