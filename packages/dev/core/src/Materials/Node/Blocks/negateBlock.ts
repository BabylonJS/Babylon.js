/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import negateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./negateBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { NegateBlock } from "./negateBlock.pure";

RegisterClass("BABYLON.NegateBlock", NegateBlock);
