/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import rotate2dBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./rotate2dBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { Rotate2dBlock } from "./rotate2dBlock.pure";

RegisterClass("BABYLON.Rotate2dBlock", Rotate2dBlock);
