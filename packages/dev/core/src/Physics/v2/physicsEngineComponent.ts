export * from "./physicsEngineComponent.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import physicsEngineComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./physicsEngineComponent.pure";

import { RegisterPhysicsV2PhysicsEngineComponent } from "./physicsEngineComponent.pure";
RegisterPhysicsV2PhysicsEngineComponent();
