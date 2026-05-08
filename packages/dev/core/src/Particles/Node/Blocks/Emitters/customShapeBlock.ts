/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import customShapeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./customShapeBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { CustomShapeBlock } from "./customShapeBlock.pure";

RegisterClass("BABYLON.CustomShapeBlock", CustomShapeBlock);
