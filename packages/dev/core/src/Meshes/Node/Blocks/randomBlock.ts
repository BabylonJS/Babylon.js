/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import randomBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./randomBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { RandomBlock } from "./randomBlock.pure";

RegisterClass("BABYLON.RandomBlock", RandomBlock);
