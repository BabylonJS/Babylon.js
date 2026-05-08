/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import updateAttractorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateAttractorBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { UpdateAttractorBlock } from "./updateAttractorBlock.pure";

RegisterClass("BABYLON.UpdateAttractorBlock", UpdateAttractorBlock);
