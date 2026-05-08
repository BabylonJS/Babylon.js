/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryLengthBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryLengthBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryLengthBlock } from "./geometryLengthBlock.pure";

RegisterClass("BABYLON.GeometryLengthBlock", GeometryLengthBlock);
