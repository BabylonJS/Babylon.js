/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import translationBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./translationBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { TranslationBlock } from "./translationBlock.pure";

RegisterClass("BABYLON.TranslationBlock", TranslationBlock);
