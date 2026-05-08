/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphPhysicsCollisionEventBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphPhysicsCollisionEventBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { FlowGraphPhysicsCollisionEventBlock } from "./flowGraphPhysicsCollisionEventBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.PhysicsCollisionEvent, FlowGraphPhysicsCollisionEventBlock);
