/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryTransformBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryTransformBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryTransformBlock } from "./geometryTransformBlock.pure";

RegisterClass("BABYLON.GeometryTransformBlock", GeometryTransformBlock);
