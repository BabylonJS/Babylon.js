/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphApplyForceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphApplyForceBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphApplyForceBlock } from "./flowGraphApplyForceBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.PhysicsApplyForce, FlowGraphApplyForceBlock);
