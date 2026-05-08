/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import prePassTextureBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./prePassTextureBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { PrePassTextureBlock } from "./prePassTextureBlock.pure";

RegisterClass("BABYLON.PrePassTextureBlock", PrePassTextureBlock);
