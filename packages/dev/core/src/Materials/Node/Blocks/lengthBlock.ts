/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import lengthBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./lengthBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { LengthBlock } from "./lengthBlock.pure";

RegisterClass("BABYLON.LengthBlock", LengthBlock);
