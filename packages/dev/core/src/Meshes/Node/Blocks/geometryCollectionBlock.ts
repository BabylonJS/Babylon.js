/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryCollectionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryCollectionBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryCollectionBlock } from "./geometryCollectionBlock.pure";

RegisterClass("BABYLON.GeometryCollectionBlock", GeometryCollectionBlock);
