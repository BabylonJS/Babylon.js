/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import TBNBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./TBNBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { TBNBlock } from "./TBNBlock.pure";

RegisterClass("BABYLON.TBNBlock", TBNBlock);
