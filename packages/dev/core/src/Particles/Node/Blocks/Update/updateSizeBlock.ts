/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import updateSizeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateSizeBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { UpdateSizeBlock } from "./updateSizeBlock.pure";

RegisterClass("BABYLON.UpdateSizeBlock", UpdateSizeBlock);
