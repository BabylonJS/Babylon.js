/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import divideBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./divideBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { DivideBlock } from "./divideBlock.pure";

RegisterClass("BABYLON.DivideBlock", DivideBlock);
