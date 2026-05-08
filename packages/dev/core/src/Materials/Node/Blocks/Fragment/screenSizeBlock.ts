/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import screenSizeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./screenSizeBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { ScreenSizeBlock } from "./screenSizeBlock.pure";

RegisterClass("BABYLON.ScreenSizeBlock", ScreenSizeBlock);
