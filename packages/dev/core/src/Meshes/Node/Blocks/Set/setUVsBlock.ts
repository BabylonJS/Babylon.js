/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import setUVsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setUVsBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { SetUVsBlock } from "./setUVsBlock.pure";

RegisterClass("BABYLON.SetUVsBlock", SetUVsBlock);
