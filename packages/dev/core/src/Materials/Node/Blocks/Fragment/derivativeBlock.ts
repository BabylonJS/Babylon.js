/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import derivativeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./derivativeBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { DerivativeBlock } from "./derivativeBlock.pure";

RegisterClass("BABYLON.DerivativeBlock", DerivativeBlock);
