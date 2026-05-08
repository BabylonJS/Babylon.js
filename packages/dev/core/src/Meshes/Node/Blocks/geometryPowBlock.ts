/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryPowBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryPowBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryPowBlock } from "./geometryPowBlock.pure";

RegisterClass("BABYLON.GeometryPowBlock", GeometryPowBlock);
