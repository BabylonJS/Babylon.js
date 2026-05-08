/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryRotate2dBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryRotate2dBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryRotate2dBlock } from "./geometryRotate2dBlock.pure";

RegisterClass("BABYLON.GeometryRotate2dBlock", GeometryRotate2dBlock);
