/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryPosterizeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryPosterizeBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryPosterizeBlock } from "./geometryPosterizeBlock.pure";

RegisterClass("BABYLON.GeometryPosterizeBlock", GeometryPosterizeBlock);
