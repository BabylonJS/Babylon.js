/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import prePassOutputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./prePassOutputBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { PrePassOutputBlock } from "./prePassOutputBlock.pure";

RegisterClass("BABYLON.PrePassOutputBlock", PrePassOutputBlock);
