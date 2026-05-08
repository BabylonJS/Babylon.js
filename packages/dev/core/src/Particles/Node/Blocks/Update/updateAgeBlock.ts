/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import updateAgeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateAgeBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { UpdateAgeBlock } from "./updateAgeBlock.pure";

RegisterClass("BABYLON.UpdateAgeBlock", UpdateAgeBlock);
