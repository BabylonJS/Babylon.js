/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import rotationXBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./rotationXBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { RotationXBlock } from "./rotationXBlock.pure";

RegisterClass("BABYLON.RotationXBlock", RotationXBlock);
