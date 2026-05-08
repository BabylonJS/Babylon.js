/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import coneShapeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./coneShapeBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { ConeShapeBlock } from "./coneShapeBlock.pure";

RegisterClass("BABYLON.ConeShapeBlock", ConeShapeBlock);
