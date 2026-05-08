/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryOptimizeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryOptimizeBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryOptimizeBlock } from "./geometryOptimizeBlock.pure";

RegisterClass("BABYLON.GeometryOptimizeBlock", GeometryOptimizeBlock);
