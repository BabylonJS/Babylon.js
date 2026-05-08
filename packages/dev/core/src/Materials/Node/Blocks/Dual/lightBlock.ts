/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import lightBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./lightBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { LightBlock } from "./lightBlock.pure";

RegisterClass("BABYLON.LightBlock", LightBlock);
