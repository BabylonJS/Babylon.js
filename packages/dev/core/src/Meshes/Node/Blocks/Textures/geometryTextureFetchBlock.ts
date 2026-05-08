/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryTextureFetchBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryTextureFetchBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { GeometryTextureFetchBlock } from "./geometryTextureFetchBlock.pure";

RegisterClass("BABYLON.GeometryTextureFetchBlock", GeometryTextureFetchBlock);
