/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import minBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./minBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { MinBlock } from "./minBlock.pure";

RegisterClass("BABYLON.MinBlock", MinBlock);
