/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import sheenBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sheenBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { SheenBlock } from "./sheenBlock.pure";

RegisterClass("BABYLON.SheenBlock", SheenBlock);
