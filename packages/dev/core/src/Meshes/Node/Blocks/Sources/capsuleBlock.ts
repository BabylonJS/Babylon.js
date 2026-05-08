/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import capsuleBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./capsuleBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { CapsuleBlock } from "./capsuleBlock.pure";

RegisterClass("BABYLON.CapsuleBlock", CapsuleBlock);
