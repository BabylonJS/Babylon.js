/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import bevelBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./bevelBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { BevelBlock } from "./bevelBlock.pure";

RegisterClass("BABYLON.BevelBlock", BevelBlock);
