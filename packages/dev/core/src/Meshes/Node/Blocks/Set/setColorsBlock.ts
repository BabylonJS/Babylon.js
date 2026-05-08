/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import setColorsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setColorsBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { SetColorsBlock } from "./setColorsBlock.pure";

RegisterClass("BABYLON.SetColorsBlock", SetColorsBlock);
