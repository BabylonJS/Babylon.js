/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import rotationZBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./rotationZBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { RotationZBlock } from "./rotationZBlock.pure";

RegisterClass("BABYLON.RotationZBlock", RotationZBlock);
