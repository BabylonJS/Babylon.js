/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import gradientBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gradientBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GradientBlock } from "./gradientBlock.pure";

RegisterClass("BABYLON.GradientBlock", GradientBlock);
