/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import nLerpBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./nLerpBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { NLerpBlock } from "./nLerpBlock.pure";

RegisterClass("BABYLON.NLerpBlock", NLerpBlock);
