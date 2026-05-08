/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometrySmoothStepBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometrySmoothStepBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometrySmoothStepBlock } from "./geometrySmoothStepBlock.pure";

RegisterClass("BABYLON.GeometrySmoothStepBlock", GeometrySmoothStepBlock);
