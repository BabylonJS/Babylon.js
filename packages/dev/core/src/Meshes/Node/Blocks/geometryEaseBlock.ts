/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryEaseBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryEaseBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryEaseBlock } from "./geometryEaseBlock.pure";

RegisterClass("BABYLON.GeometryEaseBlock", GeometryEaseBlock);
