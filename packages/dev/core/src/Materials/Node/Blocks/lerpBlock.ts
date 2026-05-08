/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import lerpBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./lerpBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { LerpBlock } from "./lerpBlock.pure";

RegisterClass("BABYLON.LerpBlock", LerpBlock);
