/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphSetPhysicsMotionTypeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphSetPhysicsMotionTypeBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphSetPhysicsMotionTypeBlock } from "./flowGraphSetPhysicsMotionTypeBlock.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.PhysicsSetMotionType, FlowGraphSetPhysicsMotionTypeBlock);
