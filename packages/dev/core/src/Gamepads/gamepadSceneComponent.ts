export * from "./gamepadSceneComponent.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import gamepadSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gamepadSceneComponent.pure";

import { RegisterGamepadSceneComponent } from "./gamepadSceneComponent.pure";
RegisterGamepadSceneComponent();
