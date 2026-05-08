/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphApplyImpulseBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphApplyImpulseBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphApplyImpulseBlock } from "./flowGraphApplyImpulseBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.PhysicsApplyImpulse, FlowGraphApplyImpulseBlock);
