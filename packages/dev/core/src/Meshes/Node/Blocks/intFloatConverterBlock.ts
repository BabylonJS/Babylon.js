/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import intFloatConverterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./intFloatConverterBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { IntFloatConverterBlock } from "./intFloatConverterBlock.pure";

RegisterClass("BABYLON.IntFloatConverterBlock", IntFloatConverterBlock);
