/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import colorSplitterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./colorSplitterBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ColorSplitterBlock } from "./colorSplitterBlock.pure";

RegisterClass("BABYLON.ColorSplitterBlock", ColorSplitterBlock);
