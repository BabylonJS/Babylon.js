/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import colorConverterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./colorConverterBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ColorConverterBlock } from "./colorConverterBlock.pure";

RegisterClass("BABYLON.ColorConverterBlock", ColorConverterBlock);
