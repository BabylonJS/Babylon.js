/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphSetPhysicsMotionTypeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSetPhysicsMotionTypeBlock.pure";

import { registerFlowGraphSetPhysicsMotionTypeBlock } from "./flowGraphSetPhysicsMotionTypeBlock.pure";
registerFlowGraphSetPhysicsMotionTypeBlock();
