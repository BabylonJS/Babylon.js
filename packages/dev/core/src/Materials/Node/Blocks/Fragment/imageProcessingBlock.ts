/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import imageProcessingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./imageProcessingBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { ImageProcessingBlock } from "./imageProcessingBlock.pure";

RegisterClass("BABYLON.ImageProcessingBlock", ImageProcessingBlock);
