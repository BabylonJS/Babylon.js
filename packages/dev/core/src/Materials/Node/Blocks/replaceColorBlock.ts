/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import replaceColorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./replaceColorBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ReplaceColorBlock } from "./replaceColorBlock.pure";

RegisterClass("BABYLON.ReplaceColorBlock", ReplaceColorBlock);
