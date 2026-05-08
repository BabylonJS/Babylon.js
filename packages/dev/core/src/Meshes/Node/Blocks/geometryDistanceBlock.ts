/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryDistanceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryDistanceBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryDistanceBlock } from "./geometryDistanceBlock.pure";

RegisterClass("BABYLON.GeometryDistanceBlock", GeometryDistanceBlock);
