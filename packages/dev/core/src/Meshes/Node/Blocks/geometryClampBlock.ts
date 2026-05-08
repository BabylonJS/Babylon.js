/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryClampBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryClampBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryClampBlock } from "./geometryClampBlock.pure";

RegisterClass("BABYLON.GeometryClampBlock", GeometryClampBlock);
