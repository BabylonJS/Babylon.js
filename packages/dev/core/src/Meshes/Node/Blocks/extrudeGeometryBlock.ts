/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import extrudeGeometryBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./extrudeGeometryBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ExtrudeGeometryBlock } from "./extrudeGeometryBlock.pure";

RegisterClass("BABYLON.ExtrudeGeometryBlock", ExtrudeGeometryBlock);
