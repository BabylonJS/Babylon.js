/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import pannerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pannerBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { PannerBlock } from "./pannerBlock.pure";

RegisterClass("BABYLON.PannerBlock", PannerBlock);
