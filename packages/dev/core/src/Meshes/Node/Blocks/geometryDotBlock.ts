/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryDotBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryDotBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryDotBlock } from "./geometryDotBlock.pure";

RegisterClass("BABYLON.GeometryDotBlock", GeometryDotBlock);
