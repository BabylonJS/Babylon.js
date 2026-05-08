/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryOutputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryOutputBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryOutputBlock } from "./geometryOutputBlock.pure";

RegisterClass("BABYLON.GeometryOutputBlock", GeometryOutputBlock);
