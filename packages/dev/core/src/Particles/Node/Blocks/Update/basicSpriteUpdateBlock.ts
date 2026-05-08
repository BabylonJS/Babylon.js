/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import basicSpriteUpdateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./basicSpriteUpdateBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { BasicSpriteUpdateBlock } from "./basicSpriteUpdateBlock.pure";

RegisterClass("BABYLON.BasicSpriteUpdateBlock", BasicSpriteUpdateBlock);
