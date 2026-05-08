/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import posterizeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./posterizeBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { PosterizeBlock } from "./posterizeBlock.pure";

RegisterClass("BABYLON.PosterizeBlock", PosterizeBlock);
