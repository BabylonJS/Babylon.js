/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryInfoBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryInfoBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryInfoBlock } from "./geometryInfoBlock.pure";

RegisterClass("BABYLON.GeometryInfoBlock", GeometryInfoBlock);
