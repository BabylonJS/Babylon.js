/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import modBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./modBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ModBlock } from "./modBlock.pure";

RegisterClass("BABYLON.ModBlock", ModBlock);
