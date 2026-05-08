/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphSetAngularVelocityBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSetAngularVelocityBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphSetAngularVelocityBlock } from "./flowGraphSetAngularVelocityBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.PhysicsSetAngularVelocity, FlowGraphSetAngularVelocityBlock);
