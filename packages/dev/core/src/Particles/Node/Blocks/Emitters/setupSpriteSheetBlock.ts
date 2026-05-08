/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import setupSpriteSheetBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setupSpriteSheetBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { SetupSpriteSheetBlock } from "./setupSpriteSheetBlock.pure";

RegisterClass("BABYLON.SetupSpriteSheetBlock", SetupSpriteSheetBlock);
