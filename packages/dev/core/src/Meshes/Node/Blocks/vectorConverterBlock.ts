/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import vectorConverterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./vectorConverterBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { VectorConverterBlock } from "./vectorConverterBlock.pure";

RegisterClass("BABYLON.VectorConverterBlock", VectorConverterBlock);
