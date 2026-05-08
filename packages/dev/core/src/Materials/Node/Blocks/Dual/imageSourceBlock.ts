/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import imageSourceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./imageSourceBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { ImageSourceBlock } from "./imageSourceBlock.pure";

RegisterClass("BABYLON.ImageSourceBlock", ImageSourceBlock);
