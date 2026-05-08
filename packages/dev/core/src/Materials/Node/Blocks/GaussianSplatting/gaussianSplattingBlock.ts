/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import gaussianSplattingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianSplattingBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { GaussianSplattingBlock } from "./gaussianSplattingBlock.pure";

RegisterClass("BABYLON.GaussianSplattingBlock", GaussianSplattingBlock);
