/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import discardBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./discardBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { DiscardBlock } from "./discardBlock.pure";

RegisterClass("BABYLON.DiscardBlock", DiscardBlock);
