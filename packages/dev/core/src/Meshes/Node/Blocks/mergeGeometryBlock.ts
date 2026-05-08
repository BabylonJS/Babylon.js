/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import mergeGeometryBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./mergeGeometryBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { MergeGeometryBlock } from "./mergeGeometryBlock.pure";

RegisterClass("BABYLON.MergeGeometryBlock", MergeGeometryBlock);
