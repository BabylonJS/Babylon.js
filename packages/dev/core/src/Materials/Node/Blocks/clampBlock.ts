/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import clampBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./clampBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ClampBlock } from "./clampBlock.pure";

RegisterClass("BABYLON.ClampBlock", ClampBlock);
