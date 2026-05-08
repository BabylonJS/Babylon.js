/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import joinedPhysicsEngineComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./joinedPhysicsEngineComponent.pure";

import { registerJoinedPhysicsEngineComponent } from "./joinedPhysicsEngineComponent.pure";
registerJoinedPhysicsEngineComponent();
