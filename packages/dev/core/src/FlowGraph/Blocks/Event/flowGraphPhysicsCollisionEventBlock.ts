/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphPhysicsCollisionEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPhysicsCollisionEventBlock.pure";

import { registerFlowGraphPhysicsCollisionEventBlock } from "./flowGraphPhysicsCollisionEventBlock.pure";
registerFlowGraphPhysicsCollisionEventBlock();
