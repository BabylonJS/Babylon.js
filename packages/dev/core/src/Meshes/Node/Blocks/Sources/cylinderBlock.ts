/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import cylinderBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./cylinderBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { CylinderBlock } from "./cylinderBlock.pure";

RegisterClass("BABYLON.CylinderBlock", CylinderBlock);
