/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import scaleBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./scaleBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ScaleBlock } from "./scaleBlock.pure";

RegisterClass("BABYLON.ScaleBlock", ScaleBlock);
