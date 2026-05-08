/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import transformBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./transformBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { TransformBlock } from "./transformBlock.pure";

RegisterClass("BABYLON.TransformBlock", TransformBlock);
