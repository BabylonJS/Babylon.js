/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import updateAngleBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateAngleBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { UpdateAngleBlock } from "./updateAngleBlock.pure";

RegisterClass("BABYLON.UpdateAngleBlock", UpdateAngleBlock);
