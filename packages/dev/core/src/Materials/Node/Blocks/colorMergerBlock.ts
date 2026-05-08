/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import colorMergerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./colorMergerBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ColorMergerBlock } from "./colorMergerBlock.pure";

RegisterClass("BABYLON.ColorMergerBlock", ColorMergerBlock);
