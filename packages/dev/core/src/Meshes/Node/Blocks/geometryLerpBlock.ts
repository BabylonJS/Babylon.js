/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryLerpBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryLerpBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryLerpBlock } from "./geometryLerpBlock.pure";

RegisterClass("BABYLON.GeometryLerpBlock", GeometryLerpBlock);
