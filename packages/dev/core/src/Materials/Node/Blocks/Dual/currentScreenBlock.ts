/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import currentScreenBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./currentScreenBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { CurrentScreenBlock } from "./currentScreenBlock.pure";

RegisterClass("BABYLON.CurrentScreenBlock", CurrentScreenBlock);
