/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import clearCoatBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./clearCoatBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { ClearCoatBlock } from "./clearCoatBlock.pure";

RegisterClass("BABYLON.ClearCoatBlock", ClearCoatBlock);
