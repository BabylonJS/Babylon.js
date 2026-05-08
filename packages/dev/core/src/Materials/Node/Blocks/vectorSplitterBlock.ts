/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import vectorSplitterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./vectorSplitterBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { VectorSplitterBlock } from "./vectorSplitterBlock.pure";

RegisterClass("BABYLON.VectorSplitterBlock", VectorSplitterBlock);
