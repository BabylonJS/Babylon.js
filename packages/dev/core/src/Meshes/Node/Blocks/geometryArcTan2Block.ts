/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryArcTan2Block.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryArcTan2Block.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryArcTan2Block } from "./geometryArcTan2Block.pure";

RegisterClass("BABYLON.GeometryArcTan2Block", GeometryArcTan2Block);
