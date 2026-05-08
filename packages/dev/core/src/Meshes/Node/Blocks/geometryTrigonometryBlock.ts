/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryTrigonometryBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryTrigonometryBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryTrigonometryBlock } from "./geometryTrigonometryBlock.pure";

RegisterClass("BABYLON.GeometryTrigonometryBlock", GeometryTrigonometryBlock);
