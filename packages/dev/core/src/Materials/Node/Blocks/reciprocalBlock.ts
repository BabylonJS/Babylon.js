/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import reciprocalBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./reciprocalBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ReciprocalBlock } from "./reciprocalBlock.pure";

RegisterClass("BABYLON.ReciprocalBlock", ReciprocalBlock);
