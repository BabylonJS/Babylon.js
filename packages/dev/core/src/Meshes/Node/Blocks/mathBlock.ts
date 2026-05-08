/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import mathBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./mathBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { MathBlock } from "./mathBlock.pure";

RegisterClass("BABYLON.MathBlock", MathBlock);
