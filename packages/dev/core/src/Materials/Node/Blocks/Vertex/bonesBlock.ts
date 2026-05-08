/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import bonesBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./bonesBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { BonesBlock } from "./bonesBlock.pure";

RegisterClass("BABYLON.BonesBlock", BonesBlock);
