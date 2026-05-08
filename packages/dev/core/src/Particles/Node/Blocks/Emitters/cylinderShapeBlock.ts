/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import cylinderShapeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./cylinderShapeBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { CylinderShapeBlock } from "./cylinderShapeBlock.pure";

RegisterClass("BABYLON.CylinderShapeBlock", CylinderShapeBlock);
