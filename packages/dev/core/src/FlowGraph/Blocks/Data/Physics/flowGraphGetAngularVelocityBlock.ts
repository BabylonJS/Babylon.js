/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphGetAngularVelocityBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphGetAngularVelocityBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphGetAngularVelocityBlock } from "./flowGraphGetAngularVelocityBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.PhysicsGetAngularVelocity, FlowGraphGetAngularVelocityBlock);
