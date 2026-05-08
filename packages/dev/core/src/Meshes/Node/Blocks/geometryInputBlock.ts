/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryInputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryInputBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryInputBlock } from "./geometryInputBlock.pure";

RegisterClass("BABYLON.GeometryInputBlock", GeometryInputBlock);
