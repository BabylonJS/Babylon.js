/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import rotationYBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./rotationYBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { RotationYBlock } from "./rotationYBlock.pure";

RegisterClass("BABYLON.RotationYBlock", RotationYBlock);
