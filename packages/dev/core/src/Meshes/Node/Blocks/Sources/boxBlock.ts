/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import boxBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./boxBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { BoxBlock } from "./boxBlock.pure";

RegisterClass("BABYLON.BoxBlock", BoxBlock);
