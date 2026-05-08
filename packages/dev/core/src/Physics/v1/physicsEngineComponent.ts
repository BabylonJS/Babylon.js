export * from "./physicsEngineComponent.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import physicsEngineComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./physicsEngineComponent.pure";

import { registerPhysicsV1PhysicsEngineComponent } from "./physicsEngineComponent.pure";
registerPhysicsV1PhysicsEngineComponent();
