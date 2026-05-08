/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import physicsEngineComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./physicsEngineComponent.pure";

import { registerPhysicsV2PhysicsEngineComponent } from "./physicsEngineComponent.pure";
registerPhysicsV2PhysicsEngineComponent();
