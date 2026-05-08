/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import discBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./discBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { DiscBlock } from "./discBlock.pure";

RegisterClass("BABYLON.DiscBlock", DiscBlock);
