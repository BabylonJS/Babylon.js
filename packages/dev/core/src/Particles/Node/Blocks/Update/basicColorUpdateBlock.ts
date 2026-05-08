/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import basicColorUpdateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./basicColorUpdateBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { BasicColorUpdateBlock } from "./basicColorUpdateBlock.pure";

RegisterClass("BABYLON.BasicColorUpdateBlock", BasicColorUpdateBlock);
