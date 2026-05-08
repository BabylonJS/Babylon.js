/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryNLerpBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryNLerpBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryNLerpBlock } from "./geometryNLerpBlock.pure";

RegisterClass("BABYLON.GeometryNLerpBlock", GeometryNLerpBlock);
