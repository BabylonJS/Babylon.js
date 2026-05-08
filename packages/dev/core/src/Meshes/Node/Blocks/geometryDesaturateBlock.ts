/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryDesaturateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryDesaturateBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryDesaturateBlock } from "./geometryDesaturateBlock.pure";

RegisterClass("BABYLON.GeometryDesaturateBlock", GeometryDesaturateBlock);
