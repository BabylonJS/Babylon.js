/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import updateSpriteCellIndexBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateSpriteCellIndexBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { UpdateSpriteCellIndexBlock } from "./updateSpriteCellIndexBlock.pure";

RegisterClass("BABYLON.UpdateSpriteCellIndexBlock", UpdateSpriteCellIndexBlock);
