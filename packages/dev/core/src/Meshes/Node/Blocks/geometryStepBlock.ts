/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryStepBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryStepBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryStepBlock } from "./geometryStepBlock.pure";

RegisterClass("BABYLON.GeometryStepBlock", GeometryStepBlock);
