/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryCrossBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryCrossBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryCrossBlock } from "./geometryCrossBlock.pure";

RegisterClass("BABYLON.GeometryCrossBlock", GeometryCrossBlock);
