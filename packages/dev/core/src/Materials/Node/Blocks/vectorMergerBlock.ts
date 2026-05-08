/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import vectorMergerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./vectorMergerBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { VectorMergerBlock } from "./vectorMergerBlock.pure";

RegisterClass("BABYLON.VectorMergerBlock", VectorMergerBlock);
