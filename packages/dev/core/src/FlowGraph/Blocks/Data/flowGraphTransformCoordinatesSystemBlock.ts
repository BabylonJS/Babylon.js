/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphTransformCoordinatesSystemBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphTransformCoordinatesSystemBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { FlowGraphTransformCoordinatesSystemBlock } from "./flowGraphTransformCoordinatesSystemBlock.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.TransformCoordinatesSystem, FlowGraphTransformCoordinatesSystemBlock);
