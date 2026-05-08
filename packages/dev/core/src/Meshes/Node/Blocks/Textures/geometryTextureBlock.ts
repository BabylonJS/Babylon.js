/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryTextureBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryTextureBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { GeometryTextureBlock } from "./geometryTextureBlock.pure";

RegisterClass("BABYLON.GeometryTextureBlock", GeometryTextureBlock);
