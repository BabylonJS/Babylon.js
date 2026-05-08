/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import heightToNormalBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./heightToNormalBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { HeightToNormalBlock } from "./heightToNormalBlock.pure";

RegisterClass("BABYLON.HeightToNormalBlock", HeightToNormalBlock);
