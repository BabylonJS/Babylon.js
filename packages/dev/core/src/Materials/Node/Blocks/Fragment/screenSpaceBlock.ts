/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import screenSpaceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./screenSpaceBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { ScreenSpaceBlock } from "./screenSpaceBlock.pure";

RegisterClass("BABYLON.ScreenSpaceBlock", ScreenSpaceBlock);
