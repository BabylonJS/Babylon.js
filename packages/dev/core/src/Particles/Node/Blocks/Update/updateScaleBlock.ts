/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import updateScaleBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateScaleBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { UpdateScaleBlock } from "./updateScaleBlock.pure";

RegisterClass("BABYLON.UpdateScaleBlock", UpdateScaleBlock);
