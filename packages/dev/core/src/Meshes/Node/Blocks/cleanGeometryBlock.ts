/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import cleanGeometryBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./cleanGeometryBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { CleanGeometryBlock } from "./cleanGeometryBlock.pure";

RegisterClass("BABYLON.CleanGeometryBlock", CleanGeometryBlock);
